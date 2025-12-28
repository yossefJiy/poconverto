import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plug,
  Check,
  X,
  RefreshCw,
  Loader2,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Info,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const NOTIFY_EMAIL = "yossef@jiy.co.il";

const platformOptions = [
  { 
    id: "shopify", 
    name: "Shopify", 
    logo: "🛍️", 
    color: "bg-[#96BF48]",
    description: "סנכרון נתוני מכירות, מוצרים והזמנות",
    credentialKey: "store_url",
    placeholder: "mystore.myshopify.com",
    steps: [
      { title: "היכנס לחשבון Shopify שלך", description: "פתח את הדשבורד של החנות" },
      { title: "העתק את כתובת החנות", description: "הכתובת נמצאת בשורת הכתובת: yourstore.myshopify.com" },
      { title: "הדבק את הכתובת למטה", description: "ודא שהכתובת מכילה .myshopify.com" },
    ],
    helpUrl: "https://help.shopify.com/en/manual/your-account/account-settings",
    features: ["הזמנות בזמן אמת", "מלאי מוצרים", "נתוני לקוחות", "דוחות מכירות"],
  },
  { 
    id: "google_analytics", 
    name: "Google Analytics", 
    logo: "📊", 
    color: "bg-[#F9AB00]",
    description: "נתוני תנועה והתנהגות גולשים",
    credentialKey: "property_id",
    placeholder: "G-XXXXXXXXXX",
    steps: [
      { title: "היכנס ל-Google Analytics", description: "עבור ל-analytics.google.com" },
      { title: "בחר את ה-Property הרצוי", description: "לחץ על Admin > Property Settings" },
      { title: "העתק את Property ID", description: "המזהה מתחיל ב-G- ומכיל 10 תווים" },
    ],
    helpUrl: "https://support.google.com/analytics/answer/9539598",
    features: ["סשנים וצפיות", "מקורות תנועה", "המרות", "התנהגות גולשים"],
  },
  { 
    id: "google_ads", 
    name: "Google Ads", 
    logo: "G", 
    color: "bg-[#4285F4]",
    description: "סנכרון קמפיינים ונתוני ביצועים",
    credentialKey: "customer_id",
    placeholder: "123-456-7890",
    steps: [
      { title: "היכנס ל-Google Ads", description: "עבור ל-ads.google.com" },
      { title: "מצא את Customer ID", description: "המספר מופיע בפינה הימנית העליונה" },
      { title: "העתק בפורמט הנכון", description: "הפורמט: XXX-XXX-XXXX" },
    ],
    helpUrl: "https://support.google.com/google-ads/answer/1704344",
    features: ["קמפיינים", "מילות מפתח", "המרות", "עלויות"],
  },
  { 
    id: "facebook_ads", 
    name: "Facebook Ads", 
    logo: "f", 
    color: "bg-[#1877F2]",
    description: "קבלת נתוני קמפיינים מ-Facebook Business",
    credentialKey: "ad_account_id",
    placeholder: "act_123456789",
    steps: [
      { title: "היכנס ל-Business Manager", description: "עבור ל-business.facebook.com" },
      { title: "לחץ על Business Settings", description: "בחר Accounts > Ad Accounts" },
      { title: "העתק את Ad Account ID", description: "המזהה מתחיל ב-act_" },
    ],
    helpUrl: "https://www.facebook.com/business/help/1492627900875762",
    features: ["קמפיינים", "קבוצות מודעות", "Insights", "המרות"],
  },
  { 
    id: "instagram", 
    name: "Instagram", 
    logo: "📷", 
    color: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
    description: "מעקב אחר ביצועי תוכן ומודעות",
    credentialKey: "ad_account_id",
    placeholder: "17841400...",
    steps: [
      { title: "ודא שיש לך Business Account", description: "הגדרות > חשבון > עבור לחשבון עסקי" },
      { title: "חבר לדף פייסבוק", description: "חובה לחיבור ל-Facebook Business" },
      { title: "העתק Business Account ID", description: "ניתן למצוא ב-Graph API Explorer" },
    ],
    helpUrl: "https://help.instagram.com/502981923235522",
    features: ["פוסטים", "סטוריז", "Reels", "Insights"],
  },
  { 
    id: "linkedin", 
    name: "LinkedIn", 
    logo: "in", 
    color: "bg-[#0A66C2]",
    description: "קמפיינים ונתוני מודעות מ-LinkedIn",
    credentialKey: "ad_account_id",
    placeholder: "123456789",
    steps: [
      { title: "היכנס ל-Campaign Manager", description: "עבור ל-linkedin.com/campaignmanager" },
      { title: "בחר את החשבון הפרסומי", description: "לחץ על שם החשבון בראש העמוד" },
      { title: "העתק את Account ID", description: "המספר מופיע ב-URL" },
    ],
    helpUrl: "https://www.linkedin.com/help/lms/answer/a424270",
    features: ["קמפיינים", "קריאייטיבים", "אנליטיקס"],
  },
  { 
    id: "tiktok", 
    name: "TikTok", 
    logo: "♪", 
    color: "bg-[#000000]",
    description: "מעקב אחר ביצועי מודעות בטיקטוק",
    credentialKey: "advertiser_id",
    placeholder: "1234567890",
    steps: [
      { title: "היכנס ל-TikTok Ads Manager", description: "עבור ל-ads.tiktok.com" },
      { title: "לחץ על Assets", description: "בחר Account Settings" },
      { title: "העתק Advertiser ID", description: "המספר מופיע בראש העמוד" },
    ],
    helpUrl: "https://ads.tiktok.com/help/article?aid=9663",
    features: ["קמפיינים", "מודעות", "דוחות ביצועים"],
  },
];

