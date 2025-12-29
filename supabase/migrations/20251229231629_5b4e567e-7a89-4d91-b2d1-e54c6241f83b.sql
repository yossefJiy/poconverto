-- Create table for storing service health history
CREATE TABLE public.service_health_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  latency_ms INTEGER,
  message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alert_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient queries on latest status per service
CREATE INDEX idx_service_health_latest ON public.service_health_history(service_name, checked_at DESC);

-- Index for cleanup queries
CREATE INDEX idx_service_health_cleanup ON public.service_health_history(checked_at);

-- Enable RLS
ALTER TABLE public.service_health_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view health history
CREATE POLICY "Admins can view health history"
  ON public.service_health_history
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert/update (for edge functions)
CREATE POLICY "Service role can manage health history"
  ON public.service_health_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.service_health_history IS 'Stores health check results for all services to detect status changes and send alerts';