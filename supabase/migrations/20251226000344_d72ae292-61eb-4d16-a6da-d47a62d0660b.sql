-- Add steps column to store execution steps
ALTER TABLE public.project_improvements 
ADD COLUMN steps JSONB DEFAULT '[]'::jsonb;

-- Drop existing SELECT policy for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view improvements" ON public.project_improvements;

-- Create new policy for admins only
CREATE POLICY "Only admins can view improvements"
ON public.project_improvements
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update improvements with execution steps
UPDATE public.project_improvements SET steps = '[
  {"step": "יצירת מסך איפוס סיסמה", "done": false},
  {"step": "הוספת Edge Function לשליחת מייל", "done": false},
  {"step": "בדיקות ווידוא", "done": false}
]'::jsonb WHERE title = 'איפוס סיסמה';

UPDATE public.project_improvements SET steps = '[
  {"step": "בחירת ספריית 2FA (TOTP)", "done": false},
  {"step": "הגדרת QR code לאפליקציות אימות", "done": false},
  {"step": "הוספת מסך הזנת קוד", "done": false},
  {"step": "שמירת מפתחות backup", "done": false}
]'::jsonb WHERE title = 'אימות דו-שלבי (2FA)';

UPDATE public.project_improvements SET steps = '[
  {"step": "יצירת טבלת sessions", "done": false},
  {"step": "דף צפייה בסשנים פעילים", "done": false},
  {"step": "כפתור ניתוק מרחוק", "done": false}
]'::jsonb WHERE title = 'ניהול סשנים';

UPDATE public.project_improvements SET steps = '[
  {"step": "יצירת דף ניהול משתמשים", "done": false},
  {"step": "טבלה עם חיפוש וסינון", "done": false},
  {"step": "טופס עריכת תפקיד", "done": false},
  {"step": "אפשרות השעיה/הפעלה", "done": false},
  {"step": "לוג פעולות", "done": false}
]'::jsonb WHERE title = 'ממשק ניהול משתמשים';

UPDATE public.project_improvements SET steps = '[
  {"step": "יצירת דף פרופיל", "done": false},
  {"step": "העלאת תמונת פרופיל", "done": false},
  {"step": "עריכת פרטים אישיים", "done": false},
  {"step": "שמירת העדפות", "done": false}
]'::jsonb WHERE title = 'דף פרופיל משתמש';

UPDATE public.project_improvements SET steps = '[
  {"step": "יצירת Edge Function לשליחת הזמנות", "done": false},
  {"step": "טופס הזמנה עם תפקיד", "done": false},
  {"step": "דף קבלת הזמנה", "done": false},
  {"step": "מעקב סטטוס הזמנות", "done": false}
]'::jsonb WHERE title = 'הזמנת משתמשים חדשים';

UPDATE public.project_improvements SET steps = '[
  {"step": "בחירת ספריית drag & drop", "done": false},
  {"step": "יצירת רכיבי ווידג''ט", "done": false},
  {"step": "שמירת layout למשתמש", "done": false},
  {"step": "תבניות מוכנות", "done": false}
]'::jsonb WHERE title = 'דשבורד מותאם אישית';

UPDATE public.project_improvements SET steps = '[
  {"step": "הוספת ספריית PDF (jspdf/react-pdf)", "done": false},
  {"step": "יצירת תבניות דוח", "done": false},
  {"step": "ייצוא ל-Excel עם xlsx", "done": false},
  {"step": "ייצוא ל-CSV", "done": false}
]'::jsonb WHERE title = 'ייצוא דוחות';

UPDATE public.project_improvements SET steps = '[
  {"step": "הגדרת Realtime ב-Supabase", "done": false},
  {"step": "יצירת מערכת notifications", "done": false},
  {"step": "UI להתראות", "done": false},
  {"step": "הגדרות העדפות התראות", "done": false}
]'::jsonb WHERE title = 'התראות בזמן אמת';

UPDATE public.project_improvements SET steps = '[
  {"step": "יצירת טבלת activity_log", "done": false},
  {"step": "טריגרים לתיעוד פעולות", "done": false},
  {"step": "UI לצפייה בהיסטוריה", "done": false},
  {"step": "סינון וחיפוש", "done": false}
]'::jsonb WHERE title = 'היסטוריית פעילות לקוח';

UPDATE public.project_improvements SET steps = '[
  {"step": "יצירת Storage bucket", "done": false},
  {"step": "ממשק העלאת קבצים", "done": false},
  {"step": "ניהול תיקיות", "done": false},
  {"step": "הגדרת הרשאות גישה", "done": false}
]'::jsonb WHERE title = 'ניהול קבצים ללקוח';

UPDATE public.project_improvements SET steps = '[
  {"step": "יצירת תפקיד client", "done": false},
  {"step": "עיצוב ממשק לקוח", "done": false},
  {"step": "דשבורד דוחות ללקוח", "done": false},
  {"step": "הרשאות מוגבלות", "done": false}
]'::jsonb WHERE title = 'פורטל לקוח';

UPDATE public.project_improvements SET steps = '[
  {"step": "הוספת שדות start_at/end_at", "done": false},
  {"step": "יצירת cron job", "done": false},
  {"step": "ממשק בחירת תאריכים", "done": false},
  {"step": "התראות על הפעלה/הפסקה", "done": false}
]'::jsonb WHERE title = 'תזמון קמפיינים';

