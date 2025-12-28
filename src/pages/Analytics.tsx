import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { ShopifyAnalytics } from "@/components/analytics/ShopifyAnalytics";
import { GoogleAnalyticsCard } from "@/components/analytics/GoogleAnalyticsCard";
import { GlobalDateFilter, getDateRangeFromFilter, type DateFilterValue } from "@/components/analytics/GlobalDateFilter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plug, 
  ArrowRight, 
  AlertCircle,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Analytics() {
  const { selectedClient } = useClient();
  const [globalDateFilter, setGlobalDateFilter] = useState<DateFilterValue>("mtd");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>();
  
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
    hasAnalytics,
    refetchAll
  } = useAnalyticsData(selectedClient?.id, getDaysFromFilter());

  // Check if client has Shopify integration
  const hasShopify = integrations.some(i => i.platform === 'shopify' && i.is_connected);

  const handleRefreshAll = () => {
    refetchAll?.();
  };

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
  
  if (hasShopify || selectedClient.is_ecommerce) dataSources.push("Shopify");
  if (hasAnalytics) dataSources.push("Google Analytics");

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
            <GlobalDateFilter
              value={globalDateFilter}
              onChange={setGlobalDateFilter}
              customDateRange={customDateRange}
              onCustomDateChange={setCustomDateRange}
            />

            <Button 
              variant="outline" 
              size="icon" 
              disabled={isLoading} 
              onClick={handleRefreshAll}
            >
              {isLoading ? (
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
        {noIntegrations && !selectedClient.is_ecommerce && (
          <Alert className="border-warning/50 bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertTitle>אין חיבורים פעילים</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>חבר את Google Analytics ו-Shopify כדי לראות נתונים אמיתיים</span>
              <Button asChild size="sm" className="mr-4">
                <Link to="/integrations">
                  <Plug className="w-4 h-4 ml-2" />
                  חבר כעת
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Shopify Analytics - First */}
            {(hasShopify || selectedClient.is_ecommerce) && (
              <ShopifyAnalytics
                globalDateFrom={dateRange.dateFrom}
                globalDateTo={dateRange.dateTo}
                onRefresh={refetchAll}
              />
            )}

            {/* Google Analytics - Second, Collapsible */}
            {hasAnalytics && (
              <GoogleAnalyticsCard
                analyticsData={analyticsData}
                isLoading={isLoading}
                globalDateFrom={dateRange.dateFrom}
                globalDateTo={dateRange.dateTo}
              />
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}