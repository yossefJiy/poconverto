import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Copy, 
  Send, 
  ChevronDown, 
  ChevronUp,
  Building2,
  BarChart3,
  Users,
  Calendar,
  FileText,
  Sparkles,
  Globe,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FutureFeature {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  icon: React.ElementType;
  prompt: string;
}

const futureFeatures: FutureFeature[] = [
  {
    id: "master-account",
    title: "חשבון על - סוכנות הדיגיטל",
    description: "סוכנות הדיגיטל (JIY) תהיה חשבון העל שמציג סיכום של כל הלקוחות בדשבורד ובאנליטיקס",
    priority: "high",
    icon: Building2,
    prompt: `יש לממש חשבון על (Master Account) עבור סוכנות JIY:

1. **זיהוי חשבון העל:**
   - בטבלת clients, הלקוח "סוכנות הדיגיטל JIY" (או לפי שם דומה) הוא חשבון העל
   - אפשר להוסיף עמודה is_master_account: boolean לטבלת clients
   - או לזהות לפי שם/id קבוע

2. **דשבורד סוכנות:**
   - כאשר נבחר חשבון העל, הדשבורד יציג:
     - סיכום משימות מכל הלקוחות (פתוחות/הושלמו)
     - סיכום קמפיינים מכל הלקוחות (תקציב כולל, ROAS ממוצע)
     - גרף השוואתי בין לקוחות
     - Top performers - לקוחות עם הביצועים הטובים ביותר

3. **אנליטיקס מאוחד:**
   - תצוגת אנליטיקס שמאחדת נתונים מכל הלקוחות
   - השוואה בין לקוחות
   - מגמות כלליות

4. **RLS Policies:**
   - משתמשי JIY (עובדי הסוכנות) יכולים לראות את כל הלקוחות
   - לקוחות רגילים רואים רק את עצמם

5. **UI:**
   - בתפריט הלקוחות, חשבון העל יופיע בנפרד/מודגש
   - אינדיקציה ברורה כשצופים במצב "סוכנות"

קוד לדוגמה לזיהוי חשבון על:
\`\`\`typescript
// In useClient hook
const isMasterAccount = selectedClient?.name?.includes("JIY") || selectedClient?.is_master_account;

// In Dashboard query
if (isMasterAccount) {
  // Fetch all clients data
  const { data: allTasks } = await supabase.from("tasks").select("*");
  const { data: allCampaigns } = await supabase.from("campaigns").select("*");
  // Aggregate and display
}
\`\`\``
  },
  {
    id: "analytics-aggregation",
    title: "אנליטיקס מאוחד לסוכנות",
    description: "תצוגת אנליטיקס שמציגה נתונים מכל הלקוחות יחד עם אפשרות השוואה",
    priority: "high",
    icon: BarChart3,
    prompt: `יש לממש תצוגת אנליטיקס מאוחדת לסוכנות:

1. **תצוגה מאוחדת:**
   - גרף עם כל הלקוחות על ציר אחד
   - סינון לפי תקופה, פלטפורמה, לקוח
   - KPIs כלליים: סה"כ הוצאות, סה"כ המרות, ROAS ממוצע

2. **השוואת לקוחות:**
   - טבלה עם כל הלקוחות ומדדי הביצועים שלהם
   - מיון לפי ביצועים
   - אפשרות לבחור לקוחות להשוואה

3. **דוחות אוטומטיים:**
   - דו"ח שבועי/חודשי מרוכז
   - שליחה אוטומטית במייל

קוד לדוגמה:
\`\`\`typescript
// Aggregated analytics query
const { data: allAnalytics } = await supabase
  .from("analytics_snapshots")
  .select("*, clients(name)")
  .gte("snapshot_date", startDate)
  .lte("snapshot_date", endDate);

// Group by client
const byClient = allAnalytics.reduce((acc, item) => {
  const clientName = item.clients?.name;
  if (!acc[clientName]) acc[clientName] = [];
  acc[clientName].push(item);
  return acc;
}, {});
\`\`\``
  },
  {
    id: "team-jiy",
    title: "ניהול צוות JIY",
    description: "שלושת אנשי הצוות הם עובדי JIY - הוספת תצוגה ייעודית לניהול הצוות",
    priority: "medium",
    icon: Users,
    prompt: `יש לשפר את ניהול צוות JIY:

1. **זיהוי עובדי JIY:**
   - בטבלת team, הוספת עמודה is_jiy_employee: boolean
   - או שיוך לחשבון JIY

2. **תצוגת צוות:**
   - דף צוות שמציג רק עובדי JIY
   - משימות פתוחות לכל עובד
   - עומס עבודה (workload) לכל עובד

3. **חלוקת משימות:**
   - אפשרות להקצות משימות לפי עומס
   - התראות כשעובד עמוס מדי

קוד לדוגמה:
\`\`\`typescript
// Fetch JIY team members
const { data: jiyTeam } = await supabase
  .from("team")
  .select("*, tasks(status)")
  .eq("is_jiy_employee", true);

// Calculate workload
const workload = jiyTeam.map(member => ({
  ...member,
  openTasks: member.tasks?.filter(t => t.status !== "completed").length || 0
}));
\`\`\``
  },
  {
    id: "google-workspace",
    title: "אינטגרציית Google Workspace מלאה",
    description: "חיבור ל-Google Calendar, Drive, Docs, Sheets עם OAuth",
    priority: "medium",
    icon: Calendar,
    prompt: `יש לממש אינטגרציית Google Workspace מלאה:

1. **Google Calendar:**
   - סנכרון משימות עם due_date ליומן
   - יצירת אירועים לפגישות
   - תזכורות אוטומטיות

2. **Google Drive:**
   - שמירת קבצים בתיקיית לקוח
   - גישה לקבצי לקוח

3. **Google Sheets:**
   - ייצוא נתונים ל-Sheets
   - ייבוא משימות מ-Sheets

4. **OAuth Setup:**
   - הגדרת OAuth2 ב-Google Cloud Console
   - Scopes נדרשים: calendar, drive, docs, sheets

קוד לדוגמה:
\`\`\`typescript
// Edge function for Google Calendar sync
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

await calendar.events.insert({
  calendarId: 'primary',
  requestBody: {
    summary: task.title,
    description: task.description,
    start: { dateTime: task.due_date },
    end: { dateTime: task.due_date },
  },
});
\`\`\``
  },
  {
    id: "automated-reports",
    title: "דוחות אוטומטיים",
    description: "יצירה ושליחה אוטומטית של דוחות ללקוחות",
    priority: "medium",
    icon: FileText,
    prompt: `יש לממש מערכת דוחות אוטומטיים:

1. **תבניות דוחות:**
   - דו"ח שבועי
   - דו"ח חודשי
   - דו"ח קמפיין

2. **תזמון:**
   - הגדרת תדירות לכל לקוח
   - שליחה אוטומטית במייל

3. **התאמה אישית:**
   - בחירת מדדים להצגה
   - הוספת הערות ידניות

קוד לדוגמה:
\`\`\`typescript
// Scheduled report function
Deno.cron("send-weekly-reports", "0 9 * * 1", async () => {
  const { data: schedules } = await supabase
    .from("report_schedules")
    .select("*, clients(*)")
    .eq("frequency", "weekly")
    .eq("is_active", true);

  for (const schedule of schedules) {
    const report = await generateReport(schedule.client_id);
    await sendReportEmail(schedule.clients.email, report);
  }
});
\`\`\``
  },
  {
    id: "ai-insights",
    title: "תובנות AI מתקדמות",
    description: "ניתוח AI אוטומטי של ביצועים והמלצות לשיפור",
    priority: "low",
    icon: Sparkles,
    prompt: `יש לממש תובנות AI מתקדמות:

1. **ניתוח ביצועים:**
   - זיהוי מגמות חריגות
   - השוואה לממוצע בתעשייה
   - חיזוי ביצועים

2. **המלצות:**
   - הצעות לאופטימיזציה
   - התראות על בעיות פוטנציאליות
   - הזדמנויות לשיפור

3. **דוחות חכמים:**
   - סיכום AI של הביצועים
   - נקודות עיקריות להדגשה

קוד לדוגמה:
\`\`\`typescript
// AI analysis using Lovable AI
const insights = await generateText({
  model: "google/gemini-2.5-flash",
  prompt: \`נתח את הביצועים הבאים והצע המלצות:
  - קליקים: \${clicks}
  - המרות: \${conversions}
  - עלות: \${cost}
  - ROAS: \${roas}
  \`
});
\`\`\``
  },
  {
    id: "notifications-system",
    title: "מערכת התראות מתקדמת",
    description: "התראות חכמות על אירועים חשובים בזמן אמת",
    priority: "low",
    icon: Bell,
    prompt: `יש לממש מערכת התראות מתקדמת:

1. **סוגי התראות:**
   - משימה מתקרבת לדדליין
   - קמפיין סיים תקציב
   - ביצועים חריגים (טובים/רעים)
   - לקוח חדש נרשם

2. **ערוצים:**
   - התראות באפליקציה
   - מייל
   - SMS (לדחופים)
   - Push notifications

3. **הגדרות משתמש:**
   - בחירת סוגי התראות
   - תדירות
   - שעות שקט

קוד לדוגמה:
\`\`\`typescript
// Real-time notifications with Supabase
const channel = supabase
  .channel('notifications')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'notifications' },
    (payload) => {
      showNotification(payload.new);
    }
  )
  .subscribe();
\`\`\``
  }
];

