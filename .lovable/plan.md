

## שמירת מילות מפתח לפי לקוח + יכולות נוספות מה-API

### מה נמצא ב-Google Ads Keyword Planner API

ה-`KeywordPlanIdeaService` תומך ב-4 פעולות:

1. **GenerateKeywordIdeas** - כבר ממומש. רעיונות למילות מפתח עם נפח, תחרות, CPC
2. **GenerateKeywordHistoricalMetrics** - מטריקות היסטוריות למילות מפתח ספציפיות (ללא הצעות חדשות, רק נתונים על מילים שנבחרו)
3. **GenerateKeywordForecastMetrics** - תחזיות ביצועים: הקלקות, אימפרשנים, עלות, המרות צפויות עבור תקציב ו-bid מסוים
4. **GenerateAdGroupThemes** - קיבוץ מילות מפתח לנושאים/קבוצות מודעות אוטומטית

### תוכנית מימוש

#### 1. טבלת שמירת מילות מפתח בדאטה-בייס

טבלה `saved_keywords` עם קטגוריזציה גמישה:

| עמודה | תיאור |
|--------|--------|
| client_id | לקוח |
| keyword | מילת המפתח |
| category_type | סוג קטגוריה: `season`, `department`, `campaign`, `campaign_type`, `product`, `brand`, `custom` |
| category_value | ערך הקטגוריה (למשל: "קיץ 2025", "שמלות", "חג פסח") |
| tags | תגיות חופשיות (JSON array) |
| avg_monthly_searches | נפח חיפוש שנשמר |
| competition | רמת תחרות |
| low_bid / high_bid | טווח CPC |
| notes | הערות חופשיות |
| source_query | מאיזה חיפוש הגיעה |
| last_refreshed_at | מתי רוענן לאחרונה |

RLS policies: גישה לפי `has_client_access`.

#### 2. UI לשמירת מילות מפתח מתוצאות חיפוש

- צ'קבוקסים בטבלת התוצאות לבחירת מילות מפתח
- כפתור "שמור נבחרות" שפותח דיאלוג עם:
  - בחירת סוג קטגוריה (עונה / מחלקה / קמפיין / סוג קמפיין / מוצר / מותג / מותאם אישית)
  - הזנת ערך הקטגוריה
  - הוספת תגיות חופשיות
  - הערות

#### 3. עמוד/טאב "מילות מפתח שמורות"

- תצוגת טבלה של כל המילות המפתח השמורות ללקוח הנבחר
- סינון לפי סוג קטגוריה וערך
- קיבוץ לפי קטגוריה
- אפשרות לרענן נתונים (קריאה ל-GenerateKeywordHistoricalMetrics)
- ייצוא CSV
- מחיקה/עריכה

#### 4. תחזיות ביצועים (Forecast) - יכולת API חדשה

- טאב חדש "תחזית ביצועים" בעמוד מחקר מילות מפתח
- בחירת מילות מפתח שמורות → הזנת תקציב יומי → קבלת תחזית: קליקים, אימפרשנים, עלות, המרות צפויות
- משתמש ב-`GenerateKeywordForecastMetrics`

#### 5. קיבוץ אוטומטי לנושאים (Ad Group Themes)

- כפתור "קבץ לנושאים" על תוצאות או מילות מפתח שמורות
- משתמש ב-`GenerateAdGroupThemes` להצעת קיבוץ אוטומטי

### סיכום קבצים

| קובץ | שינוי |
|-------|-------|
| Migration SQL | טבלת `saved_keywords` + RLS |
| `supabase/functions/keyword-research/index.ts` | הוספת actions: `historical_metrics`, `forecast`, `ad_group_themes` |
| `src/pages/KeywordResearch.tsx` | צ'קבוקסים, שמירה, טאב שמורות, טאב תחזיות |
| `src/components/keywords/SaveKeywordsDialog.tsx` | דיאלוג שמירה עם קטגוריות |
| `src/components/keywords/SavedKeywordsTab.tsx` | תצוגת מילות מפתח שמורות |

