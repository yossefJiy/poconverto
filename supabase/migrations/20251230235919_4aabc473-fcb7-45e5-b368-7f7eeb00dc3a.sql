-- Add is_master_account column to clients table
ALTER TABLE public.clients ADD COLUMN is_master_account boolean NOT NULL DEFAULT false;

-- Add scheduled_time and duration columns to tasks table
ALTER TABLE public.tasks ADD COLUMN scheduled_time time DEFAULT NULL;
ALTER TABLE public.tasks ADD COLUMN duration_minutes integer NOT NULL DEFAULT 60;

-- Create index for faster queries on master account
CREATE INDEX idx_clients_is_master_account ON public.clients(is_master_account) WHERE is_master_account = true;