export default function Integrations() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<typeof platformOptions[0] | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [credential, setCredential] = useState("");
  const [loginCustomerId, setLoginCustomerId] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectionMessage, setConnectionMessage] = useState("");

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["integrations", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("client_id", selectedClient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient || !selectedPlatform) throw new Error("Missing data");
      
      // Build credentials object
      const credentialsData: Record<string, string> = { 
        [selectedPlatform.credentialKey]: credential 
      };
      
      // Add login_customer_id for Google Ads if provided
      if (selectedPlatform.id === 'google_ads' && loginCustomerId) {
        credentialsData.login_customer_id = loginCustomerId;
      }
      
      const { data, error } = await supabase.functions.invoke('connect-integration', {
        body: {
          action: "connect",
          platform: selectedPlatform.id,
          client_id: selectedClient.id,
          credentials: credentialsData,
          notify_email: NOTIFY_EMAIL,
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setConnectionStatus("success");
        setConnectionMessage(data.message);
        queryClient.invalidateQueries({ queryKey: ["integrations"] });
        toast.success(data.message);
      } else {
        setConnectionStatus("error");
        setConnectionMessage(data.message);
        toast.error(data.message);
      }
    },
    onError: (error: any) => {
      setConnectionStatus("error");
      setConnectionMessage(error.message || "שגיאה בחיבור");
      toast.error("שגיאה בחיבור לפלטפורמה");
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient || !selectedPlatform) throw new Error("Missing data");
      
      // Build credentials object
      const credentialsData: Record<string, string> = { 
        [selectedPlatform.credentialKey]: credential 
      };
      
      // Add login_customer_id for Google Ads if provided
      if (selectedPlatform.id === 'google_ads' && loginCustomerId) {
        credentialsData.login_customer_id = loginCustomerId;
      }
      
      const { data, error } = await supabase.functions.invoke('connect-integration', {
        body: {
          action: "test",
          platform: selectedPlatform.id,
          client_id: selectedClient.id,
          credentials: credentialsData,
          notify_email: NOTIFY_EMAIL,
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setConnectionStatus("success");
        setConnectionMessage(data.message);
      } else {
        setConnectionStatus("error");
        setConnectionMessage(data.message);
      }
    },
    onError: () => {
      setConnectionStatus("error");
      setConnectionMessage("שגיאה בבדיקת החיבור");
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { data, error } = await supabase.functions.invoke('connect-integration', {
        body: { action: "sync", integration_id: integrationId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("הסנכרון הושלם בהצלחה");
    },
    onError: () => toast.error("שגיאה בסנכרון"),
  });

  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase.from("integrations").delete().eq("id", integrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("החיבור הוסר");
    },
  });

  const handlePlatformSelect = (platform: typeof platformOptions[0]) => {
    setSelectedPlatform(platform);
    setCurrentStep(0);
    setCredential("");
    setLoginCustomerId("");
    setConnectionStatus("idle");
    setConnectionMessage("");
  };

  const handleConnect = () => {
    setConnectionStatus("testing");
    connectMutation.mutate();
  };

  const handleTest = () => {
    setConnectionStatus("testing");
    testMutation.mutate();
  };

  const resetDialog = () => {
    setShowDialog(false);
    setSelectedPlatform(null);
    setCurrentStep(0);
    setCredential("");
    setLoginCustomerId("");
    setConnectionStatus("idle");
    setConnectionMessage("");
  };

  const connectedCount = integrations.filter(i => i.is_connected).length;

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader title="חיבורים" description="בחר לקוח כדי לנהל חיבורי נתונים" />
          <div className="glass rounded-xl p-12 text-center">
            <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח כדי להתחיל</h3>
            <p className="text-muted-foreground mb-4">
              כדי לחבר פלטפורמות, יש לבחור לקוח מהתפריט בסרגל הצד השמאלי, או ליצור לקוח חדש
            </p>
            <div className="flex items-center justify-center gap-2">
              <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-primary font-medium">בחר לקוח מהתפריט בצד שמאל</span>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        <PageHeader 
          title={`חיבורים - ${selectedClient.name}`}
          description="נהל חיבורים לפלטפורמות לקבלת נתונים בזמן אמת"
          actions={
            <Button className="glow" onClick={() => setShowDialog(true)}>
              <Plug className="w-4 h-4 ml-2" />
              חיבור חדש
            </Button>
          }
        />

        {/* Notification info */}
        <Alert className="mb-6">
          <Mail className="h-4 w-4" />
          <AlertTitle>התראות אוטומטיות</AlertTitle>
          <AlertDescription>
            במקרה של כשלון חיבור, תישלח הודעה אוטומטית ל-{NOTIFY_EMAIL} עם פירוט הבעיה והצעדים לתיקון.
          </AlertDescription>
        </Alert>

        {/* Stats */}
        {integrations.length > 0 && (
          <div className="glass rounded-xl p-4 mb-6 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Plug className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">חיבורים פעילים</p>
                <p className="font-bold">{connectedCount}/{integrations.length}</p>
              </div>
            </div>
            <Progress value={(connectedCount / integrations.length) * 100} className="flex-1 h-2" />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : integrations.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">אין חיבורים עדיין</h3>
            <p className="text-muted-foreground mb-4">חבר את פלטפורמות הפרסום שלך לקבלת נתונים בזמן אמת</p>
            <Button onClick={() => setShowDialog(true)}>
              <Plug className="w-4 h-4 ml-2" />
              הוסף חיבור ראשון
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => {
              const platform = platformOptions.find(p => p.id === integration.platform);
              return (
                <div key={integration.id} className="glass rounded-xl overflow-hidden card-shadow group">
                  <div className={cn("h-2", platform?.color || "bg-muted")} />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold", platform?.color)}>
                          {platform?.logo}
                        </div>
                        <div>
                          <h3 className="font-bold">{platform?.name}</h3>
                          <p className="text-sm text-muted-foreground">{integration.external_account_id}</p>
                        </div>
                      </div>
                      <Badge variant={integration.is_connected ? "default" : "secondary"}>
                        {integration.is_connected ? "מחובר" : "מנותק"}
                      </Badge>
                    </div>

                    {platform?.features && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {platform.features.slice(0, 3).map((f) => (
                          <span key={f} className="text-xs px-2 py-1 bg-muted rounded-full">{f}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {integration.last_sync_at ? new Date(integration.last_sync_at).toLocaleString("he-IL") : "לא סונכרן"}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => syncMutation.mutate(integration.id)} disabled={syncMutation.isPending}>
                        {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 ml-1" />}
                        סנכרן
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => disconnectMutation.mutate(integration.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connection Dialog */}
      <Dialog open={showDialog} onOpenChange={resetDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlatform ? `חיבור ${selectedPlatform.name}` : "בחר פלטפורמה לחיבור"}</DialogTitle>
            <DialogDescription>
              {selectedPlatform ? selectedPlatform.description : "בחר את הפלטפורמה שברצונך לחבר"}
            </DialogDescription>
          </DialogHeader>

          {!selectedPlatform ? (
            <div className="grid grid-cols-2 gap-4 mt-4">
              {platformOptions.map((platform) => {
                const isConnected = integrations.some(i => i.platform === platform.id);
                return (
                  <button
                    key={platform.id}
                    onClick={() => handlePlatformSelect(platform)}
                    disabled={isConnected}
                    className={cn(
                      "p-4 rounded-xl border-2 border-border hover:border-primary transition-all text-right",
                      isConnected && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg font-bold", platform.color)}>
                        {platform.logo}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold">{platform.name}</p>
                        {isConnected && <Badge variant="secondary">מחובר</Badge>}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{platform.description}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {/* Steps */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  שלבי החיבור:
                </h4>
                {selectedPlatform.steps.map((step, index) => (
                  <div key={index} className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors",
                    currentStep === index ? "bg-primary/10 border border-primary" : "bg-muted/50"
                  )}>
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                      currentStep > index ? "bg-success text-white" : currentStep === index ? "bg-primary text-white" : "bg-muted-foreground/30"
                    )}>
                      {currentStep > index ? <Check className="w-3 h-3" /> : index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{selectedPlatform.id === 'google_ads' ? 'Customer ID (החשבון שרוצים לקרוא):' : 'הזן את המזהה:'}</Label>
                  <Input
                    value={credential}
                    onChange={(e) => {
                      setCredential(e.target.value);
                      setCurrentStep(2);
                      setConnectionStatus("idle");
                    }}
                    placeholder={selectedPlatform.placeholder}
                    dir="ltr"
                    className="text-left"
                  />
                </div>

                {/* Login Customer ID for Google Ads MCC */}
                {selectedPlatform.id === 'google_ads' && (
                  <div className="space-y-2">
                    <Label>Login Customer ID (MCC - אופציונלי):</Label>
                    <Input
                      value={loginCustomerId}
                      onChange={(e) => {
                        setLoginCustomerId(e.target.value);
                        setConnectionStatus("idle");
                      }}
                      placeholder="123-456-7890"
                      dir="ltr"
                      className="text-left"
                    />
                    <p className="text-xs text-muted-foreground">
                      אם החשבון מנוהל תחת MCC, הזן את מזהה ה-MCC. אם לא, השאר ריק.
                    </p>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">לאחר החיבור תקבל גישה ל:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPlatform.features.map((f) => (
                    <Badge key={f} variant="outline">{f}</Badge>
                  ))}
                </div>
              </div>

              {/* Status */}
              {connectionStatus !== "idle" && (
                <Alert variant={connectionStatus === "success" ? "default" : connectionStatus === "error" ? "destructive" : "default"}>
                  {connectionStatus === "testing" && <Loader2 className="h-4 w-4 animate-spin" />}
                  {connectionStatus === "success" && <CheckCircle2 className="h-4 w-4 text-success" />}
                  {connectionStatus === "error" && <AlertTriangle className="h-4 w-4" />}
                  <AlertTitle>
                    {connectionStatus === "testing" && "בודק חיבור..."}
                    {connectionStatus === "success" && "החיבור הצליח!"}
                    {connectionStatus === "error" && "החיבור נכשל"}
                  </AlertTitle>
                  <AlertDescription>
                    {connectionMessage}
                    {connectionStatus === "error" && (
                      <p className="mt-2 text-sm">נשלח מייל הסבר ל-{NOTIFY_EMAIL}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedPlatform(null)} className="flex-1">
                  חזור
                </Button>
                <Button variant="outline" onClick={handleTest} disabled={!credential || connectionStatus === "testing"}>
                  בדוק חיבור
                </Button>
                <Button onClick={handleConnect} disabled={!credential || connectionStatus === "testing"} className="flex-1 glow">
                  {connectionStatus === "testing" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      התחבר
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </>
                  )}
                </Button>
              </div>

              {/* Help link */}
              <a href={selectedPlatform.helpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline justify-center">
                <ExternalLink className="w-3 h-3" />
                מדריך מפורט ל-{selectedPlatform.name}
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}