-- Add recurrence columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

-- Add default duration_minutes to 60 if not already set
COMMENT ON COLUMN public.tasks.duration_minutes IS 'Default task duration in minutes (60 = 1 hour)';