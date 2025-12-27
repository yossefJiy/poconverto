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
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const platformOptions = [
  { id: "google_ads", name: "Google Ads", logo: "G", color: "bg-[#4285F4]" },
  { id: "facebook_ads", name: "Facebook Ads", logo: "f", color: "bg-[#1877F2]" },
  { id: "instagram", name: "Instagram", logo: "📷", color: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737]" },
  { id: "google_analytics", name: "Google Analytics", logo: "📊", color: "bg-[#F9AB00]" },
  { id: "linkedin", name: "LinkedIn", logo: "in", color: "bg-[#0A66C2]" },
  { id: "tiktok", name: "TikTok", logo: "♪", color: "bg-[#000000]" },
];

export default function Integrations() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    platform: "",
    external_account_id: "",
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
        is_connected: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("החיבור נוצר בהצלחה");
      setShowDialog(false);
      setNewIntegration({ platform: "", external_account_id: "" });
    },
    onError: () => toast.error("שגיאה ביצירת חיבור"),
  });

  const toggleConnectionMutation = useMutation({
    mutationFn: async ({ id, is_connected }: { id: string; is_connected: boolean }) => {
      const { error } = await supabase
        .from("integrations")
        .update({ is_connected, last_sync_at: is_connected ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("הסטטוס עודכן");
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      // Simulate sync - in real app this would call an edge function
      await new Promise(r => setTimeout(r, 2000));
      const { error } = await supabase
        .from("integrations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("הנתונים סונכרנו בהצלחה");
    },
  });

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
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="glow">
                  <Plug className="w-4 h-4 ml-2" />
                  חיבור חדש
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>חיבור חדש</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Select
                    value={newIntegration.platform}
                    onValueChange={(v) => setNewIntegration({ ...newIntegration, platform: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר פלטפורמה" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformOptions.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          <div className="flex items-center gap-2">
                            <span className={cn("w-6 h-6 rounded flex items-center justify-center text-xs text-white", platform.color)}>
                              {platform.logo}
                            </span>
                            {platform.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="מזהה חשבון (Account ID)"
                    value={newIntegration.external_account_id}
                    onChange={(e) => setNewIntegration({ ...newIntegration, external_account_id: e.target.value })}
                  />
                  <Button 
                    className="w-full" 
                    onClick={() => createMutation.mutate(newIntegration)}
                    disabled={!newIntegration.platform || createMutation.isPending}
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "צור חיבור"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

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

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Clock className="w-4 h-4" />
                      {integration.last_sync_at ? (
                        <span>סונכרן לאחרונה: {new Date(integration.last_sync_at).toLocaleString("he-IL")}</span>
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
                            סנכרן עכשיו
                          </>
                        )}
                      </Button>
                      <Button
                        variant={integration.is_connected ? "destructive" : "default"}
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
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
          <h3 className="font-bold mb-4">איך זה עובד?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <Plug className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">חבר פלטפורמה</p>
                <p className="text-sm text-muted-foreground">הוסף את מזהה החשבון שלך מכל פלטפורמת פרסום</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center text-success shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">סנכרון אוטומטי</p>
                <p className="text-sm text-muted-foreground">הנתונים מתעדכנים אוטומטית כל 15 דקות</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center text-info shrink-0">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">נתונים בזמן אמת</p>
                <p className="text-sm text-muted-foreground">צפה בביצועי הקמפיינים בדשבורד</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