export function FutureFeatures() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const copyPrompt = (prompt: string, title: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success(`הפרומפט "${title}" הועתק ללוח`);
  };

  const priorityConfig = {
    high: { label: "עדיפות גבוהה", className: "bg-destructive/20 text-destructive" },
    medium: { label: "עדיפות בינונית", className: "bg-warning/20 text-warning" },
    low: { label: "עדיפות נמוכה", className: "bg-muted text-muted-foreground" },
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          פיצ'רים עתידיים
        </CardTitle>
        <CardDescription>
          רשימת פיצ'רים מתוכננים לפיתוח. לחצו על "שלח בשבילי" להעתקת הפרומפט.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {futureFeatures.map((feature) => {
              const Icon = feature.icon;
              const isExpanded = expandedId === feature.id;
              
              return (
                <div 
                  key={feature.id}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <div 
                    className="p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : feature.id)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{feature.title}</h4>
                        <Badge className={cn("text-xs", priorityConfig[feature.priority].className)}>
                          {priorityConfig[feature.priority].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 p-4">
                      <div className="text-xs font-mono bg-background rounded-lg p-3 max-h-[300px] overflow-auto whitespace-pre-wrap mb-3">
                        {feature.prompt}
                      </div>
                      <Button 
                        onClick={() => copyPrompt(feature.prompt, feature.title)}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        שלח בשבילי (העתק פרומפט)
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
