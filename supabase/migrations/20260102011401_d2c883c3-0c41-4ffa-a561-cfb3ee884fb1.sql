
-- AI Agents table - store custom agent configurations
CREATE TABLE public.ai_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  agent_type TEXT NOT NULL DEFAULT 'general',
  capabilities TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Agent Actions - proposed and executed actions
CREATE TABLE public.ai_agent_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Client Insights - store historical performance data and insights
CREATE TABLE public.client_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metrics JSONB DEFAULT '{}',
  insights JSONB DEFAULT '{}',
  recommendations TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Client Performance History - track KPIs over time
CREATE TABLE public.client_performance_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  source TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_performance_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_agents
CREATE POLICY "Users can view ai_agents" ON public.ai_agents FOR SELECT USING (true);
CREATE POLICY "Users can insert ai_agents" ON public.ai_agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update ai_agents" ON public.ai_agents FOR UPDATE USING (true);
CREATE POLICY "Users can delete ai_agents" ON public.ai_agents FOR DELETE USING (true);

-- RLS Policies for ai_agent_actions
CREATE POLICY "Users can view ai_agent_actions" ON public.ai_agent_actions FOR SELECT USING (true);
CREATE POLICY "Users can insert ai_agent_actions" ON public.ai_agent_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update ai_agent_actions" ON public.ai_agent_actions FOR UPDATE USING (true);
CREATE POLICY "Users can delete ai_agent_actions" ON public.ai_agent_actions FOR DELETE USING (true);

-- RLS Policies for client_insights
CREATE POLICY "Users can view client_insights" ON public.client_insights FOR SELECT USING (true);
CREATE POLICY "Users can insert client_insights" ON public.client_insights FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update client_insights" ON public.client_insights FOR UPDATE USING (true);

-- RLS Policies for client_performance_history
CREATE POLICY "Users can view client_performance_history" ON public.client_performance_history FOR SELECT USING (true);
CREATE POLICY "Users can insert client_performance_history" ON public.client_performance_history FOR INSERT WITH CHECK (true);

-- Indexes for better query performance
CREATE INDEX idx_ai_agents_client_id ON public.ai_agents(client_id);
CREATE INDEX idx_ai_agent_actions_agent_id ON public.ai_agent_actions(agent_id);
CREATE INDEX idx_ai_agent_actions_status ON public.ai_agent_actions(status);
CREATE INDEX idx_client_insights_client_id ON public.client_insights(client_id);
CREATE INDEX idx_client_insights_type ON public.client_insights(insight_type);
CREATE INDEX idx_client_performance_history_client_id ON public.client_performance_history(client_id);
CREATE INDEX idx_client_performance_history_metric ON public.client_performance_history(metric_name);
CREATE INDEX idx_client_performance_history_recorded_at ON public.client_performance_history(recorded_at);

-- Update trigger for ai_agents
CREATE TRIGGER update_ai_agents_updated_at
BEFORE UPDATE ON public.ai_agents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
