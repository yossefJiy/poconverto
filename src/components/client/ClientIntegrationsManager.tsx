import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Plus, Check, X, Loader2, RefreshCw, Plug, Trash2, Edit2, Eye, EyeOff } from "lucide-react";

const PLATFORM_OPTIONS = [
  { value: "meta_ads", label: "Meta Ads", icon: "📘" },
  { value: "google_ads", label: "Google Ads", icon: "📊" },
  { value: "tiktok_ads", label: "TikTok Ads", icon: "🎵" },
  { value: "shopify", label: "Shopify", icon: "🛒" },
  { value: "woocommerce", label: "WooCommerce", icon: "🏪" },
  { value: "ga4", label: "Google Analytics 4", icon: "📈" },
  { value: "google_shopping", label: "Google Shopping", icon: "🛍️" },
  { value: "gsc", label: "Google Search Console", icon: "🔍" },
  { value: "icount", label: "iCount (חשבוניות)", icon: "🧾" },
];

const PLATFORM_FIELDS: Record<string, { label: string; placeholder: string; field: string }[]> = {
  meta_ads: [
    { label: "Ad Account ID", placeholder: "act_123456789", field: "external_account_id" },
    { label: "Access Token", placeholder: "EAAxxxxxxx...", field: "access_token" },
  ],
  google_ads: [
    { label: "Customer ID", placeholder: "123-456-7890", field: "external_account_id" },
    { label: "Refresh Token", placeholder: "1//0xxxxx...", field: "refresh_token" },
    { label: "Developer Token", placeholder: "xxxxxxxxxxxx", field: "developer_token" },
    { label: "Client ID", placeholder: "xxxxx.apps.googleusercontent.com", field: "client_id" },
    { label: "Client Secret", placeholder: "GOCSPX-xxxxx", field: "client_secret" },
  ],
  tiktok_ads: [
    { label: "Advertiser ID", placeholder: "123456789", field: "external_account_id" },
    { label: "Access Token", placeholder: "xxxxx...", field: "access_token" },
  ],
  shopify: [
    { label: "Store Domain", placeholder: "my-store.myshopify.com", field: "external_account_id" },
    { label: "Access Token", placeholder: "shpat_xxxxx...", field: "access_token" },
  ],
  woocommerce: [
    { label: "Site URL", placeholder: "https://mysite.com", field: "external_account_id" },
    { label: "Consumer Key", placeholder: "ck_xxxxx...", field: "consumer_key" },
    { label: "Consumer Secret", placeholder: "cs_xxxxx...", field: "consumer_secret" },
  ],
  ga4: [
    { label: "Property ID", placeholder: "properties/123456789", field: "external_account_id" },
    { label: "Service Account JSON (key)", placeholder: '{"type":"service_account",...}', field: "service_account_key" },
  ],
  google_shopping: [
    { label: "Merchant ID", placeholder: "123456789", field: "external_account_id" },
  ],
  gsc: [
    { label: "Site URL", placeholder: "https://mysite.com", field: "external_account_id" },
  ],
  icount: [
    { label: "Company ID", placeholder: "my_company", field: "external_account_id" },
    { label: "API Token", placeholder: "xxxxx...", field: "api_token" },
  ],
};

interface IntegrationFormData {
  platform: string;
  external_account_id: string;
  credentials: Record<string, string>;
}

