-- Add platform manager URLs to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS google_ads_manager_url text,
ADD COLUMN IF NOT EXISTS facebook_ads_manager_url text;