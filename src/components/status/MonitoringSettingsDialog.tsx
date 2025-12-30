import { useState, useEffect } from "react";
import { Settings2, Bell, BellOff, RefreshCw, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface ServicePreference {
  service_name: string;
  display_name: string;
  notify_on_down: boolean;
  notify_on_recovery: boolean;
  category: "system" | "integration";
}

const ALL_SERVICES = [
  // System services
  { service_name: "send-2fa-code", display_name: "אימות דו-שלבי (Email)", category: "system" as const },
  { service_name: "ai-marketing", display_name: "AI Marketing", category: "system" as const },
  { service_name: "generate-report", display_name: "יצירת דוחות PDF", category: "system" as const },
  { service_name: "send-sms", display_name: "שליחת SMS", category: "system" as const },
  // Integration services
  { service_name: "shopify-api", display_name: "Shopify", category: "integration" as const },
  { service_name: "google-ads", display_name: "Google Ads", category: "integration" as const },
  { service_name: "google-analytics", display_name: "Google Analytics", category: "integration" as const },
  { service_name: "facebook-ads", display_name: "Facebook Ads", category: "integration" as const },
  { service_name: "woocommerce-api", display_name: "WooCommerce", category: "integration" as const },
];

export function MonitoringSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<ServicePreference[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      loadPreferences();
    }
  }, [open, user]);

  const loadPreferences = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: existingPrefs, error } = await supabase
        .from("monitoring_preferences")
        .select("service_name, notify_on_down, notify_on_recovery")
        .eq("user_id", user.id);

      if (error) throw error;

      // Merge with all services - default to enabled
      const mergedPrefs = ALL_SERVICES.map((service) => {
        const existing = existingPrefs?.find((p) => p.service_name === service.service_name);
        return {
          ...service,
          notify_on_down: existing?.notify_on_down ?? true,
          notify_on_recovery: existing?.notify_on_recovery ?? true,
        };
      });

      setPreferences(mergedPrefs);
    } catch (error) {
      console.error("Error loading preferences:", error);
      toast({
        title: "שגיאה בטעינת הגדרות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (serviceName: string, field: "notify_on_down" | "notify_on_recovery") => {
    setPreferences((prev) =>
      prev.map((p) =>
        p.service_name === serviceName ? { ...p, [field]: !p[field] } : p
      )
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Upsert all preferences
      const upsertData = preferences.map((p) => ({
        user_id: user.id,
        service_name: p.service_name,
        notify_on_down: p.notify_on_down,
        notify_on_recovery: p.notify_on_recovery,
      }));

      const { error } = await supabase
        .from("monitoring_preferences")
        .upsert(upsertData, { 
          onConflict: "user_id,service_name",
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: "ההגדרות נשמרו בהצלחה",
      });
      setOpen(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "שגיאה בשמירת ההגדרות",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const systemServices = preferences.filter((p) => p.category === "system");
  const integrationServices = preferences.filter((p) => p.category === "integration");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 ml-2" />
          הגדרות ניטור
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            הגדרות התראות ניטור
          </DialogTitle>
          <DialogDescription>
            בחר אילו שירותים לנטר ולקבל עליהם התראות במייל
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* System Services */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">שירותי מערכת</h4>
              <div className="space-y-3">
                {systemServices.map((service) => (
                  <ServiceToggleRow
                    key={service.service_name}
                    service={service}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>

            <Separator />

            {/* Integration Services */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">אינטגרציות</h4>
              <div className="space-y-3">
                {integrationServices.map((service) => (
                  <ServiceToggleRow
                    key={service.service_name}
                    service={service}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 ml-2" />
            )}
            שמור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ServiceToggleRowProps {
  service: ServicePreference;
  onToggle: (serviceName: string, field: "notify_on_down" | "notify_on_recovery") => void;
}

function ServiceToggleRow({ service, onToggle }: ServiceToggleRowProps) {
  const isAnyEnabled = service.notify_on_down || service.notify_on_recovery;

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-2">
        {isAnyEnabled ? (
          <Bell className="h-4 w-4 text-primary" />
        ) : (
          <BellOff className="h-4 w-4 text-muted-foreground" />
        )}
        <Label className="font-medium cursor-pointer">
          {service.display_name}
        </Label>
      </div>
      <Switch
        checked={service.notify_on_down}
        onCheckedChange={() => onToggle(service.service_name, "notify_on_down")}
      />
    </div>
  );
}
