-- Add module settings columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS modules_enabled jsonb DEFAULT '{
  "dashboard": true,
  "analytics": true,
  "ecommerce": false,
  "marketing": true,
  "campaigns": true,
  "tasks": true,
  "team": true
}'::jsonb;

-- Add sync frequency to sync_schedules
ALTER TABLE public.sync_schedules
ADD COLUMN IF NOT EXISTS sync_frequency text DEFAULT 'daily';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_clients_modules ON public.clients USING gin(modules_enabled);