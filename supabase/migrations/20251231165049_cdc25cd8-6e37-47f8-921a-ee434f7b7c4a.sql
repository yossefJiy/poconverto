-- Create table for tracking notification history
CREATE TABLE public.notification_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms')),
  recipient TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  subject TEXT,
  message TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_notification_history_task_id ON public.notification_history(task_id);
CREATE INDEX idx_notification_history_client_id ON public.notification_history(client_id);
CREATE INDEX idx_notification_history_created_at ON public.notification_history(created_at DESC);
CREATE INDEX idx_notification_history_status ON public.notification_history(status);

-- Enable RLS
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Team members can view all notification history"
  ON public.notification_history
  FOR SELECT
  USING (has_role_level(auth.uid(), 'team_member'::app_role));

CREATE POLICY "Team members can insert notification history"
  ON public.notification_history
  FOR INSERT
  WITH CHECK (has_role_level(auth.uid(), 'team_member'::app_role));

CREATE POLICY "System can manage notification history"
  ON public.notification_history
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable realtime for notification updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_history;