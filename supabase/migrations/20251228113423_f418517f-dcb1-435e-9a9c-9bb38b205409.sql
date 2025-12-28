-- Add is_ecommerce flag to clients table
ALTER TABLE public.clients 
ADD COLUMN is_ecommerce boolean DEFAULT false;