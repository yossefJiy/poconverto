-- Create table for project improvements/features backlog
CREATE TABLE public.project_improvements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'feature',
  priority TEXT NOT NULL DEFAULT 'medium',
  importance INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'backlog',
  estimated_effort TEXT,
  sprint_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_improvements ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view improvements
CREATE POLICY "Authenticated users can view improvements"
ON public.project_improvements
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins and managers can manage improvements
CREATE POLICY "Admins and managers can manage improvements"
ON public.project_improvements
FOR ALL
USING (has_role_level(auth.uid(), 'manager'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_project_improvements_updated_at
BEFORE UPDATE ON public.project_improvements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial improvements backlog
INSERT INTO public.project_improvements (title, description, category, priority, importance, estimated_effort) VALUES
-- Authentication & Security
('איפוס סיסמה', 'אפשרות לאיפוס סיסמה דרך אימייל', 'auth', 'high', 9, 'small'),
('אימות דו-שלבי (2FA)', 'הוספת אימות דו-שלבי עם אפליקציה או SMS', 'auth', 'medium', 7, 'medium'),
('ניהול סשנים', 'צפייה וניתוק סשנים פעילים', 'auth', 'low', 5, 'small'),

-- User Management
('ממשק ניהול משתמשים', 'דף לאדמינים לניהול משתמשים, תפקידים והרשאות', 'users', 'high', 10, 'large'),
('דף פרופיל משתמש', 'עריכת פרטים אישיים, תמונה והעדפות', 'users', 'high', 8, 'medium'),
('הזמנת משתמשים חדשים', 'שליחת הזמנות בדוא"ל למשתמשים חדשים', 'users', 'medium', 7, 'medium'),

-- Dashboard & Analytics
('דשבורד מותאם אישית', 'גרירת ושחרור ווידג''טים, שמירת תצוגות', 'dashboard', 'medium', 6, 'large'),
('ייצוא דוחות', 'ייצוא נתונים ל-PDF, Excel, CSV', 'analytics', 'high', 8, 'medium'),
('התראות בזמן אמת', 'נוטיפיקציות על אירועים חשובים', 'dashboard', 'medium', 7, 'medium'),

-- Client Management
('היסטוריית פעילות לקוח', 'לוג מלא של כל הפעולות והשינויים', 'clients', 'medium', 6, 'medium'),
('ניהול קבצים ללקוח', 'העלאה וניהול קבצים לכל לקוח', 'clients', 'high', 8, 'medium'),
('פורטל לקוח', 'ממשק נפרד ללקוחות לצפייה בדוחות', 'clients', 'low', 5, 'large'),

-- Campaigns
('תזמון קמפיינים', 'תזמון אוטומטי להפעלה והפסקה', 'campaigns', 'medium', 6, 'medium'),
('A/B Testing', 'יצירת וניהול בדיקות A/B', 'campaigns', 'low', 5, 'large'),
('תבניות קמפיינים', 'שמירת קמפיינים כתבניות לשימוש חוזר', 'campaigns', 'medium', 6, 'small'),

-- Tasks
('תלויות בין משימות', 'הגדרת קשרים בין משימות', 'tasks', 'medium', 6, 'medium'),
('תזכורות משימות', 'התראות לפני תאריכי יעד', 'tasks', 'high', 8, 'small'),
('תצוגת לוח Kanban', 'גרירה ושחרור של משימות', 'tasks', 'medium', 7, 'medium'),
('תצוגת Gantt', 'תצוגת ציר זמן לפרויקטים', 'tasks', 'low', 5, 'large'),

-- Integrations
('סנכרון Google Analytics', 'משיכת נתונים אוטומטית', 'integrations', 'high', 9, 'medium'),
('חיבור Facebook Ads', 'ייבוא נתוני קמפיינים מפייסבוק', 'integrations', 'high', 8, 'large'),
('חיבור Google Ads', 'ייבוא נתוני קמפיינים מגוגל', 'integrations', 'high', 8, 'large'),
('Webhook API', 'קבלת עדכונים למערכות חיצוניות', 'integrations', 'medium', 6, 'medium'),

-- UI/UX
('מצב כהה/בהיר', 'החלפת ערכת נושא', 'ui', 'medium', 6, 'small'),
('תמיכה בנגישות', 'התאמה לתקני WCAG', 'ui', 'high', 8, 'medium'),
('תמיכה ב-RTL מלאה', 'שיפור תמיכה בעברית/ערבית', 'ui', 'high', 9, 'medium'),
('אפליקציית מובייל (PWA)', 'גרסה מותאמת למובייל עם התראות', 'ui', 'low', 5, 'large'),

-- Performance
('Lazy Loading', 'טעינה עצלה לשיפור ביצועים', 'performance', 'medium', 7, 'small'),
('Caching', 'שמירת מטמון לנתונים תכופים', 'performance', 'medium', 7, 'medium'),
('אופטימיזציית תמונות', 'דחיסה והמרה אוטומטית', 'performance', 'low', 5, 'small');