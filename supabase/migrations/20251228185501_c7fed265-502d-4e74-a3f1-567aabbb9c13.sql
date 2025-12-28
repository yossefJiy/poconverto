
-- Create analytics snapshots table for quick data loading
CREATE TABLE public.analytics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, platform, snapshot_date)
);

-- Create sync_schedules table for configuring sync frequency
CREATE TABLE public.sync_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('hourly', 'daily', 'weekly')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, platform)
);

-- Enable RLS
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for analytics_snapshots
CREATE POLICY "Users can view snapshots for assigned clients"
ON public.analytics_snapshots
FOR SELECT
USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "Team members can manage snapshots"
ON public.analytics_snapshots
FOR ALL
USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_member'::app_role));

-- RLS policies for sync_schedules
CREATE POLICY "Users can view sync schedules for assigned clients"
ON public.sync_schedules
FOR SELECT
USING (has_client_access(auth.uid(), client_id));

CREATE POLICY "Team leads can manage sync schedules"
ON public.sync_schedules
FOR ALL
USING (has_client_access(auth.uid(), client_id) AND has_role_level(auth.uid(), 'team_lead'::app_role));

-- Indexes for performance
CREATE INDEX idx_analytics_snapshots_client_date ON public.analytics_snapshots(client_id, snapshot_date DESC);
CREATE INDEX idx_analytics_snapshots_platform ON public.analytics_snapshots(platform);
CREATE INDEX idx_sync_schedules_next_sync ON public.sync_schedules(next_sync_at) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_analytics_snapshots_updated_at
BEFORE UPDATE ON public.analytics_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_schedules_updated_at
BEFORE UPDATE ON public.sync_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
