-- Fix security issues: Update trusted_devices RLS to be more restrictive
DROP POLICY IF EXISTS "Anyone can check trusted devices" ON public.trusted_devices;

CREATE POLICY "Users can only view their own trusted devices"
ON public.trusted_devices
FOR SELECT
USING (email = (SELECT auth.jwt() ->> 'email'));