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
  Settings2,
  Zap,
  ShoppingBag,
  TrendingUp,
  BarChart3
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
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const platformOptions = [
  { 
    id: "google_ads", 
    name: "Google Ads", 
    logo: "G", 
    color: "bg-[#4285F4]",
    description: "סנכרון קמפיינים ונתוני ביצועים מ-Google Ads",
    fields: [
      { key: "customer_id", label: "Customer ID", placeholder: "123-456-7890" },
    ]
  },
  { 
    id: "facebook_ads", 
    name: "Facebook Ads", 
    logo: "f", 
    color: "bg-[#1877F2]",
    description: "קבלת נתוני קמפיינים מ-Facebook Business",
    fields: [
      { key: "ad_account_id", label: "Ad Account ID", placeholder: "act_123456789" },
    ]
  },
  { 
    id: "instagram", 
    name: "Instagram", 
    logo: "📷", 
    color: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
    description: "מעקב אחר ביצועי תוכן ומודעות באינסטגרם",
    fields: [
      { key: "business_account_id", label: "Business Account ID", placeholder: "17841400..." },
    ]
  },
  { 
    id: "shopify", 
    name: "Shopify", 
    logo: "🛍️", 
    color: "bg-[#96BF48]",
    description: "סנכרון נתוני מכירות, מוצרים והזמנות",
    fields: [
      { key: "store_url", label: "Store URL", placeholder: "mystore.myshopify.com" },
    ]
  },
  { 
    id: "google_analytics", 
    name: "Google Analytics", 
    logo: "📊", 
    color: "bg-[#F9AB00]",
    description: "נתוני תנועה והתנהגות גולשים",
    fields: [
      { key: "property_id", label: "Property ID", placeholder: "G-XXXXXXXXXX" },
    ]
  },
  { 
    id: "linkedin", 
    name: "LinkedIn", 
    logo: "in", 
    color: "bg-[#0A66C2]",
    description: "קמפיינים ונתוני מודעות מ-LinkedIn",
    fields: [
      { key: "ad_account_id", label: "Ad Account ID", placeholder: "123456789" },
    ]
  },
  { 
    id: "tiktok", 
    name: "TikTok", 
    logo: "♪", 
    color: "bg-[#000000]",
    description: "מעקב אחר ביצועי מודעות בטיקטוק",
    fields: [
      { key: "advertiser_id", label: "Advertiser ID", placeholder: "1234567890" },
    ]
  },
];

