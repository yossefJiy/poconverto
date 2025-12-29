-- Remove is_ecommerce and is_lead_gen columns from clients table
ALTER TABLE public.clients DROP COLUMN IF EXISTS is_ecommerce;
ALTER TABLE public.clients DROP COLUMN IF EXISTS is_lead_gen;