export function ClientIntegrationsManager() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<IntegrationFormData>({
    platform: "",
    external_account_id: "",
    credentials: {},
  });

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["client-integrations-full", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("client_id", selectedClient.id)
        .order("platform");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient || !formData.platform) throw new Error("Missing data");

      const credFields = PLATFORM_FIELDS[formData.platform]?.filter(f => f.field !== "external_account_id") || [];
      const credentials: Record<string, string> = {};
      for (const f of credFields) {
        if (formData.credentials[f.field]) {
          credentials[f.field] = formData.credentials[f.field];
        }
      }

      // Encrypt credentials if any exist
      let encrypted_credentials = null;
      if (Object.keys(credentials).length > 0) {
        const { data: encData, error: encError } = await supabase.rpc("encrypt_integration_credentials", {
          credentials: credentials as any,
        });
        if (encError) throw encError;
        encrypted_credentials = encData;
      }

      const { error } = await supabase.from("integrations").insert({
        client_id: selectedClient.id,
        platform: formData.platform,
        external_account_id: formData.external_account_id || null,
        encrypted_credentials,
        is_connected: !!encrypted_credentials,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-integrations-full"] });
      queryClient.invalidateQueries({ queryKey: ["client-integrations"] });
      queryClient.invalidateQueries({ queryKey: ["client-profile-stats"] });
      toast.success("אינטגרציה נוספה בהצלחה");
      setShowAdd(false);
      resetForm();
    },
    onError: (e) => toast.error("שגיאה: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("integrations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-integrations-full"] });
      queryClient.invalidateQueries({ queryKey: ["client-integrations"] });
      toast.success("אינטגרציה הוסרה");
    },
    onError: () => toast.error("שגיאה בהסרת האינטגרציה"),
  });

  const syncMutation = useMutation({
    mutationFn: async (integration: any) => {
      if (!selectedClient) throw new Error("No client");
      const { error } = await supabase.functions.invoke("sync-daily", {
        body: {
          client_id: selectedClient.id,
          platforms: [integration.platform],
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("סנכרון הופעל בהצלחה");
      queryClient.invalidateQueries({ queryKey: ["client-integrations-full"] });
    },
    onError: () => toast.error("שגיאה בסנכרון"),
  });

  const resetForm = () => {
    setFormData({ platform: "", external_account_id: "", credentials: {} });
  };

  const getPlatformLabel = (platform: string) => {
    return PLATFORM_OPTIONS.find(p => p.value === platform)?.label || platform;
  };

  const getPlatformIcon = (platform: string) => {
    return PLATFORM_OPTIONS.find(p => p.value === platform)?.icon || "🔌";
  };

  if (!selectedClient) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Plug className="w-5 h-5 text-primary" />
            אינטגרציות
          </span>
          <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 ml-1" />
                הוסף חיבור
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>חיבור אינטגרציה חדשה</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">פלטפורמה</label>
                  <Select value={formData.platform} onValueChange={(v) => setFormData(prev => ({ ...prev, platform: v, credentials: {} }))}>
                    <SelectTrigger><SelectValue placeholder="בחר פלטפורמה" /></SelectTrigger>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          <span className="flex items-center gap-2">{p.icon} {p.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.platform && PLATFORM_FIELDS[formData.platform]?.map(field => (
                  <div key={field.field}>
                    <label className="text-sm font-medium mb-1.5 block">{field.label}</label>
                    <Input
                      value={field.field === "external_account_id" ? formData.external_account_id : (formData.credentials[field.field] || "")}
                      onChange={(e) => {
                        if (field.field === "external_account_id") {
                          setFormData(prev => ({ ...prev, external_account_id: e.target.value }));
                        } else {
                          setFormData(prev => ({ ...prev, credentials: { ...prev.credentials, [field.field]: e.target.value } }));
                        }
                      }}
                      placeholder={field.placeholder}
                      dir="ltr"
                      type={field.field.includes("token") || field.field.includes("secret") || field.field.includes("key") ? "password" : "text"}
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">ביטול</Button>
                </DialogClose>
                <Button onClick={() => addMutation.mutate()} disabled={!formData.platform || addMutation.isPending}>
                  {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "שמור"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>ניהול חיבורים למערכות פרסום, חנויות ואנליטיקה</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : integrations.length === 0 ? (
          <div className="text-center py-8">
            <Plug className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">אין אינטגרציות מחוברות</p>
            <p className="text-sm text-muted-foreground">הוסף חיבור למערכות הפרסום, חנות או אנליטיקה</p>
          </div>
        ) : (
          <div className="space-y-3">
            {integrations.map(integration => (
              <div
                key={integration.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-all",
                  integration.is_connected
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-muted/30 border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getPlatformIcon(integration.platform)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getPlatformLabel(integration.platform)}</span>
                      <Badge variant={integration.is_connected ? "default" : "secondary"} className="text-xs">
                        {integration.is_connected ? "מחובר" : "לא מחובר"}
                      </Badge>
                    </div>
                    {integration.external_account_id && (
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono" dir="ltr">
                        {integration.external_account_id}
                      </p>
                    )}
                    {integration.last_sync_at && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        סנכרון אחרון: {new Date(integration.last_sync_at).toLocaleDateString("he-IL")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => syncMutation.mutate(integration)}
                    disabled={syncMutation.isPending || !integration.is_connected}
                    title="סנכרן עכשיו"
                  >
                    <RefreshCw className={cn("w-4 h-4", syncMutation.isPending && "animate-spin")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("בטוח להסיר את האינטגרציה?")) {
                        deleteMutation.mutate(integration.id);
                      }
                    }}
                    title="הסר"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
