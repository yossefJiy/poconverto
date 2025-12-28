import { useState, useMemo } from "react";
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Package,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
  Calendar,
  Eye,
  Percent,
  Globe,
  ChevronDown,
  ChevronUp,
  MousePointer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useShopifyAnalytics } from "@/hooks/useShopifyData";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ShopifyAnalyticsProps {
  globalDateFrom: string;
  globalDateTo: string;
  onRefresh?: () => void;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

function formatCurrency(num: number): string {
  return "₪" + formatNumber(num);
}

export function ShopifyAnalytics({ 
  globalDateFrom,
  globalDateTo,
  onRefresh,
}: ShopifyAnalyticsProps) {
  const [useLocalFilter, setUseLocalFilter] = useState(false);
  const [localDateFilter, setLocalDateFilter] = useState("mtd");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Calculate local date range if using local filter
  const { dateFrom, dateTo } = useMemo(() => {
    if (!useLocalFilter) {
      return { dateFrom: globalDateFrom, dateTo: globalDateTo };
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start: Date;
    const end = today;
    
    switch (localDateFilter) {
      case "mtd":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "ytd":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "y1":
      case "y2":
      case "y3": {
        const yearsBack = parseInt(localDateFilter.replace('y', ''));
        start = new Date(now.getFullYear() - yearsBack, now.getMonth(), 1);
        break;
      }
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    return {
      dateFrom: start.toISOString(),
      dateTo: end.toISOString(),
    };
  }, [useLocalFilter, localDateFilter, globalDateFrom, globalDateTo]);
  
  const { 
    data: analyticsData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useShopifyAnalytics(dateFrom, dateTo);

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  const handleLocalFilterChange = (value: string) => {
    setLocalDateFilter(value);
    setUseLocalFilter(true);
  };

  const handleResetToGlobal = () => {
    setUseLocalFilter(false);
  };

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>שגיאה בטעינת נתוני Shopify</AlertTitle>
        <AlertDescription>
          {error?.message || 'לא ניתן לטעון נתונים'}
          <Button variant="outline" size="sm" className="mr-4" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 ml-2" />
            נסה שוב
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const summary = analyticsData?.summary || {
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    totalItemsSold: 0,
    uniqueCustomers: 0,
    estimatedSessions: 0,
    conversionRate: '0',
  };

  const orderStatus = analyticsData?.orderStatus || {
    paid: 0,
    fulfilled: 0,
    pending: 0,
    refunded: 0,
  };

  const trafficSources = analyticsData?.trafficSources || [];
  const topProducts = analyticsData?.topProducts || [];

  // Calculate CTR (mock - would come from real data)
  const ctr = summary.estimatedSessions > 0 
    ? ((summary.totalOrders / summary.estimatedSessions) * 100).toFixed(2) 
    : "0";

  // Main dashboard metrics - always visible
  const mainMetrics = [
    {
      label: "סה״כ מכירות",
      value: formatCurrency(summary.totalRevenue),
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-green-500/20 text-green-500",
    },
    {
      label: "הזמנות",
      value: formatNumber(summary.totalOrders),
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "bg-purple-500/20 text-purple-500",
    },
    {
      label: "CTR",
      value: ctr + "%",
      icon: <MousePointer className="w-5 h-5" />,
      color: "bg-blue-500/20 text-blue-500",
    },
    {
      label: "סשנים",
      value: formatNumber(summary.estimatedSessions),
      icon: <Eye className="w-5 h-5" />,
      color: "bg-cyan-500/20 text-cyan-500",
    },
    {
      label: "פריטים שנמכרו",
      value: formatNumber(summary.totalItemsSold),
      icon: <Package className="w-5 h-5" />,
      color: "bg-orange-500/20 text-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Analytics Card */}
      <div className="glass rounded-xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg">נתוני Shopify</h3>
              <p className="text-sm text-muted-foreground">
                {useLocalFilter ? "סינון מותאם" : "לפי סינון גלובלי"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {useLocalFilter && (
              <Button variant="ghost" size="sm" onClick={handleResetToGlobal}>
                חזור לסינון גלובלי
              </Button>
            )}
            <Select value={useLocalFilter ? localDateFilter : ""} onValueChange={handleLocalFilterChange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 ml-2" />
                <SelectValue placeholder="שנה תאריכים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mtd">מתחילת החודש (MTD)</SelectItem>
                <SelectItem value="ytd">מתחילת השנה (YTD)</SelectItem>
                <SelectItem value="y1">12 חודשים אחרונים</SelectItem>
                <SelectItem value="y2">24 חודשים אחרונים</SelectItem>
                <SelectItem value="y3">36 חודשים אחרונים</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" disabled={isLoading} onClick={handleRefresh}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {mainMetrics.map((metric) => (
              <div key={metric.label} className="bg-muted/50 rounded-lg p-4 transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", metric.color)}>
                    {metric.icon}
                  </div>
                </div>
                <p className="text-xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Order Status Breakdown */}
        {!isLoading && summary.totalOrders > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-4 flex-wrap">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                {orderStatus.paid} הזמנות שולמו
              </Badge>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                {orderStatus.fulfilled} הזמנות נשלחו
              </Badge>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                {orderStatus.pending} ממתינות
              </Badge>
              {orderStatus.refunded > 0 && (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                  {orderStatus.refunded} הוחזרו
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Details */}
      {!isLoading && (trafficSources.length > 0 || topProducts.length > 0) && (
        <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <div className="glass rounded-xl p-4 card-shadow">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity">
                <span className="font-medium">נתונים נוספים</span>
                <Button variant="ghost" size="icon">
                  {isDetailsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traffic Sources */}
                {trafficSources.length > 0 && (
                  <div className="bg-muted/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="w-5 h-5 text-primary" />
                      <h4 className="font-bold">מקורות תנועה</h4>
                    </div>
                    <div className="space-y-3">
                      {trafficSources.slice(0, 5).map((source) => (
                        <div key={source.source} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{source.source}</span>
                            <span className="font-medium">{source.orders} הזמנות ({source.percentage}%)</span>
                          </div>
                          <Progress value={parseFloat(source.percentage)} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Products */}
                {topProducts.length > 0 && (
                  <div className="bg-muted/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="w-5 h-5 text-primary" />
                      <h4 className="font-bold">מוצרים מובילים</h4>
                    </div>
                    <div className="space-y-3">
                      {topProducts.slice(0, 5).map((product, index) => (
                        <div key={product.name} className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="text-sm truncate max-w-[200px]">{product.name}</span>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm">{formatCurrency(product.revenue)}</p>
                            <p className="text-xs text-muted-foreground">{product.quantity} יחידות</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}
    </div>
  );
}