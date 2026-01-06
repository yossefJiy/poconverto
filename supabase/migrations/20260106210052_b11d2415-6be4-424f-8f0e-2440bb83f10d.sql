-- Add modules_order column to clients for custom module ordering per client
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS modules_order JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the field
COMMENT ON COLUMN public.clients.modules_order IS 'Custom module display order per client. Keys are module names, values are sort order numbers. Overrides global defaults.';
