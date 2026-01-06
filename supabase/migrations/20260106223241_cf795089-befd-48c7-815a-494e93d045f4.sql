-- System Planning Module Tables
-- For structured dialogues, templates, and planning sessions

-- Planning sessions - מפגשי תכנון
CREATE TABLE public.planning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT NOT NULL DEFAULT 'content_studio', -- content_studio, app_planning, website_planning, etc.
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed, archived
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Planning dialogue parts - חלקי דיאלוג בתוך מפגש
CREATE TABLE public.planning_dialogue_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.planning_sessions(id) ON DELETE CASCADE NOT NULL,
  part_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  key_points JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, error
  tokens_used INTEGER DEFAULT 0,
  model_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Planning templates - תבניות לסוגי תכנון שונים
CREATE TABLE public.planning_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL, -- content_studio, app_planning, website_planning, etc.
  parts JSONB NOT NULL DEFAULT '[]', -- Array of {title, prompt}
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Planning exports - יצוא סיכומים
CREATE TABLE public.planning_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.planning_sessions(id) ON DELETE CASCADE NOT NULL,
  export_type TEXT NOT NULL, -- email, pdf, markdown
  recipient_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.planning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_dialogue_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only super_admin and admin can access
CREATE POLICY "Admins can manage planning sessions"
ON public.planning_sessions FOR ALL
USING (public.has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage dialogue parts"
ON public.planning_dialogue_parts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.planning_sessions ps
    WHERE ps.id = planning_dialogue_parts.session_id
    AND public.has_role_level(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can manage templates"
ON public.planning_templates FOR ALL
USING (public.has_role_level(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage exports"
ON public.planning_exports FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.planning_sessions ps
    WHERE ps.id = planning_exports.session_id
    AND public.has_role_level(auth.uid(), 'admin'::app_role)
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_planning_sessions_updated_at
BEFORE UPDATE ON public.planning_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_planning_templates_updated_at
BEFORE UPDATE ON public.planning_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Content Studio template
INSERT INTO public.planning_templates (name, description, template_type, parts, sort_order)
VALUES (
  'בניית סטודיו תוכן',
  'דיאלוג מובנה לתכנון ובניית Content Studio לסוכנות דיגיטלית',
  'content_studio',
  '[
    {"title": "שלב 1: UI/UX ופסיכולוגיה", "prompt": "בוא נתחיל לבנות Content Studio לסוכנות דיגיטל. השלב הראשון - UI/UX: מה העקרונות הפסיכולוגיים שחשוב ליישם כדי שמנהלי תוכן ירגישו נוח לעבוד בממשק כזה? איך לשלב בין פשטות לבין עומק הפונקציונליות?"},
    {"title": "שלב 2: מבנה רכיבי תוכן", "prompt": "עכשיו בוא נעמיק במבנה הטכני. אילו רכיבי תוכן (Content Components) צריכים להיות בסיס המערכת? כיצד לארגן היררכיה של קמפיינים, אסטרטגיות ותכנים בודדים?"},
    {"title": "שלב 3: ארכיטקטורת קמפיינים", "prompt": "בוא נדון בארכיטקטורת הקמפיינים. כיצד לקשר בין קמפיין שיווקי לבין פריטי התוכן השונים שנוצרים עבורו? איך לנהל גרסאות ו-A/B testing?"},
    {"title": "שלב 4: מודלים ו-AI", "prompt": "עכשיו לחלק ה-AI. אילו מודלים כדאי לשלב לכל סוג תוכן? (קופי, מאמרים, תמונות, וידאו) מה היחס בין אוטומציה לבין שליטה אנושית?"},
    {"title": "שלב 5: Workflow ופיצ׳רים", "prompt": "לסיכום - בוא נגדיר את ה-Workflow המרכזי של יצירת תוכן מאפס ועד פרסום. אילו פיצ׳רים הם must-have ואילו nice-to-have?"}
  ]'::jsonb,
  1
);

-- Index for performance
CREATE INDEX idx_planning_sessions_user ON public.planning_sessions(user_id);
CREATE INDEX idx_planning_sessions_type ON public.planning_sessions(session_type);
CREATE INDEX idx_planning_dialogue_parts_session ON public.planning_dialogue_parts(session_id);
CREATE INDEX idx_planning_templates_type ON public.planning_templates(template_type);