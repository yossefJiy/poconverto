-- Table for storing user monitoring preferences
CREATE TABLE public.monitoring_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_name text NOT NULL,
  notify_on_down boolean DEFAULT true NOT NULL,
  notify_on_recovery boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, service_name)
);

-- Enable RLS
ALTER TABLE public.monitoring_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own monitoring preferences"
ON public.monitoring_preferences
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert own monitoring preferences"
ON public.monitoring_preferences
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update own monitoring preferences"
ON public.monitoring_preferences
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own preferences
CREATE POLICY "Users can delete own monitoring preferences"
ON public.monitoring_preferences
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all preferences (for health-monitor edge function)
CREATE POLICY "Admins can view all monitoring preferences"
ON public.monitoring_preferences
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Service role access for edge functions
CREATE POLICY "Service role full access to monitoring preferences"
ON public.monitoring_preferences
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_monitoring_preferences_updated_at
BEFORE UPDATE ON public.monitoring_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();