import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Users, 
  Target, 
  TrendingUp, 
  MessageSquare,
  Building2,
  Sparkles,
  BarChart3,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Persona {
  id: string;
  name: string;
  age: string;
  role: string;
  goals: string[];
  painPoints: string[];
  color: string;
}

const personas: Persona[] = [
  {
    id: "1",
    name: "יזם צעיר",
    age: "25-35",
    role: "מנכ״ל סטארטאפ",
    goals: ["צמיחה מהירה", "גיוס לקוחות", "מיתוג"],
    painPoints: ["תקציב מוגבל", "חוסר ניסיון", "זמן מוגבל"],
    color: "from-primary to-primary/60",
  },
  {
    id: "2",
    name: "מנהלת שיווק",
    age: "30-45",
    role: "VP Marketing",
    goals: ["ROI גבוה", "אוטומציה", "דוחות מדויקים"],
    painPoints: ["ריבוי פלטפורמות", "חוסר תיאום", "KPIs"],
    color: "from-accent to-accent/60",
  },
  {
    id: "3",
    name: "בעל עסק קטן",
    age: "35-55",
    role: "בעלים",
    goals: ["לקוחות חדשים", "נוכחות דיגיטלית", "מכירות"],
    painPoints: ["מורכבות טכנית", "עלויות", "תחרות"],
    color: "from-warning to-warning/60",
  },
];

interface Competitor {
  id: string;
  name: string;
  strengths: string[];
  weaknesses: string[];
  marketShare: number;
}

const competitors: Competitor[] = [
  {
    id: "1",
    name: "מתחרה א׳",
    strengths: ["מחיר נמוך", "שירות 24/7"],
    weaknesses: ["איכות נמוכה", "חוסר חדשנות"],
    marketShare: 25,
  },
  {
    id: "2",
    name: "מתחרה ב׳",
    strengths: ["מותג חזק", "ניסיון רב"],
    weaknesses: ["איטיות", "מחיר גבוה"],
    marketShare: 30,
  },
  {
    id: "3",
    name: "מתחרה ג׳",
    strengths: ["טכנולוגיה", "גמישות"],
    weaknesses: ["קטן", "חדש בשוק"],
    marketShare: 15,
  },
];

const brandMessages = [
  { id: "1", channel: "פייסבוק", message: "הצמיחו את העסק שלכם עם שיווק חכם", engagement: 4.2 },
  { id: "2", channel: "אינסטגרם", message: "תוצאות אמיתיות. לקוחות מרוצים.", engagement: 5.8 },
  { id: "3", channel: "לינקדאין", message: "פתרונות שיווק B2B מותאמים אישית", engagement: 3.1 },
  { id: "4", channel: "גוגל", message: "שיווק דיגיטלי מבוסס נתונים", engagement: 6.2 },
];

interface GoalProgress {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
}

const goals: GoalProgress[] = [
  { id: "1", name: "לידים חודשיים", target: 500, current: 380, unit: "לידים" },
  { id: "2", name: "תקציב פרסום", target: 100000, current: 75000, unit: "₪" },
  { id: "3", name: "שיעור המרה", target: 5, current: 4.2, unit: "%" },
  { id: "4", name: "עוקבים ברשתות", target: 10000, current: 8500, unit: "" },
];

export default function Marketing() {
  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <h1 className="text-3xl font-bold mb-2">אסטרטגיית שיווק</h1>
          <p className="text-muted-foreground">פרסונות, מסרים, מתחרים ויעדים</p>
        </div>

        {/* Personas */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4 opacity-0 animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">פרסונות</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {personas.map((persona, index) => (
              <div 
                key={persona.id}
                className="glass rounded-xl overflow-hidden card-shadow opacity-0 animate-slide-up glass-hover"
                style={{ animationDelay: `${0.15 + index * 0.1}s`, animationFillMode: "forwards" }}
              >
                <div className={cn("h-2 bg-gradient-to-l", persona.color)} />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{persona.name}</h3>
                    <span className="text-sm text-muted-foreground">{persona.age}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{persona.role}</p>
                  
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">מטרות</p>
                    <div className="flex flex-wrap gap-2">
                      {persona.goals.map((goal) => (
                        <span key={goal} className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">כאבים</p>
                    <div className="flex flex-wrap gap-2">
                      {persona.painPoints.map((point) => (
                        <span key={point} className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Brand Messages & Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Brand Messages */}
          <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}>
            <div className="p-6 border-b border-border flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">מסרי מותג</h2>
            </div>
            <div className="divide-y divide-border">
              {brandMessages.map((msg) => (
                <div key={msg.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary">{msg.channel}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {msg.engagement}% engagement
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Goals Progress */}
          <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
            <div className="p-6 border-b border-border flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">יעדים מול מצב בפועל</h2>
            </div>
            <div className="p-6 space-y-6">
              {goals.map((goal) => {
                const percentage = (goal.current / goal.target) * 100;
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {goal.current.toLocaleString()}{goal.unit} / {goal.target.toLocaleString()}{goal.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          percentage >= 80 ? "bg-success" : percentage >= 50 ? "bg-warning" : "bg-destructive"
                        )}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Competitors */}
        <section>
          <div className="flex items-center gap-2 mb-4 opacity-0 animate-fade-in" style={{ animationDelay: "0.45s", animationFillMode: "forwards" }}>
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">ניתוח מתחרים</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {competitors.map((competitor, index) => (
              <div 
                key={competitor.id}
                className="glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up glass-hover"
                style={{ animationDelay: `${0.5 + index * 0.1}s`, animationFillMode: "forwards" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">{competitor.name}</h3>
                  <span className="text-2xl font-bold text-primary">{competitor.marketShare}%</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">נתח שוק</p>
                
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">חוזקות</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {competitor.strengths.map((s) => (
                      <span key={s} className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">חולשות</p>
                  <div className="flex flex-wrap gap-2">
                    {competitor.weaknesses.map((w) => (
                      <span key={w} className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
