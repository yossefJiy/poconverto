import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { usePermissions, useAuth } from "@/hooks/useAuth";
import { GlobalDateFilter, getDateRangeFromFilter, type DateFilterValue } from "@/components/analytics/GlobalDateFilter";
import { GlobalKPIBar } from "@/components/analytics/GlobalKPIBar";
import { PlatformCompactCard } from "@/components/analytics/PlatformCompactCard";
import { AIAnalyticsSummary } from "@/components/ai/AIAnalyticsSummary";
import { IntegrationsDialog } from "@/components/analytics/IntegrationsDialog";
import { ConnectionStatusDialog } from "@/components/analytics/ConnectionStatusDialog";
import { AuthLoadingState } from "@/components/analytics/AuthLoadingState";
import { useShopifyAnalytics } from "@/hooks/useShopifyData";
import { useQuery } from "@tanstack/react-query";
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
  Clock,
  ShoppingCart,
  Store,
  Target,
  DollarSign,
  Eye,
  MousePointer,
  TrendingUp,
  
  BarChart3,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Analytics() {
  const navigate = useNavigate();
  const { selectedClient } = useClient();
  const { isAdmin } = usePermissions();
  const { loading: authLoading, session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [globalDateFilter, setGlobalDateFilter] = useState<DateFilterValue>("mtd");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showIntegrationsDialog, setShowIntegrationsDialog] = useState(false);
  const [showConnectionStatusDialog, setShowConnectionStatusDialog] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const toastIdRef = useRef<string | number | null>(null);
  
  // Open integrations dialog if URL param is set
  useEffect(() => {
    if (searchParams.get('integrations') === 'open') {
      setShowIntegrationsDialog(true);
      searchParams.delete('integrations');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  const dateRange = getDateRangeFromFilter(globalDateFilter, customDateRange);
  
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

  const hasShopify = integrations.some(i => i.platform === 'shopify' && i.is_connected);
  const hasGoogleAds = integrations.some(i => i.platform === 'google_ads' && i.is_connected);
  const hasFacebookAds = integrations.some(i => i.platform === 'facebook_ads' && i.is_connected);
  const hasWooCommerce = integrations.some(i => i.platform === 'woocommerce' && i.is_connected);
  const hasGoogleAnalytics = integrations.some(i => i.platform === 'google_analytics' && i.is_connected);
  const queryClient = useQueryClient();


  // Fetch platform data
  const { data: shopifyData } = useShopifyAnalytics(dateRange.startDate, dateRange.endDate);
  
  const { data: googleAdsData } = useQuery({
    queryKey: ["google-ads-kpi", selectedClient?.id, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('google-ads', {
        body: { startDate: dateRange.startDate, endDate: dateRange.endDate, clientId: selectedClient?.id }
      });
      return data;
    },
    enabled: !!selectedClient?.id && hasGoogleAds,
    staleTime: 5 * 60 * 1000,
  });

  const { data: facebookAdsData } = useQuery({
    queryKey: ["facebook-ads-kpi", selectedClient?.id, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('facebook-ads', {
        body: { clientId: selectedClient?.id, startDate: dateRange.startDate, endDate: dateRange.endDate }
      });
      return data;
    },
    enabled: !!selectedClient?.id && hasFacebookAds,
    staleTime: 5 * 60 * 1000,
  });

  // WooCommerce data
  const { data: wooCommerceData } = useQuery({
    queryKey: ["woocommerce-kpi", selectedClient?.id, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('woocommerce-api', {
        body: { action: 'getAnalytics', clientId: selectedClient?.id, startDate: dateRange.startDate, endDate: dateRange.endDate }
      });
      return data;
    },
    enabled: !!selectedClient?.id && hasWooCommerce,
    staleTime: 5 * 60 * 1000,
  });

  // Google Analytics data
  const { data: googleAnalyticsData } = useQuery({
    queryKey: ["google-analytics-kpi", selectedClient?.id, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('google-analytics', {
        body: { clientId: selectedClient?.id, startDate: dateRange.startDate, endDate: dateRange.endDate }
      });
      return data;
    },
    enabled: !!selectedClient?.id && hasGoogleAnalytics,
    staleTime: 5 * 60 * 1000,
  });

  // Aggregate data for Global KPI Bar
  const platformData = useMemo(() => ({
    shopify: {
      totalRevenue: shopifyData?.summary?.totalRevenue || 0,
      totalOrders: shopifyData?.summary?.totalOrders || 0,
    },
    googleAds: {
      totalCost: googleAdsData?.account?.totalCost || 0,
      totalConversions: googleAdsData?.account?.totalConversions || 0,
      totalClicks: googleAdsData?.account?.totalClicks || 0,
      totalImpressions: googleAdsData?.account?.totalImpressions || 0,
    },
    facebookAds: {
      cost: facebookAdsData?.totals?.cost || 0,
      conversions: facebookAdsData?.totals?.conversions || 0,
      clicks: facebookAdsData?.totals?.clicks || 0,
      impressions: facebookAdsData?.totals?.impressions || 0,
    },
  }), [shopifyData, googleAdsData, facebookAdsData]);

  const handleRefreshAll = useCallback(async () => {
    setIsRefreshing(true);
    toastIdRef.current = toast.loading("מרענן נתונים מכל הפלטפורמות...", {
      position: "bottom-left",
      duration: Infinity,
    });

    try {
      if (selectedClient?.id) {
        await supabase.functions.invoke('sync-integrations', {
          body: { client_id: selectedClient.id }
        });
      }
      
      await queryClient.invalidateQueries({ queryKey: ['shopify-analytics'] });
      await queryClient.invalidateQueries({ queryKey: ['google-ads-kpi'] });
      await queryClient.invalidateQueries({ queryKey: ['facebook-ads-kpi'] });
      await refetchAll?.();
      
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
      setLastRefreshedAt(new Date());
      toast.success("כל הנתונים עודכנו בהצלחה", { position: "bottom-left", duration: 3000 });
    } catch (error) {
      if (toastIdRef.current) toast.dismiss(toastIdRef.current);
      toast.error("שגיאה בריענון הנתונים", { position: "bottom-left", duration: 3000 });
    } finally {
      setIsRefreshing(false);
      toastIdRef.current = null;
    }
  }, [queryClient, refetchAll, selectedClient?.id]);


  const formatLastRefreshed = (date: Date | null): string => {
    if (!date) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "עכשיו";
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    return `לפני ${Math.floor(diffHours / 24)} ימים`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString("he-IL");
  };

  const formatCurrency = (num: number): string => "₪" + formatNumber(num);

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
  const dataSources: string[] = [];
  if (hasShopify) dataSources.push("Shopify");
  if (hasWooCommerce) dataSources.push("WooCommerce");
  if (hasGoogleAnalytics) dataSources.push("Google Analytics");
  if (hasGoogleAds) dataSources.push("Google Ads");
  if (hasFacebookAds) dataSources.push("Facebook Ads");

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Right side: Integrations, Status */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowIntegrationsDialog(true)}>
                  <Settings className="w-4 h-4 ml-1" />
                  אינטגרציות
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowConnectionStatusDialog(true)}>
                  <Activity className="w-4 h-4 ml-1" />
                  סטטוס
                </Button>
              </>
            )}
          </div>
          
          {/* Left side: Date, Refresh, Export */}
          <div className="flex items-center gap-2">
            <GlobalDateFilter
              value={globalDateFilter}
              onChange={setGlobalDateFilter}
              customDateRange={customDateRange}
              onCustomDateChange={setCustomDateRange}
            />

            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              disabled={isLoading || isRefreshing} 
              onClick={handleRefreshAll}
              title="רענן את כל הנתונים"
            >
              {isLoading || isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>

            <Button variant="ghost" size="icon" className="h-8 w-8" title="ייצוא">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Page Header */}
        <PageHeader 
          title="אנליטיקס"
          description="סקירה כללית של כל הפלטפורמות"
        />

        {/* No Integrations Warning */}
        {noIntegrations && isAdmin && (
          <Alert className="border-warning/50 bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertTitle>אין חיבורים פעילים</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>חבר פלטפורמות כדי לראות נתונים אמיתיים</span>
              <Button size="sm" className="mr-4" onClick={() => setShowIntegrationsDialog(true)}>
                <Plug className="w-4 h-4 ml-2" />
                חבר כעת
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Content */}
        {isAuthLoading ? (
          <AuthLoadingState />
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* AI Analytics Summary */}
            <AIAnalyticsSummary 
              platformData={platformData} 
              clientName={selectedClient?.name}
              dateRange={{ start: dateRange.startDate, end: dateRange.endDate }}
            />

            {/* Global KPI Summary Bar */}
            {(hasShopify || hasGoogleAds || hasFacebookAds) && (
              <GlobalKPIBar platformData={platformData} isLoading={isLoading} />
            )}

            {/* Platform Cards - Compact Row Style */}
            <div className="space-y-3">
              {/* Google Analytics */}
              {hasGoogleAnalytics && (
              <PlatformCompactCard
                  platform="Google Analytics"
                  platformKey="google_analytics"
                  icon={<BarChart3 className="w-5 h-5 text-white" />}
                  iconBgColor="bg-[#E37400]"
                  detailPath="/analytics/google-analytics"
                  isLoading={!googleAnalyticsData}
                  isConnected={true}
                  metrics={(() => {
                    // Parse GA data from API response
                    const dailyRow = googleAnalyticsData?.dailyMetrics?.rows?.[0]?.metricValues;
                    const sessions = parseInt(dailyRow?.[1]?.value || "0");
                    const users = parseInt(dailyRow?.[0]?.value || "0");
                    const pageviews = parseInt(dailyRow?.[2]?.value || "0");
                    const bounceRate = parseFloat(dailyRow?.[4]?.value || "0") * 100;
                    
                    return [
                      { 
                        label: "סשנים", 
                        value: formatNumber(sessions),
                        icon: <BarChart3 className="w-4 h-4" />,
                      },
                      { 
                        label: "משתמשים", 
                        value: formatNumber(users),
                        icon: <Users className="w-4 h-4" />,
                      },
                      { 
                        label: "צפיות", 
                        value: formatNumber(pageviews),
                        icon: <Eye className="w-4 h-4" />,
                      },
                      { 
                        label: "נטישה", 
                        value: `${bounceRate.toFixed(1)}%`,
                      },
                    ];
                  })()}
                />
              )}

              {/* Shopify */}
              {hasShopify && (
                <PlatformCompactCard
                  platform="Shopify"
                  platformKey="shopify"
                  icon={<Store className="w-5 h-5 text-white" />}
                  iconBgColor="bg-[#96BF48]"
                  detailPath="/analytics/shopify"
                  isLoading={!shopifyData}
                  isConnected={true}
                  metrics={[
                    { 
                      label: "הכנסות", 
                      value: formatCurrency(shopifyData?.summary?.totalRevenue || 0),
                      icon: <DollarSign className="w-4 h-4" />,
                      change: 12.5
                    },
                    { 
                      label: "הזמנות", 
                      value: formatNumber(shopifyData?.summary?.totalOrders || 0),
                      icon: <ShoppingCart className="w-4 h-4" />,
                      change: 8.2
                    },
                    { 
                      label: "AOV", 
                      value: formatCurrency(shopifyData?.summary?.avgOrderValue || 0),
                      icon: <TrendingUp className="w-4 h-4" />,
                    },
                    { 
                      label: "מוצרים", 
                      value: formatNumber(shopifyData?.products?.length || 0),
                    },
                  ]}
                />
              )}

              {/* Google Ads */}
              {hasGoogleAds && (
                <PlatformCompactCard
                  platform="Google Ads"
                  platformKey="google_ads"
                  icon={<Target className="w-5 h-5 text-white" />}
                  iconBgColor="bg-[#4285F4]"
                  detailPath="/analytics/google-ads"
                  isLoading={!googleAdsData}
                  isConnected={true}
                  metrics={[
                    { 
                      label: "הוצאות", 
                      value: formatCurrency(googleAdsData?.account?.totalCost || 0),
                      icon: <DollarSign className="w-4 h-4" />,
                      change: -5.2
                    },
                    { 
                      label: "קליקים", 
                      value: formatNumber(googleAdsData?.account?.totalClicks || 0),
                      icon: <MousePointer className="w-4 h-4" />,
                      change: 15.3
                    },
                    { 
                      label: "חשיפות", 
                      value: formatNumber(googleAdsData?.account?.totalImpressions || 0),
                      icon: <Eye className="w-4 h-4" />,
                    },
                    { 
                      label: "המרות", 
                      value: formatNumber(googleAdsData?.account?.totalConversions || 0),
                      icon: <TrendingUp className="w-4 h-4" />,
                      change: 22.1
                    },
                  ]}
                />
              )}

              {/* Facebook Ads */}
              {hasFacebookAds && (
                <PlatformCompactCard
                  platform="Facebook Ads"
                  platformKey="facebook_ads"
                  icon={<span className="text-white text-lg font-bold">f</span>}
                  iconBgColor="bg-[#1877F2]"
                  detailPath="/analytics/facebook-ads"
                  isLoading={!facebookAdsData}
                  isConnected={true}
                  metrics={[
                    { 
                      label: "הוצאות", 
                      value: formatCurrency(facebookAdsData?.totals?.cost || 0),
                      icon: <DollarSign className="w-4 h-4" />,
                      change: -3.1
                    },
                    { 
                      label: "קליקים", 
                      value: formatNumber(facebookAdsData?.totals?.clicks || 0),
                      icon: <MousePointer className="w-4 h-4" />,
                      change: 18.7
                    },
                    { 
                      label: "חשיפות", 
                      value: formatNumber(facebookAdsData?.totals?.impressions || 0),
                      icon: <Eye className="w-4 h-4" />,
                    },
                    { 
                      label: "המרות", 
                      value: formatNumber(facebookAdsData?.totals?.conversions || 0),
                      icon: <TrendingUp className="w-4 h-4" />,
                      change: 11.4
                    },
                  ]}
                />
              )}

              {/* WooCommerce */}
              {hasWooCommerce && (
                <PlatformCompactCard
                  platform="WooCommerce"
                  platformKey="woocommerce"
                  icon={<ShoppingCart className="w-5 h-5 text-white" />}
                  iconBgColor="bg-[#96588A]"
                  detailPath="/analytics/woocommerce"
                  isLoading={!wooCommerceData}
                  isConnected={true}
                  metrics={[
                    { 
                      label: "הכנסות", 
                      value: formatCurrency(wooCommerceData?.summary?.totalRevenue || 0),
                      icon: <DollarSign className="w-4 h-4" />,
                    },
                    { 
                      label: "הזמנות", 
                      value: formatNumber(wooCommerceData?.summary?.totalOrders || 0),
                      icon: <ShoppingCart className="w-4 h-4" />,
                    },
                    { 
                      label: "AOV", 
                      value: formatCurrency(wooCommerceData?.summary?.avgOrderValue || 0),
                      icon: <TrendingUp className="w-4 h-4" />,
                    },
                    { 
                      label: "לקוחות", 
                      value: formatNumber(wooCommerceData?.summary?.uniqueCustomers || 0),
                      icon: <Users className="w-4 h-4" />,
                    },
                  ]}
                />
              )}
            </div>
          </div>
        )}

        {/* Dialogs */}
        <IntegrationsDialog
          open={showIntegrationsDialog}
          onOpenChange={setShowIntegrationsDialog}
        />
        
        <ConnectionStatusDialog
          open={showConnectionStatusDialog}
          onOpenChange={setShowConnectionStatusDialog}
          clientId={selectedClient?.id}
        />
      </div>
    </MainLayout>
  );
}
