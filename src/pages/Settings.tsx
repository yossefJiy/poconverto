import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  Bell, 
  Link2, 
  Shield,
  Palette,
  Globe,
  Save,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const settingsSections = [
  { id: "profile", icon: User, title: "פרופיל", description: "ניהול פרטים אישיים" },
  { id: "notifications", icon: Bell, title: "התראות", description: "הגדרת התראות ועדכונים" },
  { id: "integrations", icon: Link2, title: "אינטגרציות", description: "חיבור למערכות פרסום" },
  { id: "security", icon: Shield, title: "אבטחה", description: "סיסמאות והרשאות" },
  { id: "appearance", icon: Palette, title: "מראה", description: "התאמה אישית של הממשק" },
  { id: "language", icon: Globe, title: "שפה", description: "הגדרות שפה ותצוגה" },
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
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("integrations");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast.success("ההגדרות נשמרו בהצלחה");
  };

  return (
    <MainLayout>
      <div className="p-8">
        <PageHeader 
          title="הגדרות"
          description="ניהול חשבון ואינטגרציות"
          actions={
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
              שמור שינויים
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Menu */}
          <div className="lg:col-span-1">
            <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
              <div className="p-2">
                {settingsSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-right transition-colors",
                      activeSection === section.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    )}
                  >
                    <section.icon className="w-5 h-5 shrink-0" />
                    <div className="flex-1 text-right">
                      <p className="font-medium">{section.title}</p>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Panel */}
          <div className="lg:col-span-3">
            {activeSection === "profile" && (
              <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up p-6" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
                <h2 className="text-xl font-bold mb-6">פרופיל</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">אימייל</label>
                    <Input value={user?.email || ""} disabled />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">שם מלא</label>
                    <Input placeholder="הכנס שם מלא" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">מחלקה</label>
                    <Input placeholder="הכנס מחלקה" />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up p-6" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
                <h2 className="text-xl font-bold mb-6">התראות</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">התראות אימייל</p>
                      <p className="text-sm text-muted-foreground">קבל עדכונים לאימייל</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">התראות משימות</p>
                      <p className="text-sm text-muted-foreground">קבל התראות על משימות חדשות</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">סיכום שבועי</p>
                      <p className="text-sm text-muted-foreground">קבל דו"ח שבועי לאימייל</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "integrations" && (
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
                        <Button 
                          variant={integration.connected ? "outline" : "default"}
                          size="sm"
                        >
                          {integration.connected ? "נתק" : "חבר"}
                        </Button>
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
            )}

            {activeSection === "security" && (
              <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up p-6" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
                <h2 className="text-xl font-bold mb-6">אבטחה</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">סיסמה נוכחית</label>
                    <Input type="password" placeholder="הכנס סיסמה נוכחית" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">סיסמה חדשה</label>
                    <Input type="password" placeholder="הכנס סיסמה חדשה" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground block mb-2">אימות סיסמה</label>
                    <Input type="password" placeholder="הכנס שוב את הסיסמה החדשה" />
                  </div>
                  <Button className="mt-4">עדכן סיסמה</Button>
                </div>
              </div>
            )}

            {activeSection === "appearance" && (
              <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up p-6" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
                <h2 className="text-xl font-bold mb-6">מראה</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">מצב כהה</p>
                      <p className="text-sm text-muted-foreground">הפעל מצב כהה</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">אנימציות</p>
                      <p className="text-sm text-muted-foreground">הפעל אנימציות בממשק</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "language" && (
              <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up p-6" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
                <h2 className="text-xl font-bold mb-6">שפה</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button variant="default">עברית</Button>
                    <Button variant="outline">English</Button>
                    <Button variant="outline">हिंदी</Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    השפה תשפיע על כל הממשק וההודעות במערכת.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
