-- Add shopify_email column to clients table for integration identification
ALTER TABLE public.clients 
ADD COLUMN shopify_email text;

-- Update TD TAMAR DRORY with the Shopify email
UPDATE public.clients 
SET shopify_email = 'tdcollection1@gmail.com'
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';