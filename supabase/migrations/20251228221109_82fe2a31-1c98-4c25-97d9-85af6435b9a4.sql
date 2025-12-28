-- Create table for storing 2FA codes
CREATE TABLE public.two_factor_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.two_factor_codes ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access this table (edge functions use service role key)
-- No policies for authenticated users - this is a backend-only table

-- Add index for faster email lookups
CREATE INDEX idx_two_factor_codes_email ON public.two_factor_codes(email);

-- Add comment
COMMENT ON TABLE public.two_factor_codes IS 'Stores temporary 2FA verification codes for email authentication';