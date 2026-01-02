import { useState } from "react";
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Package,
  Users,
  Loader2,
  AlertCircle,
  Eye,
  Percent,
  Globe,
  ChevronDown,
  ChevronUp,
  Mail,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
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
import { isAuthError } from "@/lib/authError";
import { useNavigate } from "react-router-dom";
import { useClient } from "@/hooks/useClient";
import { useAnalyticsSnapshot, formatSnapshotDate } from "@/hooks/useAnalyticsSnapshot";

interface ShopifyAnalyticsProps {
  globalDateFrom: string;
  globalDateTo: string;
  clientProfitMargin?: number;
  clientJiyCommission?: number;
}

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

function formatCurrency(num: number | undefined | null): string {
  return "₪" + formatNumber(num);
}

export function ShopifyAnalytics({ 
  globalDateFrom,
  globalDateTo,
  clientProfitMargin = 0,
  clientJiyCommission = 0,
}: ShopifyAnalyticsProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const navigate = useNavigate();
  const { selectedClient } = useClient();

  // Fetch snapshot fallback
  const { data: snapshot } = useAnalyticsSnapshot(selectedClient?.id, 'shopify');

  // Use global dates directly
  const dateFrom = globalDateFrom;
  const dateTo = globalDateTo;
  
  const { 
    data: analyticsData, 
    isLoading, 
    isError, 
    error, 
  } = useShopifyAnalytics(dateFrom, dateTo);

  // Fetch comparison data for previous period
  const { data: comparisonData, isLoading: isLoadingComparison } = useShopifyComparison(dateFrom, dateTo);

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

  // Check if error is auth-related
  const errorIsAuthRelated = isError && error && isAuthError(error);
  
  if (isError && errorIsAuthRelated) {
    return (
      <div className="glass rounded-xl p-6 card-shadow">
        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <div className="flex-1">
            <p className="font-medium text-yellow-600">פג תוקף ההתחברות</p>
            <p className="text-sm text-muted-foreground">יש להתחבר מחדש כדי לצפות בנתונים</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
            התחבר מחדש
          </Button>
        </div>
      </div>
    );
  }

  if (isError && !snapshot) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>שגיאה בטעינת נתוני Shopify</AlertTitle>
        <AlertDescription className="flex items-center gap-4">
          {error?.message || 'לא ניתן לטעון נתונים'}
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

  // Determine if we're using snapshot fallback
  const usingSnapshot = isError && !!snapshot;
  const effectiveData = analyticsData || (snapshot?.data as typeof analyticsData | undefined);

  const summary = effectiveData?.summary || {
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

  const orderStatus = effectiveData?.orderStatus || {
    paid: 0,
    fulfilled: 0,
    pending: 0,
    refunded: 0,
  };

  const trafficSources = effectiveData?.trafficSources || [];
  const topProducts = effectiveData?.topProducts || [];
  const salesBreakdown = effectiveData?.salesBreakdown || {
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
    <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
      {/* Alert for missing session data */}
      {!isLoading && !hasRealSessionData && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10 mb-6">
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
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-purple-500" />
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="font-bold text-lg">נתוני Shopify</h3>
                </div>
                {usingSnapshot && snapshot && (
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    נתונים שמורים מ־{formatSnapshotDate(snapshot.updated_at)}
                  </Badge>
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon">
              {isDetailsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </CollapsibleTrigger>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {mainMetrics.map((metric) => {
              // Get comparison data for this metric
              const getComparison = () => {
                if (!comparisonData) return null;
                switch (metric.label) {
                  case "סה״כ מכירות":
                    return { change: comparisonData.changes.revenue, prev: comparisonData.previous.totalRevenue };
                  case "הזמנות":
                    return { change: comparisonData.changes.orders, prev: comparisonData.previous.totalOrders };
                  default:
                    return null;
                }
              };
              const comparison = getComparison();
              
              return (
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
                      {comparison && !isLoadingComparison && (
                        <div className="flex items-center gap-1 mt-1">
                          {comparison.change >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          )}
                          <span className={cn(
                            "text-xs font-medium",
                            comparison.change >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {comparison.change >= 0 ? "+" : ""}{comparison.change.toFixed(1)}%
                          </span>
                        </div>
                      )}
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
              );
            })}
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

        {/* Collapsible Content - All detailed data inside */}
        <CollapsibleContent className="mt-6 space-y-6">
          {/* Sales Breakdown & Profitability */}
          {salesBreakdown.grossSales > 0 && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-500" />
                <h4 className="font-medium">פירוט מכירות ורווחיות</h4>
              </div>
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

          {/* Traffic Sources & Top Products */}
          {(trafficSources.length > 0 || topProducts.length > 0) && (
            <div className="pt-4 border-t border-border">
              <h4 className="font-medium mb-4">נתונים נוספים</h4>
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
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}