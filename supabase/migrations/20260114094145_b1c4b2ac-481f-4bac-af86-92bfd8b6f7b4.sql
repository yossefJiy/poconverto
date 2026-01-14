-- Drop the existing problematic update policies
DROP POLICY IF EXISTS "Team members and above can update assigned clients" ON public.clients;
DROP POLICY IF EXISTS "clients_update" ON public.clients;

-- Create a single clear update policy with proper WITH CHECK
CREATE POLICY "clients_update_policy" ON public.clients
FOR UPDATE TO authenticated
USING (
  (has_client_access(auth.uid(), id) OR has_role_level(auth.uid(), 'admin'::app_role))
  AND has_role_level(auth.uid(), 'employee'::app_role)
)
WITH CHECK (
  (has_client_access(auth.uid(), id) OR has_role_level(auth.uid(), 'admin'::app_role))
  AND has_role_level(auth.uid(), 'employee'::app_role)
);