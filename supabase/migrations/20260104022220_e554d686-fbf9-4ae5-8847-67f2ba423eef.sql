-- Step 2: Migrate existing roles to new structure (now that enum values are committed)
UPDATE public.user_roles SET role = 'agency_manager' WHERE role = 'manager';
UPDATE public.user_roles SET role = 'agency_manager' WHERE role = 'department_head';
UPDATE public.user_roles SET role = 'team_manager' WHERE role = 'team_lead';
UPDATE public.user_roles SET role = 'employee' WHERE role = 'team_member';
UPDATE public.user_roles SET role = 'basic_client' WHERE role = 'client';

-- Step 3: Update the has_role_level function with new hierarchy
CREATE OR REPLACE FUNCTION public.has_role_level(_user_id uuid, _min_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(
        CASE 
          WHEN _min_role = 'demo' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'team_manager', 'employee', 'premium_client', 'basic_client', 'demo']::app_role[]
          WHEN _min_role = 'basic_client' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'team_manager', 'employee', 'premium_client', 'basic_client']::app_role[]
          WHEN _min_role = 'premium_client' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'team_manager', 'employee', 'premium_client']::app_role[]
          WHEN _min_role = 'employee' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'team_manager', 'employee']::app_role[]
          WHEN _min_role = 'team_manager' THEN ARRAY['super_admin', 'admin', 'agency_manager', 'team_manager']::app_role[]
          WHEN _min_role = 'agency_manager' THEN ARRAY['super_admin', 'admin', 'agency_manager']::app_role[]
          WHEN _min_role = 'admin' THEN ARRAY['super_admin', 'admin']::app_role[]
          WHEN _min_role = 'super_admin' THEN ARRAY['super_admin']::app_role[]
          ELSE ARRAY[]::app_role[]
        END
      )
  )
$$;

-- Step 4: Create agent_memory table for storing agent knowledge
CREATE TABLE IF NOT EXISTS public.agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('insight', 'preference', 'fact', 'goal', 'learning', 'action_history')),
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  source TEXT CHECK (source IN ('conversation', 'analysis', 'user_input', 'system', 'action')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  CONSTRAINT agent_memory_agent_or_client CHECK (agent_id IS NOT NULL OR client_id IS NOT NULL)
);

-- Enable RLS on agent_memory
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_memory
CREATE POLICY "Users can view agent memory for assigned clients"
ON public.agent_memory
FOR SELECT
USING (
  client_id IS NULL OR has_client_access(auth.uid(), client_id)
);

CREATE POLICY "Employees can manage agent memory"
ON public.agent_memory
FOR ALL
USING (has_role_level(auth.uid(), 'employee'))
WITH CHECK (has_role_level(auth.uid(), 'employee'));

-- Step 5: Create function to auto-create agent for new clients
CREATE OR REPLACE FUNCTION public.create_client_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.ai_agents (
    client_id,
    name,
    description,
    agent_type,
    capabilities,
    settings,
    is_active
  ) VALUES (
    NEW.id,
    NEW.name || ' AI Agent',
    'סוכן AI ייעודי ל-' || NEW.name,
    'client_specific',
    ARRAY['analytics', 'insights', 'tasks', 'campaigns', 'reports']::text[],
    jsonb_build_object(
      'modules_enabled', NEW.modules_enabled,
      'created_automatically', true,
      'reputation_score', 0,
      'total_interactions', 0
    ),
    true
  );
  RETURN NEW;
END;
$$;

-- Create trigger for auto-creating agents
DROP TRIGGER IF EXISTS create_agent_for_new_client ON public.clients;
CREATE TRIGGER create_agent_for_new_client
  AFTER INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.create_client_agent();

-- Step 6: Initialize agents for existing clients that don't have one
INSERT INTO public.ai_agents (client_id, name, description, agent_type, capabilities, settings, is_active)
SELECT 
  c.id,
  c.name || ' AI Agent',
  'סוכן AI ייעודי ל-' || c.name,
  'client_specific',
  ARRAY['analytics', 'insights', 'tasks', 'campaigns', 'reports']::text[],
  jsonb_build_object(
    'modules_enabled', c.modules_enabled,
    'created_automatically', true,
    'reputation_score', 0,
    'total_interactions', 0
  ),
  true
FROM public.clients c
WHERE NOT EXISTS (
  SELECT 1 FROM public.ai_agents a WHERE a.client_id = c.id
);

-- Step 7: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_memory_client_id ON public.agent_memory(client_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_id ON public.agent_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_type ON public.agent_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_agents_client_id ON public.ai_agents(client_id);