export default function Integrations() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<typeof platformOptions[0] | null>(null);
  const [newIntegration, setNewIntegration] = useState({
    platform: "",
    external_account_id: "",
    settings: {} as Record<string, string>,
  });

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

  const createMutation = useMutation({
    mutationFn: async (integration: typeof newIntegration) => {
      if (!selectedClient) throw new Error("בחר לקוח");
      const { error } = await supabase.from("integrations").insert({
        client_id: selectedClient.id,
        platform: integration.platform,
        external_account_id: integration.external_account_id,
        settings: integration.settings,
        is_connected: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("החיבור נוצר בהצלחה");
      setShowDialog(false);
      setSelectedPlatform(null);
      setNewIntegration({ platform: "", external_account_id: "", settings: {} });
    },
    onError: () => toast.error("שגיאה ביצירת חיבור"),
  });

  const toggleConnectionMutation = useMutation({
    mutationFn: async ({ id, is_connected }: { id: string; is_connected: boolean }) => {
      const { error } = await supabase
        .from("integrations")
        .update({ is_connected, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("הסטטוס עודכן");
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { data, error } = await supabase.functions.invoke('sync-integrations', {
        body: { integration_id: integrationId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success(`סונכרנו ${data?.results?.[0]?.campaigns_synced || 0} קמפיינים`);
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error("שגיאה בסנכרון");
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient) throw new Error("בחר לקוח");
      const { data, error } = await supabase.functions.invoke('sync-integrations', {
        body: { client_id: selectedClient.id }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success(`סונכרנו ${data?.synced || 0} חיבורים`);
    },
    onError: () => toast.error("שגיאה בסנכרון"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("integrations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("החיבור נמחק");
    },
  });

  const handlePlatformSelect = (platformId: string) => {
    const platform = platformOptions.find(p => p.id === platformId);
    setSelectedPlatform(platform || null);
    setNewIntegration({ ...newIntegration, platform: platformId, settings: {} });
  };

  const connectedCount = integrations.filter(i => i.is_connected).length;
  const totalCount = integrations.length;

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader title="חיבורים" description="בחר לקוח כדי לנהל חיבורי נתונים" />
          <div className="glass rounded-xl p-12 text-center">
            <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח</h3>
            <p className="text-muted-foreground">בחר לקוח מהתפריט הצדדי כדי לנהל חיבורים לפלטפורמות פרסום</p>
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
          description="נהל חיבורים לפלטפורמות פרסום לקבלת נתונים בזמן אמת"
          actions={
            <div className="flex gap-2">
              {integrations.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={() => syncAllMutation.mutate()}
                  disabled={syncAllMutation.isPending || connectedCount === 0}
                >
                  {syncAllMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 ml-2" />
                  )}
                  סנכרן הכל
                </Button>
              )}
              <Dialog open={showDialog} onOpenChange={(open) => {
                setShowDialog(open);
                if (!open) {
                  setSelectedPlatform(null);
                  setNewIntegration({ platform: "", external_account_id: "", settings: {} });
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="glow">
                    <Plug className="w-4 h-4 ml-2" />
                    חיבור חדש
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>חיבור פלטפורמה חדשה</DialogTitle>
                    <DialogDescription>
                      בחר פלטפורמה והזן את פרטי החיבור
                    </DialogDescription>
                  </DialogHeader>
                  
                  {!selectedPlatform ? (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {platformOptions.map((platform) => {
                        const isConnected = integrations.some(i => i.platform === platform.id);
                        return (
                          <button
                            key={platform.id}
                            onClick={() => handlePlatformSelect(platform.id)}
                            className={cn(
                              "p-4 rounded-xl border-2 border-border hover:border-primary transition-all text-right",
                              isConnected && "opacity-50"
                            )}
                            disabled={isConnected}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold",
                                platform.color
                              )}>
                                {platform.logo}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{platform.name}</p>
                                {isConnected && (
                                  <Badge variant="secondary" className="text-xs">מחובר</Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{platform.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4 mt-4">
                      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold",
                          selectedPlatform.color
                        )}>
                          {selectedPlatform.logo}
                        </div>
                        <div>
                          <p className="font-medium">{selectedPlatform.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedPlatform.description}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mr-auto"
                          onClick={() => setSelectedPlatform(null)}
                        >
                          שנה
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label>מזהה חשבון</Label>
                          <Input
                            placeholder="Account ID"
                            value={newIntegration.external_account_id}
                            onChange={(e) => setNewIntegration({ 
                              ...newIntegration, 
                              external_account_id: e.target.value 
                            })}
                            className="mt-1"
                          />
                        </div>

                        {selectedPlatform.fields.map((field) => (
                          <div key={field.key}>
                            <Label>{field.label}</Label>
                            <Input
                              placeholder={field.placeholder}
                              value={newIntegration.settings[field.key] || ""}
                              onChange={(e) => setNewIntegration({
                                ...newIntegration,
                                settings: {
                                  ...newIntegration.settings,
                                  [field.key]: e.target.value
                                }
                              })}
                              className="mt-1"
                            />
                          </div>
                        ))}
                      </div>

                      <Button 
                        className="w-full" 
                        onClick={() => createMutation.mutate(newIntegration)}
                        disabled={!newIntegration.external_account_id || createMutation.isPending}
                      >
                        {createMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Plug className="w-4 h-4 ml-2" />
                            התחבר ל-{selectedPlatform.name}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        {/* Stats Bar */}
        {integrations.length > 0 && (
          <div className="glass rounded-xl p-4 mb-6 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Plug className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">סה״כ חיבורים</p>
                <p className="font-bold">{totalCount}</p>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>פעילים</span>
                <span>{connectedCount}/{totalCount}</span>
              </div>
              <Progress value={(connectedCount / totalCount) * 100} className="h-2" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>סנכרון אוטומטי כל 15 דקות</span>
            </div>
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
            {integrations.map((integration, index) => {
              const platform = platformOptions.find(p => p.id === integration.platform);
              const settings = integration.settings as Record<string, any> || {};
              const lastSyncData = settings.last_sync_data;
              
              return (
                <div 
                  key={integration.id}
                  className="glass rounded-xl card-shadow opacity-0 animate-slide-up overflow-hidden"
                  style={{ animationDelay: `${0.1 + index * 0.08}s`, animationFillMode: "forwards" }}
                >
                  <div className={cn("h-2", platform?.color || "bg-muted")} />
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white",
                        platform?.color || "bg-muted"
                      )}>
                        {platform?.logo || "?"}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold">{platform?.name || integration.platform}</h3>
                        {integration.external_account_id && (
                          <p className="text-sm text-muted-foreground">{integration.external_account_id}</p>
                        )}
                      </div>
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        integration.is_connected ? "bg-success animate-pulse" : "bg-destructive"
                      )} />
                    </div>

                    {/* Last sync data preview */}
                    {lastSyncData && (
                      <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
                        {integration.platform === 'shopify' && (
                          <>
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{lastSyncData.orders_count} הזמנות</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">₪{lastSyncData.total_revenue?.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                        {integration.platform === 'google_analytics' && (
                          <>
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{lastSyncData.sessions?.toLocaleString()} sessions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{lastSyncData.bounce_rate}% bounce</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Clock className="w-4 h-4" />
                      {integration.last_sync_at ? (
                        <span>סונכרן: {new Date(integration.last_sync_at).toLocaleString("he-IL")}</span>
                      ) : (
                        <span>טרם סונכרן</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncMutation.mutate(integration.id)}
                        disabled={syncMutation.isPending || !integration.is_connected}
                        className="flex-1"
                      >
                        {syncMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 ml-1" />
                            סנכרן
                          </>
                        )}
                      </Button>
                      <Button
                        variant={integration.is_connected ? "secondary" : "default"}
                        size="sm"
                        onClick={() => toggleConnectionMutation.mutate({ 
                          id: integration.id, 
                          is_connected: !integration.is_connected 
                        })}
                      >
                        {integration.is_connected ? (
                          <>
                            <X className="w-4 h-4 ml-1" />
                            נתק
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 ml-1" />
                            חבר
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('האם למחוק את החיבור?')) {
                            deleteMutation.mutate(integration.id);
                          }
                        }}
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            איך הסנכרון עובד?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Plug className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">1. חבר פלטפורמה</p>
                <p className="text-sm text-muted-foreground">הזן את מזהה החשבון מכל פלטפורמה</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center text-success shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">2. סנכרון אוטומטי</p>
                <p className="text-sm text-muted-foreground">הנתונים מתעדכנים כל 15 דקות</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center text-info shrink-0">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">3. נתונים בדשבורד</p>
                <p className="text-sm text-muted-foreground">צפה בכל הנתונים במקום אחד</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
