-- Add is_favorite column to clients table for favorite marking
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- Add is_agency_brand column to mark clients as agency brands
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS is_agency_brand boolean DEFAULT false;

-- Create index for faster favorite queries
CREATE INDEX IF NOT EXISTS idx_clients_is_favorite ON public.clients(is_favorite) WHERE is_favorite = true;