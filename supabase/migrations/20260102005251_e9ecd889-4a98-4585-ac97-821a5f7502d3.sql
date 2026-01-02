
-- Create code_health_issues table with all required columns
CREATE TABLE IF NOT EXISTS public.code_health_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title text NOT NULL,
  description text,
  details jsonb DEFAULT '{}'::jsonb,
  detected_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid,
  ignored_at timestamp with time zone,
  ignored_by uuid,
  ignore_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create code_health_reports table
CREATE TABLE IF NOT EXISTS public.code_health_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  total_issues integer NOT NULL DEFAULT 0,
  critical_count integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  info_count integer NOT NULL DEFAULT 0,
  issues_data jsonb DEFAULT '[]'::jsonb,
  email_sent boolean DEFAULT false,
  email_sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.code_health_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_health_reports ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_code_health_issues_status 
ON public.code_health_issues (severity, resolved_at, ignored_at);

CREATE INDEX IF NOT EXISTS idx_code_health_issues_detected 
ON public.code_health_issues (detected_at DESC);

-- RLS Policies for code_health_issues
CREATE POLICY "Admins can view all issues"
ON public.code_health_issues
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team members can view issues"
ON public.code_health_issues
FOR SELECT
USING (has_role_level(auth.uid(), 'team_member'::app_role));

CREATE POLICY "System can insert issues"
ON public.code_health_issues
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Team members can update issues"
ON public.code_health_issues
FOR UPDATE
USING (has_role_level(auth.uid(), 'team_member'::app_role))
WITH CHECK (has_role_level(auth.uid(), 'team_member'::app_role));

-- RLS Policies for code_health_reports
CREATE POLICY "Admins can view all reports"
ON public.code_health_reports
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Team members can view reports"
ON public.code_health_reports
FOR SELECT
USING (has_role_level(auth.uid(), 'team_member'::app_role));

CREATE POLICY "System can insert reports"
ON public.code_health_reports
FOR INSERT
WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_code_health_issues_updated_at
BEFORE UPDATE ON public.code_health_issues
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
