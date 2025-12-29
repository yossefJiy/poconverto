import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  AlertTriangle,
  ShoppingCart,
  BarChart3,
  Target,
  Store,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ConnectionStatus {
  platform: string;
  name: string;
  icon: React.ReactNode;
  status: "checking" | "connected" | "error" | "not_configured";
  message?: string;
  lastSync?: string;
}

interface ConnectionStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
}

const platformConfig: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  shopify: { 
    name: "Shopify", 
    icon: <ShoppingCart className="w-4 h-4" />,
    color: "text-purple-500"
  },
  google_analytics: { 
    name: "Google Analytics", 
    icon: <BarChart3 className="w-4 h-4" />,
    color: "text-blue-500"
  },
  google_ads: { 
    name: "Google Ads", 
    icon: <Target className="w-4 h-4" />,
    color: "text-orange-500"
  },
  woocommerce: { 
    name: "WooCommerce", 
    icon: <Store className="w-4 h-4" />,
    color: "text-[#96588A]"
  },
};

export function ConnectionStatusDialog({ 
  open, 
  onOpenChange, 
  clientId 
}: ConnectionStatusDialogProps) {
  const { session, loading: authLoading } = useAuth();
  const [statuses, setStatuses] = useState<ConnectionStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnections = async () => {
    if (!clientId || !session) return;
    
    setIsChecking(true);
    
    // Initialize all platforms as checking
    const initialStatuses: ConnectionStatus[] = Object.entries(platformConfig).map(([platform, config]) => ({
      platform,
      name: config.name,
      icon: config.icon,
      status: "checking" as const,
    }));
    setStatuses(initialStatuses);

    // Fetch integrations for this client
    const { data: integrations, error: integrationsError } = await supabase
      .from("integrations")
      .select("*")
      .eq("client_id", clientId);

    if (integrationsError) {
      setStatuses(prev => prev.map(s => ({
        ...s,
        status: "error" as const,
        message: "שגיאה בטעינת אינטגרציות"
      })));
      setIsChecking(false);
      return;
    }

    // Check each platform
    const updatedStatuses: ConnectionStatus[] = [];

    for (const [platform, config] of Object.entries(platformConfig)) {
      const integration = integrations?.find(i => i.platform === platform);
      
      if (!integration || !integration.is_connected) {
        updatedStatuses.push({
          platform,
          name: config.name,
          icon: config.icon,
          status: "not_configured",
          message: "לא מוגדר",
        });
        continue;
      }

      // Test the actual connection
      try {
        let testResult: { success: boolean; message?: string } = { success: false };
        
        if (platform === "shopify") {
          const { data, error } = await supabase.functions.invoke("shopify-api", {
            body: { action: "test_connection" }
          });
          testResult = { 
            success: !error && data?.success !== false,
            message: error?.message || data?.error
          };
        } else if (platform === "google_analytics") {
          // GA doesn't have test endpoint, we check settings
          const settings = integration.settings as any;
          testResult = { 
            success: !!settings?.property_id,
            message: settings?.property_id ? undefined : "חסר Property ID"
          };
        } else if (platform === "google_ads") {
          const { data, error } = await supabase.functions.invoke("google-ads", {
            body: { clientId, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }
          });
          testResult = { 
            success: !error && !data?.error,
            message: error?.message || data?.error
          };
        } else if (platform === "woocommerce") {
          const { data, error } = await supabase.functions.invoke("woocommerce-api", {
            body: { action: "test_connection", client_id: clientId }
          });
          testResult = { 
            success: !error && data?.success,
            message: error?.message || data?.error
          };
        }

        // Parse error messages
        let errorMessage = testResult.message;
        if (errorMessage) {
          if (errorMessage.includes("401") || errorMessage.includes("Unauthorized") || errorMessage.includes("Auth session missing")) {
            errorMessage = "טוקן לא תקין או פג תוקף";
          } else if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
            errorMessage = "אין הרשאות מתאימות";
          } else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
            errorMessage = "המשאב לא נמצא";
          } else if (errorMessage.includes("credentials") || errorMessage.includes("חסר")) {
            errorMessage = "חסרים פרטי התחברות";
          }
        }

        updatedStatuses.push({
          platform,
          name: config.name,
          icon: config.icon,
          status: testResult.success ? "connected" : "error",
          message: testResult.success ? undefined : errorMessage || "שגיאת חיבור",
          lastSync: integration.last_sync_at ? new Date(integration.last_sync_at).toLocaleString("he-IL") : undefined,
        });
      } catch (err) {
        updatedStatuses.push({
          platform,
          name: config.name,
          icon: config.icon,
          status: "error",
          message: err instanceof Error ? err.message : "שגיאה לא ידועה",
        });
      }
    }

    setStatuses(updatedStatuses);
    setIsChecking(false);
  };

  useEffect(() => {
    if (open && clientId && session && !authLoading) {
      checkConnections();
    }
  }, [open, clientId, session, authLoading]);

  const getStatusBadge = (status: ConnectionStatus["status"]) => {
    switch (status) {
      case "checking":
        return (
          <Badge variant="outline" className="bg-muted">
            <Loader2 className="w-3 h-3 ml-1 animate-spin" />
            בודק...
          </Badge>
        );
      case "connected":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle2 className="w-3 h-3 ml-1" />
            מחובר
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <XCircle className="w-3 h-3 ml-1" />
            שגיאה
          </Badge>
        );
      case "not_configured":
        return (
          <Badge variant="outline" className="bg-muted">
            <Plug className="w-3 h-3 ml-1" />
            לא מוגדר
          </Badge>
        );
    }
  };

  // Show waiting for auth state
  if (authLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plug className="w-5 h-5" />
              סטטוס חיבורים
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary ml-2" />
            <span className="text-muted-foreground">ממתין להתחברות...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Plug className="w-5 h-5" />
              סטטוס חיבורים
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkConnections}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {statuses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {!clientId ? (
                <p>בחר לקוח כדי לבדוק חיבורים</p>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>טוען...</span>
                </div>
              )}
            </div>
          ) : (
            statuses.map((status) => (
              <div 
                key={status.platform}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  status.status === "connected" && "bg-green-500/5 border-green-500/20",
                  status.status === "error" && "bg-destructive/5 border-destructive/20",
                  status.status === "not_configured" && "bg-muted/50 border-border",
                  status.status === "checking" && "bg-muted/30 border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    platformConfig[status.platform]?.color || "text-muted-foreground",
                    status.status === "connected" ? "bg-green-500/20" : "bg-muted"
                  )}>
                    {status.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{status.name}</p>
                    {status.message && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {status.status === "error" && <AlertTriangle className="w-3 h-3 text-destructive" />}
                        {status.message}
                      </p>
                    )}
                    {status.lastSync && status.status === "connected" && (
                      <p className="text-xs text-muted-foreground">
                        סנכרון אחרון: {status.lastSync}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(status.status)}
              </div>
            ))
          )}
        </div>

        {statuses.some(s => s.status === "error") && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-sm text-yellow-600 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                יש חיבורים עם שגיאות. בדוק את פרטי ההתחברות או פנה למנהל המערכת.
              </span>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
