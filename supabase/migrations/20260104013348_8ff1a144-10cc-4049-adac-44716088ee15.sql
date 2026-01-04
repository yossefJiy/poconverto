-- Create AI query history table for tracking all AI requests
CREATE TABLE public.ai_query_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  model TEXT NOT NULL,
  issue_id UUID REFERENCES public.code_health_issues(id) ON DELETE SET NULL,
  issue_title TEXT,
  
  -- Token tracking
  input_tokens INTEGER,
  output_tokens INTEGER,
  
  -- Cost tracking (in USD)
  estimated_cost DECIMAL(10,6) DEFAULT 0,
  
  -- Content
  prompt_summary TEXT,
  response TEXT,
  citations JSONB DEFAULT '[]'::jsonb,
  provider TEXT,
  executed_actions JSONB DEFAULT '{}'::jsonb,
  
  -- Organizational links
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create AI usage limits table
CREATE TABLE public.ai_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Limit type
  limit_type TEXT NOT NULL CHECK (limit_type IN ('user', 'client', 'global')),
  target_id UUID, -- user_id or client_id (null for global)
  
  -- Daily limits
  daily_requests_limit INTEGER DEFAULT 50,
  daily_cost_limit DECIMAL(10,2) DEFAULT 5.00,
  
  -- Monthly limits
  monthly_requests_limit INTEGER DEFAULT 500,
  monthly_cost_limit DECIMAL(10,2) DEFAULT 50.00,
  
  -- Technical limits
  max_input_tokens INTEGER DEFAULT 4000,
  max_output_tokens INTEGER DEFAULT 2000,
  
  -- Model restrictions
  default_model TEXT DEFAULT 'openai/gpt-4o-mini',
  allowed_models TEXT[] DEFAULT ARRAY['openai/gpt-4o-mini', 'google/gemini-2.0-flash'],
  
  -- Premium model access (admin only by default)
  premium_models_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(limit_type, target_id)
);

-- Create AI usage alerts table
CREATE TABLE public.ai_usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  
  alert_type TEXT NOT NULL CHECK (alert_type IN ('80_percent', '90_percent', 'limit_reached')),
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'monthly')),
  threshold_percent INTEGER,
  current_usage DECIMAL(10,2),
  limit_value DECIMAL(10,2),
  
  sent_via TEXT DEFAULT 'in_app',
  is_read BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_query_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_query_history
CREATE POLICY "Users can view own AI history"
  ON public.ai_query_history FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all AI history"
  ON public.ai_query_history FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert AI history"
  ON public.ai_query_history FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ai_usage_limits
CREATE POLICY "Users can view own limits"
  ON public.ai_usage_limits FOR SELECT
  USING (
    (limit_type = 'global') OR
    (limit_type = 'user' AND target_id = auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can manage limits"
  ON public.ai_usage_limits FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for ai_usage_alerts
CREATE POLICY "Users can view own alerts"
  ON public.ai_usage_alerts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all alerts"
  ON public.ai_usage_alerts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own alerts"
  ON public.ai_usage_alerts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert alerts"
  ON public.ai_usage_alerts FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_ai_history_user ON public.ai_query_history(created_by);
CREATE INDEX idx_ai_history_client ON public.ai_query_history(client_id);
CREATE INDEX idx_ai_history_date ON public.ai_query_history(created_at DESC);
CREATE INDEX idx_ai_history_model ON public.ai_query_history(model);
CREATE INDEX idx_ai_alerts_user ON public.ai_usage_alerts(user_id);
CREATE INDEX idx_ai_alerts_unread ON public.ai_usage_alerts(user_id, is_read) WHERE is_read = false;

-- Insert default global limits
INSERT INTO public.ai_usage_limits (limit_type, target_id, daily_requests_limit, daily_cost_limit, monthly_requests_limit, monthly_cost_limit)
VALUES ('global', NULL, 100, 10.00, 1000, 100.00);

-- Trigger for updated_at
CREATE TRIGGER update_ai_usage_limits_updated_at
  BEFORE UPDATE ON public.ai_usage_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();