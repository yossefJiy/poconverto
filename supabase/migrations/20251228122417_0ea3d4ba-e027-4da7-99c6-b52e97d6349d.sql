-- Drop the SECURITY DEFINER view and recreate with SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.integrations_secure;

-- Create a secure view without SECURITY DEFINER
-- RLS on the base table will be respected
CREATE VIEW public.integrations_secure AS
SELECT 
  id,
  client_id,
  platform,
  external_account_id,
  is_connected,
  last_sync_at,
  created_at,
  updated_at,
  -- Mask sensitive fields in settings, keep only non-sensitive metadata
  jsonb_build_object(
    'connected_at', settings->>'connected_at',
    'last_sync_data', settings->'last_sync_data',
    'features', settings->'connection_data'->'features'
  ) as settings_masked,
  CASE WHEN encrypted_credentials IS NOT NULL THEN true ELSE false END as has_encrypted_credentials
FROM public.integrations;

-- Grant access to the secure view
GRANT SELECT ON public.integrations_secure TO authenticated;