-- Add unique constraint for upsert to work
ALTER TABLE public.analytics_snapshots 
ADD CONSTRAINT analytics_snapshots_client_platform_date_unique 
UNIQUE (client_id, platform, snapshot_date);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;