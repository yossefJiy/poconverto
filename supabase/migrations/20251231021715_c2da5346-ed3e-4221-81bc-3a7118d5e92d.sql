-- Add arrays for multiple emails and phones to team table
ALTER TABLE public.team 
ADD COLUMN IF NOT EXISTS emails text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS phones text[] DEFAULT '{}';

-- Migrate existing email data to emails array
UPDATE public.team 
SET emails = ARRAY[email]
WHERE email IS NOT NULL AND email != '' AND (emails IS NULL OR emails = '{}');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_team_emails ON public.team USING GIN(emails);
CREATE INDEX IF NOT EXISTS idx_team_phones ON public.team USING GIN(phones);