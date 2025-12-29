import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { usePermissions, useAuth } from "@/hooks/useAuth";
import { ShopifyAnalytics } from "@/components/analytics/ShopifyAnalytics";
import { GoogleAnalyticsCard } from "@/components/analytics/GoogleAnalyticsCard";
import { GoogleAdsCard } from "@/components/analytics/GoogleAdsCard";
import { WooCommerceCard } from "@/components/analytics/WooCommerceCard";
import { GlobalDateFilter, getDateRangeFromFilter, type DateFilterValue } from "@/components/analytics/GlobalDateFilter";
import { IntegrationsDialog } from "@/components/analytics/IntegrationsDialog";
import { ConnectionStatusDialog } from "@/components/analytics/ConnectionStatusDialog";
import { AuthLoadingState } from "@/components/analytics/AuthLoadingState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plug, 
  ArrowRight, 
  AlertCircle,
  Download,
  RefreshCw,
  Loader2,
  Settings,
  Activity,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Note: Scheduled refresh is now handled by backend cron jobs
// Client-side refresh was removed to prevent auth errors from stale sessions

export default function Analytics() {
  const { selectedClient } = useClient();
  const { isAdmin } = usePermissions();
  const { loading: authLoading, session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [globalDateFilter, setGlobalDateFilter] = useState<DateFilterValue>("mtd");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showIntegrationsDialog, setShowIntegrationsDialog] = useState(false);
  const [showConnectionStatusDialog, setShowConnectionStatusDialog] = useState(false);
  const toastIdRef = useRef<string | number | null>(null);
  
  // Open integrations dialog if URL param is set
  useEffect(() => {
    if (searchParams.get('integrations') === 'open') {
      setShowIntegrationsDialog(true);
      // Remove the param from URL
      searchParams.delete('integrations');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  // Get date range based on filter
  const dateRange = getDateRangeFromFilter(globalDateFilter, customDateRange);
  
  // Calculate days for the hook (for backward compatibility)
  const getDaysFromFilter = () => {
    switch (globalDateFilter) {
      case "today": return "1";
      case "yesterday": return "1";
      case "mtd": return "30";
      case "7": return "7";
      case "14": return "14";
      case "30": return "30";
      case "90": return "90";
      case "custom": return "30";
      default: return "30";
    }
  };
  
  const { 
    analyticsData, 
    integrations,
    isLoading,
    isAuthLoading,
    hasSession,
    hasAnalytics,
    refetchAll
  } = useAnalyticsData(selectedClient?.id, getDaysFromFilter());

  // Check which integrations the client has
  const hasShopify = integrations.some(i => i.platform === 'shopify' && i.is_connected);
  const hasGoogleAds = integrations.some(i => i.platform === 'google_ads' && i.is_connected);
  const hasWooCommerce = integrations.some(i => i.platform === 'woocommerce' && i.is_connected);
  const queryClient = useQueryClient();

  const handleRefreshAll = useCallback(async (isScheduled = false) => {
    setIsRefreshing(true);
    
    // Show persistent toast
    const toastMessage = isScheduled 
      ? "מרענן נתונים מכל הפלטפורמות (ריענון מתוזמן)..." 
      : "מרענן נתונים מכל הפלטפורמות...";
    
    toastIdRef.current = toast.loading(toastMessage, {
      position: "bottom-left",
      duration: Infinity,
    });

    try {
      // Trigger backend sync for all integrations of this client
      if (selectedClient?.id) {
        const { error: syncError } = await supabase.functions.invoke('sync-integrations', {
          body: { client_id: selectedClient.id }
        });
        
        if (syncError) {
          console.error('Sync error:', syncError);
        }
      }
      
      // Refresh Shopify analytics
      await queryClient.invalidateQueries({ queryKey: ['shopify-analytics'] });
      // Refresh GA and integrations
      await refetchAll?.();
      
      // Dismiss loading toast and show success
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
      toast.success("כל הנתונים עודכנו ונשמרו בהצלחה", {
        position: "bottom-left",
        duration: 3000,
      });
    } catch (error) {
      // Dismiss loading toast and show error
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
      toast.error("שגיאה בריענון הנתונים", {
        position: "bottom-left",
        duration: 3000,
      });
    } finally {
      setIsRefreshing(false);
      toastIdRef.current = null;
    }
  }, [queryClient, refetchAll, selectedClient?.id]);

  // Note: Client-side scheduled refresh has been removed.
  // Backend cron jobs handle automatic data sync to prevent auth errors from stale sessions.

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader title="אנליטיקס" description="בחר לקוח כדי לצפות בנתונים" />
          <div className="glass rounded-xl p-12 text-center">
            <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח כדי להתחיל</h3>
            <p className="text-muted-foreground mb-4">
              כדי לצפות בנתוני אנליטיקס, יש לבחור לקוח מהתפריט בסרגל הצד
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

  const noIntegrations = integrations.length === 0;
  const dataSources = [];
  
  if (hasShopify) dataSources.push("Shopify");
  if (hasWooCommerce) dataSources.push("WooCommerce");
  if (hasAnalytics) dataSources.push("Google Analytics");
  if (hasGoogleAds) dataSources.push("Google Ads");

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <PageHeader 
              title={`אנליטיקס - ${selectedClient.name}`}
              description="נתוני אתר ואיקומרס"
            />
            {dataSources.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-sm text-muted-foreground">מקורות מידע:</span>
                {dataSources.map((source) => (
                  <Badge 
                    key={source} 
                    variant="outline" 
                    className="bg-primary/10 text-primary border-primary/30"
                  >
                    {source}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <>
                <Button variant="outline" onClick={() => setShowConnectionStatusDialog(true)}>
                  <Activity className="w-4 h-4 ml-2" />
                  סטטוס חיבורים
                </Button>
                <Button variant="outline" onClick={() => setShowIntegrationsDialog(true)}>
                  <Settings className="w-4 h-4 ml-2" />
                  ניהול אינטגרציות
                </Button>
              </>
            )}

            <GlobalDateFilter
              value={globalDateFilter}
              onChange={setGlobalDateFilter}
              customDateRange={customDateRange}
              onCustomDateChange={setCustomDateRange}
            />

            <Button 
              variant="outline" 
              size="icon" 
              disabled={isLoading || isRefreshing} 
              onClick={() => handleRefreshAll(false)}
            >
              {isLoading || isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>

            <Button variant="outline">
              <Download className="w-4 h-4 ml-2" />
              ייצוא
            </Button>
          </div>
        </div>

        {/* No Integrations Warning */}
        {noIntegrations && isAdmin && (
          <Alert className="border-warning/50 bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertTitle>אין חיבורים פעילים</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>חבר את Google Analytics ו-Shopify כדי לראות נתונים אמיתיים</span>
              <Button size="sm" className="mr-4" onClick={() => setShowIntegrationsDialog(true)}>
                <Plug className="w-4 h-4 ml-2" />
                חבר כעת
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Auth Loading State */}
        {isAuthLoading ? (
          <AuthLoadingState />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Shopify Analytics - Only show if Shopify integration is connected */}
            {hasShopify && (
              <ShopifyAnalytics
                // Use date-only strings to avoid timezone shifts when talking to Shopify
                globalDateFrom={dateRange.startDate}
                globalDateTo={dateRange.endDate}
                onRefresh={handleRefreshAll}
                clientProfitMargin={(selectedClient as any).avg_profit_margin || 0}
                clientJiyCommission={(selectedClient as any).jiy_commission_percent || 0}
              />
            )}

            {/* Google Analytics - Second, Collapsible */}
            {hasAnalytics && (
              <GoogleAnalyticsCard
                analyticsData={analyticsData}
                isLoading={isLoading}
                globalDateFrom={dateRange.dateFrom}
                globalDateTo={dateRange.dateTo}
                onRefresh={handleRefreshAll}
              />
            )}

            {/* WooCommerce Analytics - Only show if connected */}
            {hasWooCommerce && (
              <WooCommerceCard
                globalDateFrom={dateRange.dateFrom}
                globalDateTo={dateRange.dateTo}
                clientId={selectedClient?.id}
                isAdmin={isAdmin}
                onAddIntegration={() => setShowIntegrationsDialog(true)}
                onRefresh={handleRefreshAll}
              />
            )}

            {/* Google Ads - Only show if connected */}
            {hasGoogleAds && (
              <GoogleAdsCard
                globalDateFrom={dateRange.dateFrom}
                globalDateTo={dateRange.dateTo}
                clientId={selectedClient?.id}
                isAdmin={isAdmin}
                onAddIntegration={() => setShowIntegrationsDialog(true)}
                onRefresh={handleRefreshAll}
              />
            )}
          </div>
        )}

        {/* Integrations Dialog */}
        <IntegrationsDialog
          open={showIntegrationsDialog}
          onOpenChange={setShowIntegrationsDialog}
        />
        
        {/* Connection Status Dialog */}
        <ConnectionStatusDialog
          open={showConnectionStatusDialog}
          onOpenChange={setShowConnectionStatusDialog}
          clientId={selectedClient?.id}
        />
      </div>
    </MainLayout>
  );
}