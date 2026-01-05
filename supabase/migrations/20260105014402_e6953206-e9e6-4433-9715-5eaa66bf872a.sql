-- Create report_templates table
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'performance',
  sections JSONB NOT NULL DEFAULT '[]',
  styling JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_global BOOLEAN DEFAULT false,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create scheduled_reports table
CREATE TABLE public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly', -- daily, weekly, monthly
  day_of_week INTEGER, -- 0-6 for weekly
  day_of_month INTEGER, -- 1-31 for monthly
  time_of_day TIME DEFAULT '09:00',
  recipients JSONB DEFAULT '[]', -- array of emails
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create report_history table
CREATE TABLE public.report_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  scheduled_report_id UUID REFERENCES public.scheduled_reports(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  report_data JSONB NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  file_url TEXT,
  file_format TEXT DEFAULT 'pdf',
  generated_by UUID,
  sent_to JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_templates
CREATE POLICY "Users can view global templates" ON public.report_templates
FOR SELECT USING (is_global = true);

CREATE POLICY "Users can manage client templates" ON public.report_templates
FOR ALL USING (
  client_id IS NULL OR 
  EXISTS (SELECT 1 FROM public.client_users WHERE client_id = report_templates.client_id AND user_id = auth.uid())
);

-- RLS Policies for scheduled_reports
CREATE POLICY "Users can view scheduled reports for their clients" ON public.scheduled_reports
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.client_users WHERE client_id = scheduled_reports.client_id AND user_id = auth.uid())
);

CREATE POLICY "Users can manage scheduled reports for their clients" ON public.scheduled_reports
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.client_users WHERE client_id = scheduled_reports.client_id AND user_id = auth.uid())
);

-- RLS Policies for report_history
CREATE POLICY "Users can view report history for their clients" ON public.report_history
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.client_users WHERE client_id = report_history.client_id AND user_id = auth.uid())
);

CREATE POLICY "Users can create report history for their clients" ON public.report_history
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.client_users WHERE client_id = report_history.client_id AND user_id = auth.uid())
);

-- Insert default report templates
INSERT INTO public.report_templates (name, description, template_type, sections, is_default, is_global) VALUES
('דוח ביצועים מקיף', 'דוח מלא עם כל מדדי הביצועים', 'performance', 
 '[{"id": "summary", "title": "סיכום כללי", "enabled": true}, {"id": "campaigns", "title": "קמפיינים", "enabled": true}, {"id": "performance", "title": "ביצועים", "enabled": true}, {"id": "tasks", "title": "משימות", "enabled": true}, {"id": "goals", "title": "יעדים", "enabled": true}]',
 true, true),
('דוח מנהלים', 'סיכום קצר למנהלים בכירים', 'executive',
 '[{"id": "summary", "title": "סיכום כללי", "enabled": true}, {"id": "performance", "title": "ביצועים", "enabled": true}, {"id": "goals", "title": "יעדים", "enabled": true}]',
 false, true),
('דוח קמפיינים', 'מיקוד בביצועי קמפיינים', 'campaigns',
 '[{"id": "campaigns", "title": "קמפיינים", "enabled": true}, {"id": "performance", "title": "ביצועים", "enabled": true}]',
 false, true);

-- Create indexes
CREATE INDEX idx_scheduled_reports_next_run ON public.scheduled_reports(next_run_at) WHERE is_active = true;
CREATE INDEX idx_report_history_client ON public.report_history(client_id);
CREATE INDEX idx_report_history_created ON public.report_history(created_at DESC);