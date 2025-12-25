import { MainLayout } from "@/components/layout/MainLayout";
import { 
  User, 
  Bell, 
  Link2, 
  Shield,
  Palette,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";

const settingsSections = [
  {
    id: "profile",
    icon: User,
    title: "פרופיל",
    description: "ניהול פרטים אישיים והעדפות",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "התראות",
    description: "הגדרת התראות ועדכונים",
  },
  {
    id: "integrations",
    icon: Link2,
    title: "אינטגרציות",
    description: "חיבור למערכות פרסום וכלים חיצוניים",
  },
  {
    id: "security",
    icon: Shield,
    title: "אבטחה",
    description: "סיסמאות והרשאות",
  },
  {
    id: "appearance",
    icon: Palette,
    title: "מראה",
    description: "התאמה אישית של הממשק",
  },
  {
    id: "language",
    icon: Globe,
    title: "שפה ואזור",
    description: "הגדרות שפה ותצוגה",
  },
];

const integrations = [
  { id: "google", name: "Google Ads", connected: true, logo: "G" },
  { id: "facebook", name: "Facebook Ads", connected: true, logo: "f" },
  { id: "instagram", name: "Instagram", connected: true, logo: "📷" },
  { id: "linkedin", name: "LinkedIn", connected: false, logo: "in" },
  { id: "tiktok", name: "TikTok", connected: false, logo: "♪" },
  { id: "analytics", name: "Google Analytics", connected: true, logo: "📊" },
];

export default function Settings() {
  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <h1 className="text-3xl font-bold mb-2">הגדרות</h1>
          <p className="text-muted-foreground">ניהול חשבון ואינטגרציות</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Menu */}
          <div className="lg:col-span-1">
            <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
              <div className="p-4">
                {settingsSections.map((section, index) => (
                  <button
                    key={section.id}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-lg text-right transition-colors",
                      index === 2 ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    )}
                  >
                    <section.icon className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-medium">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Integrations Panel */}
          <div className="lg:col-span-2">
            <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold">אינטגרציות</h2>
                <p className="text-sm text-muted-foreground mt-1">חבר את מערכות הפרסום שלך לקבלת נתונים בזמן אמת</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integrations.map((integration, index) => (
                    <div 
                      key={integration.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border transition-colors opacity-0 animate-fade-in",
                        integration.connected ? "border-success/30 bg-success/5" : "border-border hover:border-primary"
                      )}
                      style={{ animationDelay: `${0.3 + index * 0.05}s`, animationFillMode: "forwards" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg font-bold">
                          {integration.logo}
                        </div>
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          <p className={cn(
                            "text-xs",
                            integration.connected ? "text-success" : "text-muted-foreground"
                          )}>
                            {integration.connected ? "מחובר" : "לא מחובר"}
                          </p>
                        </div>
                      </div>
                      <button className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        integration.connected 
                          ? "bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}>
                        {integration.connected ? "נתק" : "חבר"}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 rounded-lg bg-info/10 border border-info/30">
                  <p className="text-sm text-info">
                    💡 חיבור למערכות הפרסום יאפשר לך לראות נתונים בזמן אמת ולבצע אופטימיזציה אוטומטית.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
