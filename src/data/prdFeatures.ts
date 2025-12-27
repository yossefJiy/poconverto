// PRD - Product Requirements Document
// All current system functionality organized by areas

export interface PRDFeature {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface PRDSection {
  id: string;
  name: string;
  icon: string;
  description: string;
  features: PRDFeature[];
}

export const prdSections: PRDSection[] = [
  {
    id: 'auth',
    name: 'אימות ואבטחה',
    icon: 'Shield',
    description: 'מערכת אימות משתמשים והרשאות',
    features: [
      { id: 'auth-1', name: 'התחברות בסיסית', description: 'התחברות עם אימייל וסיסמה', completed: true, priority: 'critical' },
      { id: 'auth-2', name: 'התחברות עם Google', description: 'OAuth עם חשבון Google', completed: true, priority: 'high' },
      { id: 'auth-3', name: 'התחברות עם טלפון', description: 'OTP באמצעות SMS', completed: true, priority: 'high' },
      { id: 'auth-4', name: 'מערכת תפקידים', description: 'admin, manager, team_lead, team_member, client, demo', completed: true, priority: 'critical' },
      { id: 'auth-5', name: 'הרשאות לפי תפקיד', description: 'RLS policies לכל הטבלאות', completed: true, priority: 'critical' },
      { id: 'auth-6', name: 'פרופיל משתמש', description: 'עריכת פרטי המשתמש', completed: true, priority: 'medium' },
      { id: 'auth-7', name: 'Session timeout', description: 'התנתקות אוטומטית אחרי חוסר פעילות', completed: true, priority: 'medium' },
      { id: 'auth-8', name: '2FA', description: 'אימות דו-שלבי', completed: false, priority: 'high' },
      { id: 'auth-9', name: 'איפוס סיסמה', description: 'שחזור סיסמה באמצעות אימייל', completed: false, priority: 'high' },
    ]
  },
  {
    id: 'dashboard',
    name: 'דשבורד ראשי',
    icon: 'LayoutDashboard',
    description: 'מסך הבית עם סקירה כללית',
    features: [
      { id: 'dash-1', name: 'סקירת קמפיינים', description: 'תצוגת הקמפיינים הפעילים', completed: true, priority: 'high' },
      { id: 'dash-2', name: 'כרטיסי מטריקות', description: 'הצגת מדדים עיקריים', completed: true, priority: 'high' },
      { id: 'dash-3', name: 'גרף ביצועים', description: 'גרף מגמות לאורך זמן', completed: true, priority: 'medium' },
      { id: 'dash-4', name: 'רשימת משימות', description: 'משימות בעדיפות גבוהה', completed: true, priority: 'high' },
      { id: 'dash-5', name: 'דשבורד ללקוח', description: 'תצוגה מותאמת ללקוחות', completed: true, priority: 'medium' },
      { id: 'dash-6', name: 'התראות בזמן אמת', description: 'Realtime notifications', completed: false, priority: 'high' },
      { id: 'dash-7', name: 'ווידג\'טים מותאמים', description: 'אפשרות להתאמה אישית', completed: false, priority: 'low' },
    ]
  },
  {
    id: 'clients',
    name: 'ניהול לקוחות',
    icon: 'Building2',
    description: 'ניהול לקוחות ופרטיהם',
    features: [
      { id: 'cli-1', name: 'רשימת לקוחות', description: 'הצגת כל הלקוחות', completed: true, priority: 'critical' },
      { id: 'cli-2', name: 'פרופיל לקוח', description: 'עמוד פרטי לקוח', completed: true, priority: 'high' },
      { id: 'cli-3', name: 'הגדרות לקוח', description: 'עריכת פרטי לקוח', completed: true, priority: 'high' },
      { id: 'cli-4', name: 'הזמנת לקוח', description: 'שליחת הזמנה במייל', completed: true, priority: 'high' },
      { id: 'cli-5', name: 'ניהול מתחרים', description: 'רישום מתחרים לכל לקוח', completed: true, priority: 'medium' },
      { id: 'cli-6', name: 'ניהול פרסונות', description: 'הגדרת קהלי יעד', completed: true, priority: 'medium' },
      { id: 'cli-7', name: 'מסרי מותג', description: 'ניהול מסרים שיווקיים', completed: true, priority: 'medium' },
      { id: 'cli-8', name: 'יעדי לקוח', description: 'הגדרת KPIs', completed: true, priority: 'medium' },
      { id: 'cli-9', name: 'קבצים ונכסים', description: 'ניהול קבצים ללקוח', completed: false, priority: 'medium' },
      { id: 'cli-10', name: 'היסטוריית פעילות', description: 'לוג פעולות', completed: false, priority: 'low' },
    ]
  },
  {
    id: 'campaigns',
    name: 'קמפיינים',
    icon: 'Megaphone',
    description: 'ניהול קמפיינים שיווקיים',
    features: [
      { id: 'camp-1', name: 'רשימת קמפיינים', description: 'הצגת כל הקמפיינים', completed: true, priority: 'critical' },
      { id: 'camp-2', name: 'יצירת קמפיין', description: 'הוספת קמפיין חדש', completed: true, priority: 'critical' },
      { id: 'camp-3', name: 'עריכת קמפיין', description: 'עדכון פרטי קמפיין', completed: true, priority: 'high' },
      { id: 'camp-4', name: 'סטטוס קמפיין', description: 'active, paused, completed', completed: true, priority: 'high' },
      { id: 'camp-5', name: 'מדדי קמפיין', description: 'impressions, clicks, conversions', completed: true, priority: 'high' },
      { id: 'camp-6', name: 'סינון לפי פלטפורמה', description: 'Google, Facebook, Instagram...', completed: true, priority: 'medium' },
      { id: 'camp-7', name: 'חיבור ל-API חיצוני', description: 'סנכרון עם פלטפורמות פרסום', completed: false, priority: 'high' },
      { id: 'camp-8', name: 'A/B Testing', description: 'בדיקות השוואתיות', completed: false, priority: 'medium' },
      { id: 'camp-9', name: 'אוטומציה', description: 'כללי אוטומציה לקמפיינים', completed: false, priority: 'high' },
    ]
  },
  {
    id: 'tasks',
    name: 'ניהול משימות',
    icon: 'CheckSquare',
    description: 'מערכת משימות מתקדמת',
    features: [
      { id: 'task-1', name: 'רשימת משימות', description: 'הצגת כל המשימות', completed: true, priority: 'critical' },
      { id: 'task-2', name: 'יצירת משימה', description: 'הוספת משימה חדשה', completed: true, priority: 'critical' },
      { id: 'task-3', name: 'עריכת משימה', description: 'עדכון פרטי משימה', completed: true, priority: 'high' },
      { id: 'task-4', name: 'תת-משימות', description: 'הוספת משימות משניות', completed: true, priority: 'high' },
      { id: 'task-5', name: 'הקצאה לצוות', description: 'שיוך משימה לחבר צוות', completed: true, priority: 'high' },
      { id: 'task-6', name: 'עדיפות', description: 'high, medium, low', completed: true, priority: 'medium' },
      { id: 'task-7', name: 'סטטוס', description: 'pending, in_progress, completed', completed: true, priority: 'high' },
      { id: 'task-8', name: 'תאריך יעד', description: 'הגדרת deadline', completed: true, priority: 'high' },
      { id: 'task-9', name: 'תזכורות', description: 'הגדרת תזכורות', completed: true, priority: 'medium' },
      { id: 'task-10', name: 'שעות עבודה', description: 'הערכה ובפועל', completed: true, priority: 'medium' },
      { id: 'task-11', name: 'סינון וחיפוש', description: 'סינון לפי מחלקה, סטטוס, עדיפות', completed: true, priority: 'medium' },
      { id: 'task-12', name: 'תצוגת Kanban', description: 'לוח משימות גרפי', completed: false, priority: 'high' },
      { id: 'task-13', name: 'תבניות משימות', description: 'שמירת תבניות לשימוש חוזר', completed: false, priority: 'medium' },
      { id: 'task-14', name: 'משימות חוזרות', description: 'הגדרת משימות רקורסיביות', completed: false, priority: 'medium' },
    ]
  },
  {
    id: 'team',
    name: 'ניהול צוות',
    icon: 'Users',
    description: 'ניהול חברי הצוות',
    features: [
      { id: 'team-1', name: 'רשימת חברי צוות', description: 'הצגת כל החברים', completed: true, priority: 'critical' },
      { id: 'team-2', name: 'כרטיס חבר צוות', description: 'פרטי חבר צוות', completed: true, priority: 'high' },
      { id: 'team-3', name: 'מחלקות', description: 'שיוך לפי מחלקה', completed: true, priority: 'high' },
      { id: 'team-4', name: 'שמות רב-לשוניים', description: 'שם בעברית, אנגלית, הינדי', completed: true, priority: 'medium' },
      { id: 'team-5', name: 'מצב פעיל/לא פעיל', description: 'סימון חברים לא פעילים', completed: true, priority: 'medium' },
      { id: 'team-6', name: 'עריכה במצב Edit', description: 'עריכת פרטים ב-Edit Mode', completed: true, priority: 'medium' },
      { id: 'team-7', name: 'לוח זמנים', description: 'תזמון עבודה', completed: false, priority: 'medium' },
      { id: 'team-8', name: 'דוחות ביצועים', description: 'סטטיסטיקות לכל חבר', completed: false, priority: 'medium' },
    ]
  },
  {
    id: 'marketing',
    name: 'כלי שיווק',
    icon: 'BarChart3',
    description: 'ניתוח והצגת נתונים שיווקיים',
    features: [
      { id: 'mkt-1', name: 'דשבורד שיווק', description: 'סקירת נתונים שיווקיים', completed: true, priority: 'high' },
      { id: 'mkt-2', name: 'דוחות', description: 'יצירת דוחות מותאמים', completed: false, priority: 'high' },
      { id: 'mkt-3', name: 'ייצוא נתונים', description: 'ייצוא ל-CSV/PDF', completed: false, priority: 'medium' },
      { id: 'mkt-4', name: 'השוואת תקופות', description: 'מגמות לאורך זמן', completed: false, priority: 'medium' },
      { id: 'mkt-5', name: 'Google Analytics', description: 'אינטגרציה עם GA', completed: true, priority: 'high' },
    ]
  },
  {
    id: 'integrations',
    name: 'אינטגרציות',
    icon: 'Plug',
    description: 'חיבורים למערכות חיצוניות',
    features: [
      { id: 'int-1', name: 'Resend Email', description: 'שליחת מיילים', completed: true, priority: 'high' },
      { id: 'int-2', name: 'Google Analytics', description: 'קריאת נתונים מ-GA', completed: true, priority: 'high' },
      { id: 'int-3', name: 'Google OAuth', description: 'התחברות עם Google', completed: true, priority: 'high' },
      { id: 'int-4', name: 'Facebook Ads', description: 'חיבור ל-Facebook', completed: false, priority: 'high' },
      { id: 'int-5', name: 'Google Ads', description: 'חיבור ל-Google Ads', completed: false, priority: 'high' },
      { id: 'int-6', name: 'Slack', description: 'התראות ל-Slack', completed: false, priority: 'medium' },
      { id: 'int-7', name: 'Zapier', description: 'אוטומציות עם Zapier', completed: false, priority: 'medium' },
    ]
  },
  {
    id: 'i18n',
    name: 'תרגומים ולוקליזציה',
    icon: 'Languages',
    description: 'תמיכה בשפות מרובות',
    features: [
      { id: 'i18n-1', name: 'תמיכה בעברית', description: 'שפה ראשית', completed: true, priority: 'critical' },
      { id: 'i18n-2', name: 'תמיכה באנגלית', description: 'שפה משנית', completed: true, priority: 'high' },
      { id: 'i18n-3', name: 'תמיכה בהינדי', description: 'שפה שלישית', completed: true, priority: 'medium' },
      { id: 'i18n-4', name: 'עמוד תרגומים', description: 'ניהול תרגומים בממשק', completed: true, priority: 'high' },
      { id: 'i18n-5', name: 'RTL/LTR', description: 'תמיכה בכיווניות', completed: true, priority: 'high' },
      { id: 'i18n-6', name: 'החלפת שפה דינמית', description: 'מעבר שפה בלי רענון', completed: true, priority: 'medium' },
    ]
  },
  {
    id: 'ui',
    name: 'ממשק משתמש',
    icon: 'Palette',
    description: 'עיצוב ו-UX',
    features: [
      { id: 'ui-1', name: 'עיצוב כהה', description: 'Dark theme', completed: true, priority: 'high' },
      { id: 'ui-2', name: 'Sidebar מודרני', description: 'ניווט צדדי', completed: true, priority: 'high' },
      { id: 'ui-3', name: 'רספונסיביות', description: 'תמיכה במובייל', completed: true, priority: 'high' },
      { id: 'ui-4', name: 'מערכת עיצוב', description: 'Design tokens ב-CSS', completed: true, priority: 'high' },
      { id: 'ui-5', name: 'אנימציות', description: 'מעברים חלקים', completed: true, priority: 'medium' },
      { id: 'ui-6', name: 'Toast notifications', description: 'הודעות למשתמש', completed: true, priority: 'high' },
      { id: 'ui-7', name: 'Edit Mode Toggle', description: 'מעבר בין מצב צפייה לעריכה', completed: true, priority: 'medium' },
      { id: 'ui-8', name: 'עיצוב בהיר', description: 'Light theme', completed: false, priority: 'low' },
      { id: 'ui-9', name: 'נגישות', description: 'תמיכה ב-ARIA', completed: false, priority: 'medium' },
    ]
  },
  {
    id: 'settings',
    name: 'הגדרות',
    icon: 'Settings',
    description: 'הגדרות מערכת',
    features: [
      { id: 'set-1', name: 'הגדרות כלליות', description: 'עמוד הגדרות', completed: true, priority: 'high' },
      { id: 'set-2', name: 'ניהול משתמשים', description: 'הוספה/הסרה של משתמשים', completed: false, priority: 'high' },
      { id: 'set-3', name: 'ניהול תפקידים', description: 'שינוי הרשאות', completed: false, priority: 'high' },
      { id: 'set-4', name: 'הגדרות מייל', description: 'SMTP/Resend config', completed: true, priority: 'medium' },
      { id: 'set-5', name: 'גיבויים', description: 'גיבוי ושחזור', completed: false, priority: 'low' },
    ]
  },
  {
    id: 'backlog',
    name: 'Backlog ו-PRD',
    icon: 'FileText',
    description: 'ניהול פרויקט ותכנון',
    features: [
      { id: 'back-1', name: 'רשימת שיפורים', description: 'Backlog items', completed: true, priority: 'high' },
      { id: 'back-2', name: 'השוואה למתחרים', description: 'Radar chart', completed: true, priority: 'medium' },
      { id: 'back-3', name: 'התקדמות לפי קטגוריה', description: 'Bar chart', completed: true, priority: 'medium' },
      { id: 'back-4', name: 'הקצאה לספרינט', description: 'Sprint planning', completed: true, priority: 'high' },
      { id: 'back-5', name: 'PRD מלא', description: 'מסמך דרישות מוצר', completed: true, priority: 'high' },
      { id: 'back-6', name: 'Roadmap', description: 'תוכנית לטווח ארוך', completed: false, priority: 'medium' },
    ]
  },
];

// Helper function to calculate statistics
export function calculatePRDStats(sections: PRDSection[]) {
  const allFeatures = sections.flatMap(s => s.features);
  const completed = allFeatures.filter(f => f.completed).length;
  const total = allFeatures.length;
  
  const byCritical = allFeatures.filter(f => f.priority === 'critical');
  const byHigh = allFeatures.filter(f => f.priority === 'high');
  const byMedium = allFeatures.filter(f => f.priority === 'medium');
  const byLow = allFeatures.filter(f => f.priority === 'low');

  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
    critical: { completed: byCritical.filter(f => f.completed).length, total: byCritical.length },
    high: { completed: byHigh.filter(f => f.completed).length, total: byHigh.length },
    medium: { completed: byMedium.filter(f => f.completed).length, total: byMedium.length },
    low: { completed: byLow.filter(f => f.completed).length, total: byLow.length },
  };
}

// Helper to get section stats
export function getSectionStats(section: PRDSection) {
  const completed = section.features.filter(f => f.completed).length;
  const total = section.features.length;
  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
}
