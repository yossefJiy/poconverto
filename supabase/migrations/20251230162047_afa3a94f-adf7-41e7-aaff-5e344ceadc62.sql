-- Add notification preference column to authorized_emails
ALTER TABLE public.authorized_emails 
ADD COLUMN IF NOT EXISTS notification_preference text NOT NULL DEFAULT 'email'
CHECK (notification_preference IN ('email', 'sms', 'both'));

-- Add comment for documentation
COMMENT ON COLUMN public.authorized_emails.notification_preference IS 'User preference for 2FA notifications: email, sms, or both';