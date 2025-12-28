-- Drop and recreate the view with SECURITY INVOKER and proper access filtering
DROP VIEW IF EXISTS public.integrations_safe;

-- Recreate view with security_invoker = true and access control
CREATE VIEW public.integrations_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  client_id,
  platform,
  is_connected,
  last_sync_at,
  settings,
  created_at,
  updated_at
FROM public.integrations
WHERE has_client_access(auth.uid(), client_id);

-- Grant access to the view
GRANT SELECT ON public.integrations_safe TO authenticated;

-- Update comment
COMMENT ON VIEW public.integrations_safe IS 'Safe view of integrations without credentials. Uses SECURITY INVOKER and filters by client access.';