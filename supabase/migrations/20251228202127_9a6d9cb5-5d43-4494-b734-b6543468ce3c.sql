-- Drop existing policies on integrations table
DROP POLICY IF EXISTS "Team leads and above can view integrations for assigned clients" ON public.integrations;
DROP POLICY IF EXISTS "Managers and above can manage integrations" ON public.integrations;

-- Create a view for non-sensitive integration data (for team leads)
CREATE OR REPLACE VIEW public.integrations_safe AS
SELECT 
  id,
  client_id,
  platform,
  is_connected,
  last_sync_at,
  settings,
  created_at,
  updated_at
  -- encrypted_credentials and external_account_id are intentionally excluded
FROM public.integrations;

-- Grant access to the view
GRANT SELECT ON public.integrations_safe TO authenticated;

-- New policy: Only managers and above can SELECT integrations (with credentials)
CREATE POLICY "Managers can view full integrations for assigned clients" 
ON public.integrations 
FOR SELECT 
USING (
  has_client_access(auth.uid(), client_id) 
  AND has_role_level(auth.uid(), 'manager'::app_role)
);

-- Policy for INSERT - managers only
CREATE POLICY "Managers can insert integrations" 
ON public.integrations 
FOR INSERT 
WITH CHECK (
  has_client_access(auth.uid(), client_id) 
  AND has_role_level(auth.uid(), 'manager'::app_role)
);

-- Policy for UPDATE - managers only
CREATE POLICY "Managers can update integrations" 
ON public.integrations 
FOR UPDATE 
USING (
  has_client_access(auth.uid(), client_id) 
  AND has_role_level(auth.uid(), 'manager'::app_role)
);

-- Policy for DELETE - managers only
CREATE POLICY "Managers can delete integrations" 
ON public.integrations 
FOR DELETE 
USING (
  has_client_access(auth.uid(), client_id) 
  AND has_role_level(auth.uid(), 'manager'::app_role)
);

-- Add comment explaining the security model
COMMENT ON TABLE public.integrations IS 'Integration credentials - restricted to managers and above. Team leads should use integrations_safe view.';
COMMENT ON VIEW public.integrations_safe IS 'Safe view of integrations without sensitive credentials - accessible to team leads and above.';