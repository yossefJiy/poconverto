import { useState, useEffect } from "react";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
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
  Building2,
  Search,
  ShoppingBag,
  BarChart3,
  Target,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

const NOTIFY_EMAIL = "yossef@jiy.co.il";

// Platform Icons as SVG components
const ShopifyIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M15.337 3.415c-.088-.006-.183-.006-.271-.006-.183 0-.366.006-.543.025a1.073 1.073 0 00-.872.771l-.348 1.212c-.012.044-.024.082-.036.119a4.156 4.156 0 00-1.462-.256c-2.055 0-3.839 1.559-4.282 3.778-.177.89-.106 1.73.206 2.423.32.716.852 1.189 1.486 1.372l-.543 1.889c-.088.301.082.614.382.702l2.38.696c.3.088.614-.082.702-.382l.902-3.137c.088-.301-.082-.614-.382-.702l-.602-.176c-.196-.057-.325-.183-.368-.354a1.023 1.023 0 01.075-.565c.196-.496.615-.921 1.141-1.128.113-.044.232-.075.354-.094l-.614 2.137c-.088.301.082.614.382.702l2.38.696c.3.088.614-.082.702-.382l1.446-5.034c.225-.778-.088-1.609-.765-2.029a2.51 2.51 0 00-1.448-.471zm.271 2.549l-.755 2.625-.908-.265.755-2.625.908.265z"/>
  </svg>
);

const GoogleAnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fillOpacity="0"/>
    <rect x="4" y="14" width="4" height="6" rx="1" fill="#F9AB00"/>
    <rect x="10" y="10" width="4" height="10" rx="1" fill="#E37400"/>
    <rect x="16" y="4" width="4" height="16" rx="1" fill="#F9AB00"/>
  </svg>
);

const GoogleAdsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <circle cx="6" cy="18" r="3" fill="#FBBC04"/>
    <path d="M14.5 4l-8 14h5l8-14h-5z" fill="#4285F4"/>
    <path d="M21 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" fill="#34A853"/>
  </svg>
);

const FacebookAdsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const WooCommerceIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#96588A">
    <path d="M2.227 4.857A2.228 2.228 0 000 7.094v7.457c0 1.236 1.001 2.237 2.237 2.237h3.09l-.396 3.063 3.558-3.063h11.283c1.236 0 2.228-1.001 2.228-2.237V7.094c0-1.236-1.001-2.237-2.237-2.237H2.227zm4.012 1.821c.61 0 1.063.198 1.359.594.247.331.38.775.399 1.332l-.658.064c-.019-.401-.096-.7-.231-.899-.172-.254-.418-.38-.738-.38-.439 0-.778.237-.997.711-.187.389-.282.896-.282 1.521 0 .654.095 1.167.282 1.539.22.465.558.697.997.697.32 0 .566-.135.738-.406.135-.198.212-.488.231-.868l.658.064c-.019.538-.152.973-.399 1.305-.296.405-.749.608-1.359.608-.724 0-1.285-.29-1.682-.871-.33-.484-.495-1.128-.495-1.932 0-.834.165-1.49.495-1.969.397-.581.958-.871 1.682-.871zm3.563.113h.723l.952 3.73.952-3.73h.732l.952 3.73.952-3.73h.706l-1.275 4.871h-.788l-.952-3.609-.952 3.609h-.788l-1.275-4.871zm6.556 0h2.56v.593h-1.877v1.454h1.748v.593h-1.748v1.639h1.932v.593h-2.615v-4.872z"/>
  </svg>
);

interface PlatformOption {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  credentialKey: string;
  placeholder: string;
  useMccSelection?: boolean;
  steps: { title: string; description: string }[];
  helpUrl: string;
  features: string[];
}

interface MccAccount {
  id: string;
  name: string;
  currency: string;
}

