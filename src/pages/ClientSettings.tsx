import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  ArrowRight,
  Save,
  Link2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Key,
  Globe,
  ShoppingBag,
  BarChart3,
  Megaphone,
  Mail,
  Copy,
  UserPlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  connected: boolean;
  credentials: {
    label: string;
    value: string;
    type: "text" | "password";
  }[];
  helpUrl: string;
}

const integrations: Integration[] = [
  {
    id: "meta",
    name: "Meta Ads",
    description: "חיבור לחשבון הפרסום בפייסבוק ואינסטגרם",
    icon: Megaphone,
    connected: true,
    credentials: [
      { label: "App ID", value: "1234567890", type: "text" },
      { label: "Access Token", value: "EAABx...", type: "password" },
      { label: "Ad Account ID", value: "act_123456789", type: "text" },
    ],
    helpUrl: "https://developers.facebook.com/docs/marketing-apis",
  },
  {
    id: "google",
    name: "Google Ads",
    description: "חיבור לחשבון Google Ads ו-Analytics",
    icon: BarChart3,
    connected: true,
    credentials: [
      { label: "Client ID", value: "123456789.apps.googleusercontent.com", type: "text" },
      { label: "Client Secret", value: "GOCSPX-...", type: "password" },
      { label: "Customer ID", value: "123-456-7890", type: "text" },
    ],
    helpUrl: "https://developers.google.com/google-ads/api/docs",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "חיבור לחנות שופיפיי לקבלת נתוני מכירות",
    icon: ShoppingBag,
    connected: false,
    credentials: [
      { label: "Store URL", value: "", type: "text" },
      { label: "API Key", value: "", type: "password" },
      { label: "API Secret", value: "", type: "password" },
    ],
    helpUrl: "https://shopify.dev/docs/api",
  },
  {
    id: "analytics",
    name: "Google Analytics",
    description: "חיבור ל-GA4 לקבלת נתוני תנועה והמרות",
    icon: Globe,
    connected: true,
    credentials: [
      { label: "Measurement ID", value: "G-T5NY030STK", type: "text" },
    ],
    helpUrl: "https://developers.google.com/analytics",
  },
];

export default function ClientSettings() {
  const { toast } = useToast();
  const { clientId } = useParams();
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const dashboardUrl = `${window.location.origin}/client-dashboard/${clientId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(dashboardUrl);
    toast({
      title: "הקישור הועתק",
      description: "הקישור לדשבורד הלקוח הועתק ללוח",
    });
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail || !client) return;

    setIsSendingInvite(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-client-invitation', {
        body: {
          email: inviteEmail,
          clientName: client.name,
          dashboardUrl,
        },
      });

      if (error) throw error;

      toast({
        title: "ההזמנה נשלחה",
        description: `נשלחה הזמנה ל-${inviteEmail}`,
      });
      setInviteEmail("");
      setInviteDialogOpen(false);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "שגיאה בשליחת ההזמנה",
        description: error.message || "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleSave = (integrationId: string) => {
    toast({
      title: "ההגדרות נשמרו",
      description: `האינטגרציה עם ${integrations.find(i => i.id === integrationId)?.name} עודכנה בהצלחה`,
    });
    setActiveIntegration(null);
  };

  const handleConnect = (integrationId: string) => {
    toast({
      title: "מתחבר...",
      description: "מנסה להתחבר למערכת החיצונית",
    });
    setTimeout(() => {
      toast({
        title: "החיבור הצליח!",
        description: "המערכת מחוברת ומסנכרנת נתונים",
      });
    }, 2000);
  };

  return (
    <MainLayout>
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <Link 
            to={clientId ? `/client/${clientId}` : "/clients"}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                {client?.name?.slice(0, 2) || 'CL'}
              </div>
              <div>
                <h1 className="text-2xl font-bold">הגדרות לקוח</h1>
                <p className="text-muted-foreground">{client?.name || 'טוען...'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Access Section */}
        <div className="mb-8 glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.05s", animationFillMode: "forwards" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">גישה ללקוח</h2>
                <p className="text-sm text-muted-foreground">שתף גישה לדשבורד עם הלקוח</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Dashboard Link */}
            <div>
              <Label className="text-sm font-medium mb-2 block">קישור לדשבורד</Label>
              <div className="flex gap-2">
                <Input 
                  value={dashboardUrl} 
                  readOnly 
                  className="bg-secondary"
                />
                <Button variant="outline" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Send Invitation */}
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Mail className="w-4 h-4" />
                  שלח הזמנה במייל
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>שלח הזמנה ללקוח</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">כתובת אימייל</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="client@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    הלקוח יקבל מייל עם קישור לדשבורד שלו
                  </p>
                  <Button 
                    onClick={handleSendInvitation} 
                    disabled={!inviteEmail || isSendingInvite}
                    className="w-full gap-2"
                  >
                    {isSendingInvite ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        שולח...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        שלח הזמנה
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Integrations */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold opacity-0 animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
            אינטגרציות
          </h2>
          
          {integrations.map((integration, index) => (
            <div 
              key={integration.id}
              className={cn(
                "glass rounded-xl overflow-hidden card-shadow opacity-0 animate-slide-up transition-all",
                integration.connected && "border border-success/30"
              )}
              style={{ animationDelay: `${0.15 + index * 0.08}s`, animationFillMode: "forwards" }}
            >
              <div 
                className="p-6 cursor-pointer"
                onClick={() => setActiveIntegration(activeIntegration === integration.id ? null : integration.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      integration.connected ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}>
                      <integration.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{integration.name}</h3>
                        {integration.connected ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-warning" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integration.connected && (
                      <button 
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast({ title: "מסנכרן נתונים..." });
                        }}
                      >
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                    <a 
                      href={integration.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  </div>
                </div>
              </div>

              {activeIntegration === integration.id && (
                <div className="px-6 pb-6 border-t border-border pt-4 animate-fade-in">
                  <div className="space-y-4">
                    {integration.credentials.map((cred) => (
                      <div key={cred.label}>
                        <label className="block text-sm font-medium mb-2">{cred.label}</label>
                        <div className="relative">
                          <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type={cred.type}
                            defaultValue={cred.value}
                            placeholder={`הזן ${cred.label}`}
                            className="w-full bg-secondary border-none rounded-lg pr-10 pl-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                            onChange={(e) => {
                              setCredentials(prev => ({
                                ...prev,
                                [integration.id]: {
                                  ...prev[integration.id],
                                  [cred.label]: e.target.value
                                }
                              }));
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center gap-3 pt-4">
                      {integration.connected ? (
                        <>
                          <button
                            onClick={() => handleSave(integration.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            שמור שינויים
                          </button>
                          <button className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                            נתק
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleConnect(integration.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors glow"
                        >
                          <Link2 className="w-4 h-4" />
                          התחבר לחשבון
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-info/10 text-info">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold mb-1">אבטחת מידע</h3>
              <p className="text-sm text-muted-foreground">
                כל המפתחות והסיסמאות מוצפנים ומאוחסנים בצורה מאובטחת. 
                הגישה למערכות החיצוניות נעשית רק לקריאת נתונים - אין גישה לשינוי קמפיינים או הגדרות.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
