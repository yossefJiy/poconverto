-- Create agency_agents table for master agents
CREATE TABLE public.agency_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  agent_type TEXT NOT NULL DEFAULT 'master',
  capabilities TEXT[] DEFAULT ARRAY['coordinate', 'report', 'monitor', 'optimize']::TEXT[],
  settings JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client_agent_tokens for widget API access
CREATE TABLE public.client_agent_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Default Token',
  is_active BOOLEAN DEFAULT true,
  allowed_origins TEXT[] DEFAULT ARRAY[]::TEXT[],
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 1000,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create widget_configurations for embedded widgets
CREATE TABLE public.widget_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES public.client_agent_tokens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme JSONB DEFAULT '{"primaryColor": "#6366f1", "position": "bottom-right", "size": "medium"}'::JSONB,
  welcome_message TEXT DEFAULT 'שלום! איך אוכל לעזור לך היום?',
  suggested_prompts TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create widget_conversations for tracking widget chats
CREATE TABLE public.widget_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  widget_id UUID NOT NULL REFERENCES public.widget_configurations(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  visitor_info JSONB DEFAULT '{}'::JSONB,
  messages JSONB[] DEFAULT ARRAY[]::JSONB[],
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Add agency_agent_id to link client agents to master agent
ALTER TABLE public.ai_agents 
ADD COLUMN agency_agent_id UUID REFERENCES public.agency_agents(id);

-- Enable RLS
ALTER TABLE public.agency_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_agent_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_agents
CREATE POLICY "Admins can manage agency agents"
ON public.agency_agents FOR ALL
USING (has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team members can view agency agents"
ON public.agency_agents FOR SELECT
USING (has_role_level(auth.uid(), 'team_member'::app_role));

-- RLS Policies for client_agent_tokens
CREATE POLICY "Team members can manage tokens for assigned clients"
ON public.client_agent_tokens FOR ALL
USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_member'::app_role));

CREATE POLICY "Users can view tokens for assigned clients"
ON public.client_agent_tokens FOR SELECT
USING (has_client_access(auth.uid(), client_id));

-- RLS Policies for widget_configurations
CREATE POLICY "Team members can manage widgets for assigned clients"
ON public.widget_configurations FOR ALL
USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_member'::app_role));

CREATE POLICY "Users can view widgets for assigned clients"
ON public.widget_configurations FOR SELECT
USING (has_client_access(auth.uid(), client_id));

-- RLS Policies for widget_conversations (public insert for visitors)
CREATE POLICY "Anyone can create widget conversations"
ON public.widget_conversations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Team members can view conversations for their widgets"
ON public.widget_conversations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM widget_configurations wc
  WHERE wc.id = widget_id AND has_client_access(auth.uid(), wc.client_id)
));

CREATE POLICY "System can update conversations"
ON public.widget_conversations FOR UPDATE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_agency_agents_updated_at
BEFORE UPDATE ON public.agency_agents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_agent_tokens_updated_at
BEFORE UPDATE ON public.client_agent_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_widget_configurations_updated_at
BEFORE UPDATE ON public.widget_configurations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default master agent for JIY agency
INSERT INTO public.agency_agents (name, description, agent_type, capabilities, settings)
VALUES (
  'JIY Master Agent',
  'סוכן-על של סוכנות JIY שמתאם בין כל סוכני הלקוחות',
  'master',
  ARRAY['coordinate', 'report', 'monitor', 'optimize', 'cross_client_insights', 'resource_allocation']::TEXT[],
  jsonb_build_object(
    'priority_order', ARRAY['critical', 'high', 'medium', 'low'],
    'auto_escalate', true,
    'report_frequency', 'daily',
    'aggregation_enabled', true
  )
);