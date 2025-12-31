-- Add avatar_color column to team table
ALTER TABLE public.team 
ADD COLUMN IF NOT EXISTS avatar_color text DEFAULT '#6366f1';

-- Add comment
COMMENT ON COLUMN public.team.avatar_color IS 'Hex color for team member avatar';