-- Add reminder and notification columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_sms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_phone TEXT,
ADD COLUMN IF NOT EXISTS notification_email_address TEXT,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index for reminder queries
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_at ON public.tasks(reminder_at) WHERE reminder_at IS NOT NULL AND reminder_sent = false;