import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { useClient } from "@/hooks/useClient";
import { 
  User, 
  Bell, 
  Palette,
  Save,
  Loader2,
  Shield,
  Coins,
  Mail,
  AlertTriangle,
  Users,
  UserCircle,
  Bot,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AuthorizedUsersManager } from "@/components/admin/AuthorizedUsersManager";
import { EmailTestingSection } from "@/components/admin/EmailTestingSection";
import { ClientContactsManager } from "@/components/client/ClientContactsManager";
import { ClientTeamManager } from "@/components/client/ClientTeamManager";
import { AICapabilityUsageStats } from "@/components/ai/AICapabilityUsageStats";
import { GlobalModulesManager } from "@/components/admin/GlobalModulesManager";

const settingsSections = [
  { id: "profile", icon: User, title: "פרופיל", description: "ניהול פרטים אישיים" },
  { id: "notifications", icon: Bell, title: "התראות", description: "הגדרת התראות ועדכונים" },
  { id: "appearance", icon: Palette, title: "מראה", description: "התאמה אישית של הממשק" },
  { id: "modules", icon: LayoutGrid, title: "מודולים גלובליים", description: "נעילה ופתיחה גלובלית", adminOnly: true },
  { id: "users", icon: Shield, title: "משתמשים מורשים", description: "ניהול גישה למערכת", adminOnly: true },
  { id: "team", icon: Users, title: "צוות עובדים", description: "צוות משויך ללקוח", requiresClient: true },
  { id: "contacts", icon: UserCircle, title: "אנשי קשר", description: "אנשי קשר של הלקוח", requiresClient: true },
  { id: "ai-stats", icon: Bot, title: "סטטיסטיקות AI", description: "שימוש ביכולות סוכנים", adminOnly: true },
  { id: "email-testing", icon: Mail, title: "בדיקת מיילים", description: "בדיקת שליחת מיילים", adminOnly: true },
  { id: "credits", icon: Coins, title: "קרדיטים", description: "ניהול קרדיטים לקוחות", adminOnly: true },
  { id: "alerts", icon: AlertTriangle, title: "התראות AI", description: "צפייה בהתראות סוכנים", adminOnly: true },
];

export default function Settings() {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const { selectedClient } = useClient();
  const [activeSection, setActiveSection] = useState("profile");
  const [saving, setSaving] = useState(false);

  const visibleSections = settingsSections.filter(section => {
    if (section.adminOnly && !isAdmin) return false;
    if (section.requiresClient && !selectedClient) return false;
    return true;
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast.success("ההגדרות נשמרו בהצלחה");
  };

  return (
    <MainLayout>
      <DomainErrorBoundary domain="settings">
      <div className="p-8">
        <PageHeader 
          title="הגדרות"
          description="ניהול חשבון והעדפות"
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
                {visibleSections.map((section) => (
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

            {activeSection === "modules" && isAdmin && (
              <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
                <GlobalModulesManager />
              </div>
            )}

            {activeSection === "users" && isAdmin && (
              <AuthorizedUsersManager />
            )}

            {activeSection === "team" && selectedClient && (
              <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
                <ClientTeamManager 
                  clientId={selectedClient.id} 
                  clientName={selectedClient.name} 
                />
              </div>
            )}

            {activeSection === "contacts" && selectedClient && (
              <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
                <ClientContactsManager 
                  clientId={selectedClient.id} 
                  clientName={selectedClient.name} 
                />
              </div>
            )}

            {activeSection === "ai-stats" && isAdmin && (
              <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
                <AICapabilityUsageStats />
              </div>
            )}

            {activeSection === "email-testing" && isAdmin && (
              <EmailTestingSection />
            )}

            {activeSection === "credits" && isAdmin && (
              <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up p-6" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">ניהול קרדיטים</h2>
                  <Link to="/credits">
                    <Button>מעבר לעמוד קרדיטים</Button>
                  </Link>
                </div>
                <p className="text-muted-foreground">
                  נהל את הקרדיטים של הלקוחות, צפה בהיסטוריית שימוש ואשר בקשות משימות.
                </p>
              </div>
            )}

            {activeSection === "alerts" && isAdmin && (
              <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up p-6" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">התראות AI</h2>
                  <Link to="/agent-alerts">
                    <Button>מעבר לעמוד התראות</Button>
                  </Link>
                </div>
                <p className="text-muted-foreground">
                  צפה בכל ההתראות שהסוכנים זיהו, כולל חריגות ותובנות חשובות.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </DomainErrorBoundary>
    </MainLayout>
  );
}
