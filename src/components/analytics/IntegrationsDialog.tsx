import { useState, useEffect } from "react";
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
  LogIn,
  Plus
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

const NOTIFY_EMAIL = "yossef@jiy.co.il";

interface PlatformOption {
  id: string;
  name: string;
  logo: string;
  color: string;
  description: string;
  credentialKey: string;
  placeholder: string;
  useOAuth?: boolean;
  steps: { title: string; description: string }[];
  helpUrl: string;
  features: string[];
}

const platformOptions: PlatformOption[] = [
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
    useOAuth: true,
    steps: [
      { title: "לחץ על 'התחבר עם Google'", description: "תועבר לדף האישור של Google" },
      { title: "אשר גישה לחשבון Google Ads", description: "בחר את החשבון הפרסומי שברצונך לחבר" },
      { title: "הזן Customer ID", description: "הפורמט: XXX-XXX-XXXX (מופיע בפינה הימנית העליונה ב-Google Ads)" },
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
];

interface IntegrationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPlatform?: string;
}

export function IntegrationsDialog({ open, onOpenChange, defaultPlatform }: IntegrationsDialogProps) {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformOption | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [credential, setCredential] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [oauthCompleted, setOauthCompleted] = useState(false);

  // Auto-select platform if defaultPlatform is provided
  useEffect(() => {
    if (open && defaultPlatform) {
      const platform = platformOptions.find(p => p.id === defaultPlatform);
      if (platform) {
        setSelectedPlatform(platform);
      }
    }
  }, [open, defaultPlatform]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state) {
      handleOAuthCallback(code, state);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      const stateData = JSON.parse(atob(state));
      const clientId = stateData.client_id;

      setConnectionStatus("testing");
      setConnectionMessage("משלים את החיבור ל-Google Ads...");
      onOpenChange(true);
      setSelectedPlatform(platformOptions.find(p => p.id === 'google_ads') || null);

      const { data, error } = await supabase.functions.invoke('google-ads-oauth', {
        body: {
          action: 'exchange_code',
          code,
          redirect_uri: window.location.origin + window.location.pathname,
          client_id: clientId,
        }
      });

      if (error) throw error;

      if (data.success) {
        setConnectionStatus("success");
        setConnectionMessage(data.message);
        setOauthCompleted(true);
        setCurrentStep(2);
        queryClient.invalidateQueries({ queryKey: ["integrations"] });
        toast.success("החיבור ל-Google Ads הושלם!");
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('OAuth callback error:', err);
      setConnectionStatus("error");
      setConnectionMessage(err instanceof Error ? err.message : "שגיאה בחיבור");
      toast.error("שגיאה בחיבור ל-Google Ads");
    }
  };

  const handleGoogleOAuth = async () => {
    if (!selectedClient) return;

    try {
      setConnectionStatus("testing");
      setConnectionMessage("מתחבר ל-Google...");

      const { data, error } = await supabase.functions.invoke('google-ads-oauth', {
        body: {
          action: 'get_auth_url',
          client_id: selectedClient.id,
          redirect_uri: window.location.origin + window.location.pathname,
        }
      });

      if (error) throw error;

      if (data.success && data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        throw new Error(data.error || 'Failed to get auth URL');
      }
    } catch (err) {
      console.error('OAuth error:', err);
      setConnectionStatus("error");
      setConnectionMessage(err instanceof Error ? err.message : "שגיאה בהתחברות");
    }
  };

  const { data: integrations = [] } = useQuery({
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
      
      const { data, error } = await supabase.functions.invoke('connect-integration', {
        body: {
          action: "connect",
          platform: selectedPlatform.id,
          client_id: selectedClient.id,
          credentials: { [selectedPlatform.credentialKey]: credential },
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
        queryClient.invalidateQueries({ queryKey: ["google-ads"] });
        toast.success(data.message);
        // Close dialog after successful connection
        setTimeout(() => {
          resetDialog();
        }, 1500);
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
      
      const { data, error } = await supabase.functions.invoke('connect-integration', {
        body: {
          action: "test",
          platform: selectedPlatform.id,
          client_id: selectedClient.id,
          credentials: { [selectedPlatform.credentialKey]: credential },
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
      queryClient.invalidateQueries({ queryKey: ["google-ads"] });
      toast.success("החיבור הוסר");
    },
  });

  const handlePlatformSelect = (platform: PlatformOption) => {
    setSelectedPlatform(platform);
    setCurrentStep(0);
    setCredential("");
    setConnectionStatus("idle");
    setConnectionMessage("");
    setOauthCompleted(false);
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
    onOpenChange(false);
    setSelectedPlatform(null);
    setCurrentStep(0);
    setCredential("");
    setConnectionStatus("idle");
    setConnectionMessage("");
    setOauthCompleted(false);
  };

  if (!selectedClient) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={resetDialog}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedPlatform ? `חיבור ${selectedPlatform.name}` : "ניהול אינטגרציות"}</DialogTitle>
          <DialogDescription>
            {selectedPlatform ? selectedPlatform.description : "חבר פלטפורמות או נהל חיבורים קיימים"}
          </DialogDescription>
        </DialogHeader>

        {!selectedPlatform ? (
          <div className="space-y-6 mt-4">
            {/* Existing Integrations */}
            {integrations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">חיבורים קיימים:</h4>
                {integrations.map((integration) => {
                  const platform = platformOptions.find(p => p.id === integration.platform);
                  return (
                    <div key={integration.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold", platform?.color)}>
                          {platform?.logo}
                        </div>
                        <div>
                          <p className="font-medium">{platform?.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {integration.last_sync_at ? new Date(integration.last_sync_at).toLocaleString("he-IL") : "לא סונכרן"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={integration.is_connected ? "default" : "secondary"}>
                          {integration.is_connected ? "מחובר" : "מנותק"}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => syncMutation.mutate(integration.id)} disabled={syncMutation.isPending}>
                          <RefreshCw className={cn("w-4 h-4", syncMutation.isPending && "animate-spin")} />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => disconnectMutation.mutate(integration.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add New Integration */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground">הוסף אינטגרציה חדשה:</h4>
              <div className="grid grid-cols-2 gap-4">
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
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold", platform.color)}>
                          {platform.logo}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm">{platform.name}</p>
                          {isConnected && <Badge variant="secondary" className="text-xs">מחובר</Badge>}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{platform.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
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

            {/* OAuth Button for Google Ads */}
            {selectedPlatform.useOAuth && !oauthCompleted && (
              <Button 
                onClick={handleGoogleOAuth} 
                disabled={connectionStatus === "testing"}
                className="w-full glow"
                size="lg"
              >
                {connectionStatus === "testing" ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <LogIn className="w-4 h-4 ml-2" />
                )}
                התחבר עם Google
              </Button>
            )}

            {/* Input */}
            {(!selectedPlatform.useOAuth || oauthCompleted) && (
              <div className="space-y-2">
                <Label>{oauthCompleted ? "הזן Customer ID:" : "הזן את המזהה:"}</Label>
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
            )}

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
  );
}