UPDATE public.project_improvements SET steps = '[
  {"step": "מודל נתונים לבדיקות", "done": false},
  {"step": "יצירת וריאציות", "done": false},
  {"step": "מעקב תוצאות", "done": false},
  {"step": "דוח השוואה", "done": false}
]'::jsonb WHERE title = 'A/B Testing';

UPDATE public.project_improvements SET steps = '[
  {"step": "יצירת טבלת templates", "done": false},
  {"step": "כפתור שמור כתבנית", "done": false},
  {"step": "יצירת קמפיין מתבנית", "done": false}
]'::jsonb WHERE title = 'תבניות קמפיינים';

UPDATE public.project_improvements SET steps = '[
  {"step": "הוספת שדה dependencies", "done": false},
  {"step": "בחירת משימות תלויות", "done": false},
  {"step": "הצגה ויזואלית", "done": false},
  {"step": "התראות על חסימות", "done": false}
]'::jsonb WHERE title = 'תלויות בין משימות';

UPDATE public.project_improvements SET steps = '[
  {"step": "יצירת מערכת תזכורות", "done": false},
  {"step": "הגדרת זמן לפני due date", "done": false},
  {"step": "שליחת התראות", "done": false}
]'::jsonb WHERE title = 'תזכורות משימות';

UPDATE public.project_improvements SET steps = '[
  {"step": "בחירת ספריית Kanban", "done": false},
  {"step": "עיצוב עמודות סטטוס", "done": false},
  {"step": "drag & drop בין עמודות", "done": false},
  {"step": "שמירה אוטומטית", "done": false}
]'::jsonb WHERE title = 'תצוגת לוח Kanban';

UPDATE public.project_improvements SET steps = '[
  {"step": "בחירת ספריית Gantt", "done": false},
  {"step": "מיפוי משימות לציר זמן", "done": false},
  {"step": "הצגת תלויות", "done": false},
  {"step": "עריכה אינטראקטיבית", "done": false}
]'::jsonb WHERE title = 'תצוגת Gantt';

UPDATE public.project_improvements SET steps = '[
  {"step": "הגדרת Service Account", "done": false},
  {"step": "Edge Function למשיכת נתונים", "done": false},
  {"step": "מיפוי נתונים לטבלאות", "done": false},
  {"step": "תזמון סנכרון אוטומטי", "done": false}
]'::jsonb WHERE title = 'סנכרון Google Analytics';

UPDATE public.project_improvements SET steps = '[
  {"step": "הגדרת Facebook App", "done": false},
  {"step": "OAuth flow", "done": false},
  {"step": "Edge Function לAPI", "done": false},
  {"step": "ייבוא קמפיינים ונתונים", "done": false}
]'::jsonb WHERE title = 'חיבור Facebook Ads';

UPDATE public.project_improvements SET steps = '[
  {"step": "הגדרת Google Ads API", "done": false},
  {"step": "OAuth flow", "done": false},
  {"step": "Edge Function לAPI", "done": false},
  {"step": "ייבוא קמפיינים ונתונים", "done": false}
]'::jsonb WHERE title = 'חיבור Google Ads';

UPDATE public.project_improvements SET steps = '[
  {"step": "הגדרת endpoint להאזנה", "done": false},
  {"step": "אימות חתימת webhook", "done": false},
  {"step": "עיבוד אירועים", "done": false},
  {"step": "תיעוד API", "done": false}
]'::jsonb WHERE title = 'Webhook API';

UPDATE public.project_improvements SET steps = '[
  {"step": "הגדרת theme provider", "done": false},
  {"step": "CSS variables לכהה/בהיר", "done": false},
  {"step": "כפתור מעבר", "done": false},
  {"step": "שמירת העדפה", "done": false}
]'::jsonb WHERE title = 'מצב כהה/בהיר';

UPDATE public.project_improvements SET steps = '[
  {"step": "בדיקת ניגודיות צבעים", "done": false},
  {"step": "תמיכה במקלדת", "done": false},
  {"step": "ARIA labels", "done": false},
  {"step": "בדיקות עם screen reader", "done": false}
]'::jsonb WHERE title = 'תמיכה בנגישות';

UPDATE public.project_improvements SET steps = '[
  {"step": "מעבר לכיוון RTL", "done": false},
  {"step": "התאמת אייקונים", "done": false},
  {"step": "בדיקת טקסטים", "done": false},
  {"step": "התאמת layouts", "done": false}
]'::jsonb WHERE title = 'תמיכה ב-RTL מלאה';

UPDATE public.project_improvements SET steps = '[
  {"step": "הגדרת manifest.json", "done": false},
  {"step": "Service Worker", "done": false},
  {"step": "Push Notifications", "done": false},
  {"step": "Offline support", "done": false}
]'::jsonb WHERE title = 'אפליקציית מובייל (PWA)';

UPDATE public.project_improvements SET steps = '[
  {"step": "זיהוי רכיבים כבדים", "done": false},
  {"step": "הוספת React.lazy", "done": false},
  {"step": "Suspense boundaries", "done": false}
]'::jsonb WHERE title = 'Lazy Loading';

UPDATE public.project_improvements SET steps = '[
  {"step": "הגדרת React Query cache", "done": false},
  {"step": "staleTime מותאם", "done": false},
  {"step": "invalidation חכם", "done": false}
]'::jsonb WHERE title = 'Caching';

UPDATE public.project_improvements SET steps = '[
  {"step": "הגדרת Storage transform", "done": false},
  {"step": "יצירת thumbnails", "done": false},
  {"step": "WebP conversion", "done": false}
]'::jsonb WHERE title = 'אופטימיזציית תמונות';