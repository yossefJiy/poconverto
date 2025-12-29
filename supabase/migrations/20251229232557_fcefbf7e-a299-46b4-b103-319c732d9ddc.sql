-- Create function to cleanup expired 2FA codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_2fa_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.two_factor_codes
  WHERE expires_at < now();
END;
$$;

-- Schedule cleanup every hour via pg_cron
SELECT cron.schedule(
  '2fa-codes-cleanup',
  '0 * * * *', -- Every hour at minute 0
  $$SELECT public.cleanup_expired_2fa_codes()$$
);