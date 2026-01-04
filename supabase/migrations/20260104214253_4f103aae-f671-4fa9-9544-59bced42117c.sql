-- Add RLS policies for two_factor_codes table (email-based)
-- Users can view their own codes by email
CREATE POLICY "two_factor_codes_select" ON two_factor_codes 
  FOR SELECT TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow service role to insert (2FA codes are created server-side)
CREATE POLICY "two_factor_codes_service_insert" ON two_factor_codes 
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Allow authenticated users to delete their own codes
CREATE POLICY "two_factor_codes_delete" ON two_factor_codes 
  FOR DELETE TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));