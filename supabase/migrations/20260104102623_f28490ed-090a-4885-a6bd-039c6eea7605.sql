-- ============================================
-- 1. Sub-tasks table for tasks module
-- ============================================
CREATE TABLE public.task_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assignee_id UUID REFERENCES public.team(id),
  due_date DATE,
  sort_order INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_subtasks
CREATE POLICY "Users can view subtasks for tasks they can access"
ON public.task_subtasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = parent_task_id
    AND has_client_access(auth.uid(), t.client_id)
  )
);

CREATE POLICY "Team members can manage subtasks"
ON public.task_subtasks
FOR ALL
USING (has_role_level(auth.uid(), 'team_member'::app_role))
WITH CHECK (has_role_level(auth.uid(), 'team_member'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_task_subtasks_updated_at
BEFORE UPDATE ON public.task_subtasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. AI Module Settings (per client per module)
-- ============================================
CREATE TABLE public.ai_module_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  allowed_capabilities TEXT[] DEFAULT '{}',
  restricted_for_users UUID[] DEFAULT '{}',
  allowed_for_users UUID[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, module_name)
);

-- Enable RLS
ALTER TABLE public.ai_module_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view AI settings for assigned clients"
ON public.ai_module_settings
FOR SELECT
USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "Managers can manage AI settings"
ON public.ai_module_settings
FOR ALL
USING (has_role_level(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role_level(auth.uid(), 'manager'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_ai_module_settings_updated_at
BEFORE UPDATE ON public.ai_module_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. AI Team Permissions (per team member)
-- ============================================
CREATE TABLE public.ai_team_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID REFERENCES public.team(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  can_use_ai BOOLEAN DEFAULT true,
  can_approve_actions BOOLEAN DEFAULT false,
  max_daily_requests INTEGER DEFAULT 50,
  current_daily_requests INTEGER DEFAULT 0,
  last_reset_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_member_id, client_id, module_name)
);

-- Enable RLS
ALTER TABLE public.ai_team_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own AI permissions"
ON public.ai_team_permissions
FOR SELECT
USING (
  has_role_level(auth.uid(), 'manager'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.team t
    WHERE t.id = team_member_id AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Managers can manage AI permissions"
ON public.ai_team_permissions
FOR ALL
USING (has_role_level(auth.uid(), 'manager'::app_role))
WITH CHECK (has_role_level(auth.uid(), 'manager'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_ai_team_permissions_updated_at
BEFORE UPDATE ON public.ai_team_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();