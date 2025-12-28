-- Add is_lead_gen column to clients table for lead generation mode
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS is_lead_gen boolean DEFAULT true;

-- Add comment explaining the fields
COMMENT ON COLUMN public.clients.is_ecommerce IS 'Whether client has ecommerce/Shopify store functionality enabled';
COMMENT ON COLUMN public.clients.is_lead_gen IS 'Whether client has lead generation functionality enabled';