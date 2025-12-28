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
  Mail,
  AlertTriangle,
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
import { useShopifyComparison } from "@/hooks/useShopifyComparison";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShopifyAnalyticsProps {
  globalDateFrom: string;
  globalDateTo: string;
  onRefresh?: () => void;
  clientProfitMargin?: number;
  clientJiyCommission?: number;
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
  clientProfitMargin = 0,
  clientJiyCommission = 0,
}: ShopifyAnalyticsProps) {
  const [useLocalFilter, setUseLocalFilter] = useState(false);
  const [localDateFilter, setLocalDateFilter] = useState("mtd");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Calculate local date range if using local filter
  const { dateFrom, dateTo } = useMemo(() => {
    if (!useLocalFilter) {
      return { dateFrom: globalDateFrom, dateTo: globalDateTo };
    }
    
    const now = new Date();
    // Use end of today to include today's data
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let start: Date;
    let end: Date = today;
    
    switch (localDateFilter) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "yesterday":
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        end = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59);
        break;
      case "mtd":
        // First day of current month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "7":
        start = new Date(today);
        start.setDate(start.getDate() - 6); // 7 days including today
        break;
      case "30":
        start = new Date(today);
        start.setDate(start.getDate() - 29); // 30 days including today
        break;
      case "90":
        start = new Date(today);
        start.setDate(start.getDate() - 89); // 90 days including today
        break;
      case "ytd":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // Format as YYYY-MM-DD
    const formatDateOnly = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      dateFrom: formatDateOnly(start),
      dateTo: formatDateOnly(end),
    };
  }, [useLocalFilter, localDateFilter, globalDateFrom, globalDateTo]);
  
  const { 
    data: analyticsData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useShopifyAnalytics(dateFrom, dateTo);

  // Fetch comparison data for previous period
  const { data: comparisonData, isLoading: isLoadingComparison } = useShopifyComparison(dateFrom, dateTo);
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

  const handleSendAdminEmail = async (issue: string) => {
    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-admin-alert', {
        body: { 
          issue,
          context: 'Shopify Analytics',
          timestamp: new Date().toISOString(),
        }
      });
      
      if (error) throw error;
      toast.success('המייל נשלח למנהל האתר');
    } catch (err) {
      console.error('Failed to send email:', err);
      toast.error('שגיאה בשליחת המייל');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>שגיאה בטעינת נתוני Shopify</AlertTitle>
        <AlertDescription className="flex items-center gap-4">
          {error?.message || 'לא ניתן לטעון נתונים'}
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 ml-2" />
            נסה שוב
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSendAdminEmail('שגיאה בטעינת נתוני Shopify: ' + (error?.message || 'לא ידוע'))}
            disabled={isSendingEmail}
          >
            {isSendingEmail ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Mail className="w-4 h-4 ml-2" />}
            דווח למנהל
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
    sessions: null,
    visitors: null,
    conversionRate: null,
    isRealSessionData: false,
  };

  const orderStatus = analyticsData?.orderStatus || {
    paid: 0,
    fulfilled: 0,
    pending: 0,
    refunded: 0,
  };

  const trafficSources = analyticsData?.trafficSources || [];
  const topProducts = analyticsData?.topProducts || [];
  const salesBreakdown = analyticsData?.salesBreakdown || {
    grossSales: 0,
    discounts: 0,
    returns: 0,
    netSales: 0,
    shipping: 0,
    taxes: 0,
    totalSales: summary.totalRevenue,
  };

  // Calculate profitability
  const grossProfit = salesBreakdown.grossSales * (clientProfitMargin / 100);
  const jiyCommission = salesBreakdown.totalSales * (clientJiyCommission / 100);

  // Only show real data - no estimates
  const hasRealSessionData = summary.isRealSessionData && summary.sessions !== null;

  // Main dashboard metrics - only real data from Shopify API
  const mainMetrics = [
    {
      label: "סה״כ מכירות",
      value: formatCurrency(summary.totalRevenue),
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-green-500/20 text-green-500",
      available: true,
    },
    {
      label: "הזמנות",
      value: formatNumber(summary.totalOrders),
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "bg-purple-500/20 text-purple-500",
      available: true,
    },
    {
      label: "סשנים",
      value: hasRealSessionData ? formatNumber(summary.sessions!) : null,
      icon: <Eye className="w-5 h-5" />,
      color: "bg-indigo-500/20 text-indigo-500",
      available: hasRealSessionData,
      requiresAction: !hasRealSessionData,
      actionIssue: 'נדרשת הרשאת read_reports ב-Shopify Access Token לקבלת נתוני סשנים אמיתיים',
    },
    {
      label: "יחס המרה",
      value: hasRealSessionData ? summary.conversionRate + "%" : null,
      icon: <Percent className="w-5 h-5" />,
      color: "bg-cyan-500/20 text-cyan-500",
      available: hasRealSessionData,
      requiresAction: !hasRealSessionData,
      actionIssue: 'נדרשת הרשאת read_reports ב-Shopify Access Token לקבלת יחס המרה אמיתי',
    },
    {
      label: "ממוצע להזמנה",
      value: formatCurrency(summary.avgOrderValue),
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-blue-500/20 text-blue-500",
      available: true,
    },
    {
      label: "פריטים שנמכרו",
      value: formatNumber(summary.totalItemsSold),
      icon: <Package className="w-5 h-5" />,
      color: "bg-orange-500/20 text-orange-500",
      available: true,
    },
    {
      label: "לקוחות ייחודיים",
      value: formatNumber(summary.uniqueCustomers),
      icon: <Users className="w-5 h-5" />,
      color: "bg-pink-500/20 text-pink-500",
      available: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Alert for missing session data */}
      {!isLoading && !hasRealSessionData && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-600">נדרשת פעולה נוספת</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-sm">
              נתוני סשנים ויחס המרה דורשים הרשאת <code className="bg-muted px-1 rounded">read_reports</code> ב-Shopify Access Token
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleSendAdminEmail('נדרשת הוספת הרשאת read_reports ל-Shopify Access Token כדי לקבל נתוני סשנים ויחס המרה אמיתיים')}
              disabled={isSendingEmail}
              className="shrink-0"
            >
              {isSendingEmail ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Mail className="w-4 h-4 ml-2" />}
              שלח למנהל האתר
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
                <SelectItem value="today">היום</SelectItem>
                <SelectItem value="yesterday">אתמול</SelectItem>
                <SelectItem value="mtd">מתחילת החודש</SelectItem>
                <SelectItem value="7">7 ימים אחרונים</SelectItem>
                <SelectItem value="30">30 ימים אחרונים</SelectItem>
                <SelectItem value="90">90 ימים אחרונים</SelectItem>
                <SelectItem value="ytd">מתחילת השנה</SelectItem>
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {mainMetrics.map((metric) => (
              <div key={metric.label} className="bg-muted/50 rounded-lg p-4 transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", metric.color)}>
                    {metric.icon}
                  </div>
                </div>
                {metric.available ? (
                  <>
                    <p className="text-xl font-bold">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-yellow-600">נדרשת פעולה</p>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    {'actionIssue' in metric && metric.actionIssue && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-1 h-6 text-xs p-1"
                        onClick={() => handleSendAdminEmail(metric.actionIssue!)}
                        disabled={isSendingEmail}
                      >
                        <Mail className="w-3 h-3 ml-1" />
                        דווח
                      </Button>
                    )}
                  </>
                )}
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

        {/* Previous Period Comparison */}
        {!isLoading && comparisonData && (
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">השוואה לתקופה קודמת</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">הזמנות</p>
                <p className="text-lg font-bold">{formatNumber(comparisonData.current.totalOrders)}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">לפני: {formatNumber(comparisonData.previous.totalOrders)}</span>
                  <span className={cn(
                    "text-xs font-medium px-1 rounded",
                    comparisonData.changes.orders >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {comparisonData.changes.orders >= 0 ? "+" : ""}{comparisonData.changes.orders.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">מכירות</p>
                <p className="text-lg font-bold">{formatCurrency(comparisonData.current.totalRevenue)}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">לפני: {formatCurrency(comparisonData.previous.totalRevenue)}</span>
                  <span className={cn(
                    "text-xs font-medium px-1 rounded",
                    comparisonData.changes.revenue >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {comparisonData.changes.revenue >= 0 ? "+" : ""}{comparisonData.changes.revenue.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gross/Net Sales Breakdown with Profitability */}
        {!isLoading && salesBreakdown.grossSales > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">פירוט מכירות ורווחיות</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-muted-foreground">Gross Sales</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(salesBreakdown.grossSales)}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-muted-foreground">הנחות</p>
                <p className="text-lg font-bold text-red-500">-{formatCurrency(salesBreakdown.discounts)}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-muted-foreground">Net Sales</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(salesBreakdown.netSales)}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs text-muted-foreground">סה״כ מכירות</p>
                <p className="text-lg font-bold text-purple-600">{formatCurrency(salesBreakdown.totalSales)}</p>
              </div>
              {clientProfitMargin > 0 && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-muted-foreground">רווח גולמי ({clientProfitMargin}%)</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(grossProfit)}</p>
                </div>
              )}
              {clientJiyCommission > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-muted-foreground">עמלת JIY ({clientJiyCommission}%)</p>
                  <p className="text-lg font-bold text-amber-600">{formatCurrency(jiyCommission)}</p>
                </div>
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