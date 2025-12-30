-- Create trusted_devices table to remember devices after 2FA
CREATE TABLE public.trusted_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  trusted_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email, device_fingerprint)
);

-- Enable RLS
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- Allow anyone to check if device is trusted (needed before login)
CREATE POLICY "Anyone can check trusted devices"
ON public.trusted_devices
FOR SELECT
USING (true);

-- Allow insert/update for trusted devices (via edge function with service role)
CREATE POLICY "Service can manage trusted devices"
ON public.trusted_devices
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_trusted_devices_lookup ON public.trusted_devices(email, device_fingerprint);

-- Create function to cleanup expired devices
CREATE OR REPLACE FUNCTION public.cleanup_expired_trusted_devices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.trusted_devices WHERE trusted_until < now();
END;
$$;