const platformOptions: PlatformOption[] = [
  { 
    id: "shopify", 
    name: "Shopify", 
    icon: () => <ShoppingBag className="w-5 h-5" />,
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
    id: "woocommerce", 
    name: "WooCommerce", 
    icon: () => <Store className="w-5 h-5" />,
    color: "bg-[#96588A]",
    description: "סנכרון נתוני חנות WordPress + WooCommerce",
    credentialKey: "store_url",
    placeholder: "https://mystore.com",
    steps: [
      { title: "היכנס לאזור הניהול של WordPress", description: "עבור ל-WooCommerce > Settings > Advanced > REST API" },
      { title: "צור מפתח API חדש", description: "לחץ על 'Add key' והגדר הרשאות Read" },
      { title: "הזן את כתובת האתר למטה", description: "הזן את כתובת האתר הראשית" },
    ],
    helpUrl: "https://woocommerce.com/document/woocommerce-rest-api/",
    features: ["הזמנות", "מוצרים", "לקוחות", "דוחות מכירות"],
  },
  { 
    id: "google_analytics", 
    name: "Google Analytics", 
    icon: () => <BarChart3 className="w-5 h-5" />,
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
    icon: () => <Target className="w-5 h-5" />,
    color: "bg-[#4285F4]",
    description: "סנכרון קמפיינים ונתוני ביצועים",
    credentialKey: "customer_id",
    placeholder: "123-456-7890",
    useMccSelection: true,
    steps: [
      { title: "בחר חשבון מהרשימה", description: "בחר את החשבון הפרסומי של הלקוח" },
      { title: "אישור החיבור", description: "לחץ על 'התחבר' לסיום" },
    ],
    helpUrl: "https://support.google.com/google-ads/answer/1704344",
    features: ["קמפיינים", "מילות מפתח", "המרות", "עלויות"],
  },
  { 
    id: "facebook_ads", 
    name: "Facebook Ads", 
    icon: () => <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
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
  const [selectedMccAccount, setSelectedMccAccount] = useState<MccAccount | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Auto-select platform if defaultPlatform is provided
  useEffect(() => {
    if (open && defaultPlatform) {
      const platform = platformOptions.find(p => p.id === defaultPlatform);
      if (platform) {
        setSelectedPlatform(platform);
      }
    }
  }, [open, defaultPlatform]);

  // Fetch MCC accounts when Google Ads is selected
  const { data: mccAccounts = [], isLoading: isLoadingMcc } = useQuery({
    queryKey: ["mcc-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('google-ads-oauth', {
        body: { action: 'list_mcc_accounts' }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.accounts as MccAccount[];
    },
    enabled: open && selectedPlatform?.id === 'google_ads',
  });

  // Filter accounts by search
  const filteredAccounts = mccAccounts.filter(account => 
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.id.includes(searchQuery)
  );

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
      
      // For Google Ads with MCC selection
      const credentialValue = selectedPlatform.useMccSelection && selectedMccAccount 
        ? selectedMccAccount.id 
        : credential;
      
      const { data, error } = await supabase.functions.invoke('connect-integration', {
        body: {
          action: "connect",
          platform: selectedPlatform.id,
          client_id: selectedClient.id,
          credentials: { [selectedPlatform.credentialKey]: credentialValue },
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
    setSelectedMccAccount(null);
    setConnectionStatus("idle");
    setConnectionMessage("");
    setSearchQuery("");
  };

  const handleMccAccountSelect = (account: MccAccount) => {
    setSelectedMccAccount(account);
    setCurrentStep(1);
  };

  const handleConnect = () => {
    setConnectionStatus("testing");
    connectMutation.mutate();
  };

  const resetDialog = () => {
    onOpenChange(false);
    setSelectedPlatform(null);
    setCurrentStep(0);
    setCredential("");
    setSelectedMccAccount(null);
    setConnectionStatus("idle");
    setConnectionMessage("");
    setSearchQuery("");
  };

  if (!selectedClient) {
    return null;
  }

  const canConnect = selectedPlatform?.useMccSelection 
    ? !!selectedMccAccount 
    : !!credential;

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
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", platform?.color)}>
                          {platform && <platform.icon />}
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
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", platform.color)}>
                          <platform.icon />
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
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2 text-sm">
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
                    <p className="font-medium text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* MCC Account Selection for Google Ads */}
            {selectedPlatform.useMccSelection && (
              <div className="space-y-3">
                <Label>בחר חשבון Google Ads או הזן מספר לקוח:</Label>
                
                {/* Search / Manual Input */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="חפש לפי שם, או הזן מספר לקוח (123-456-7890)..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      // If user enters a valid customer ID format, use it directly
                      const cleanId = e.target.value.replace(/\D/g, '');
                      if (cleanId.length === 10) {
                        const formattedId = cleanId.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
                        setSelectedMccAccount({ id: formattedId, name: 'חשבון ידני', currency: 'ILS' });
                        setCurrentStep(1);
                      } else if (!mccAccounts.find(a => a.id === e.target.value)) {
                        setSelectedMccAccount(null);
                      }
                    }}
                    className="pr-10"
                    dir="rtl"
                  />
                </div>

                {isLoadingMcc ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <div className="text-center">
                      <p className="font-medium text-foreground">טוען חשבונות מ-MCC...</p>
                      <p className="text-sm text-muted-foreground">מתחבר ל-Google Ads API</p>
                    </div>
                  </div>
                ) : filteredAccounts.length === 0 && !selectedMccAccount ? (
                  <div className="text-center py-8 space-y-3">
                    <div className="text-muted-foreground">
                      {searchQuery ? "לא נמצאו חשבונות תואמים" : "לא נמצאו חשבונות ב-MCC"}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      💡 ניתן להזין מספר לקוח ידנית בפורמט: 123-456-7890
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[250px] rounded-lg border">
                    <div className="p-2 space-y-2">
                      {filteredAccounts.map((account) => {
                        // Check if this account is already connected to another client
                        const isConnectedToOther = false; // Will be checked via query
                        return (
                          <button
                            key={account.id}
                            onClick={() => handleMccAccountSelect(account)}
                            disabled={isConnectedToOther}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-right",
                              selectedMccAccount?.id === account.id 
                                ? "border-primary bg-primary/10" 
                                : "border-transparent bg-muted/50 hover:bg-muted",
                              isConnectedToOther && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="w-10 h-10 rounded-lg bg-[#4285F4]/20 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-[#4285F4]" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{account.name}</p>
                              <p className="text-xs text-muted-foreground">{account.id} • {account.currency}</p>
                            </div>
                            {selectedMccAccount?.id === account.id && (
                              <Check className="w-5 h-5 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
                
                {/* Show selected manual account */}
                {selectedMccAccount && !filteredAccounts.find(a => a.id === selectedMccAccount.id) && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <AlertTitle>מספר לקוח נבחר</AlertTitle>
                    <AlertDescription>
                      חשבון: {selectedMccAccount.id}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Manual Input for other platforms */}
            {!selectedPlatform.useMccSelection && (
              <div className="space-y-2">
                <Label>הזן את המזהה:</Label>
                <Input
                  value={credential}
                  onChange={(e) => {
                    setCredential(e.target.value);
                    setCurrentStep(1);
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
                  {connectionStatus === "testing" && "מתחבר..."}
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
              <Button onClick={handleConnect} disabled={!canConnect || connectionStatus === "testing"} className="flex-1 glow">
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
