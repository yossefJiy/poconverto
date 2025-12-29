import { useState, useEffect, useMemo } from "react";
import { 
  Store, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Calendar,
  Loader2,
  AlertCircle,
  Plus,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WooCommerceCardProps {
  globalDateFrom: string;
  globalDateTo: string;
  clientId?: string;
  isAdmin?: boolean;
  onAddIntegration?: () => void;
  onRefresh?: () => void;
}

const statusColors: Record<string, string> = {
  processing: "bg-blue-500",
  completed: "bg-green-500",
  pending: "bg-yellow-500",
  cancelled: "bg-red-500",
  refunded: "bg-purple-500",
  failed: "bg-red-700",
  "on-hold": "bg-orange-500",
};

const statusLabels: Record<string, string> = {
  processing: "בעיבוד",
  completed: "הושלם",
  pending: "ממתין",
  cancelled: "בוטל",
  refunded: "הוחזר",
  failed: "נכשל",
  "on-hold": "בהמתנה",
};

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

function formatCurrency(num: number, currency = "ILS"): string {
  const symbol = currency === "USD" ? "$" : "₪";
  return symbol + formatNumber(num);
}

interface MetricWithComparisonProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

function MetricWithComparison({ label, value, change, icon, color }: MetricWithComparisonProps) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <div className="bg-muted/50 rounded-lg p-4 transition-all hover:scale-[1.02]">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
          {icon}
        </div>
      </div>
      <p className="text-xl font-bold">{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        {change !== undefined && (
          <span className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5",
            isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? "+" : ""}{change}%
          </span>
        )}
      </div>
    </div>
  );
}

export function WooCommerceCard({ 
  globalDateFrom,
  globalDateTo,
  clientId,
  isAdmin = false,
  onAddIntegration,
  onRefresh,
}: WooCommerceCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [useLocalFilter, setUseLocalFilter] = useState(false);
  const [localDateFilter, setLocalDateFilter] = useState("mtd");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getLocalStartDate = (filter: string): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start: Date;
    
    switch (filter) {
      case "today":
        start = today;
        break;
      case "yesterday":
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        break;
      case "mtd":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "7":
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        break;
      case "30":
        start = new Date(today);
        start.setDate(start.getDate() - 30);
        break;
      case "90":
        start = new Date(today);
        start.setDate(start.getDate() - 90);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    return start.toISOString().split('T')[0];
  };

  const effectiveDates = useMemo(() => {
    if (useLocalFilter) {
      return {
        startDate: getLocalStartDate(localDateFilter),
        endDate: new Date().toISOString().split('T')[0],
      };
    }
    return {
      startDate: globalDateFrom.split('T')[0],
      endDate: globalDateTo.split('T')[0],
    };
  }, [useLocalFilter, localDateFilter, globalDateFrom, globalDateTo]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["woocommerce-analytics", clientId, effectiveDates.startDate, effectiveDates.endDate],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('woocommerce-api', {
        body: {
          action: 'get_analytics',
          client_id: clientId,
          start_date: effectiveDates.startDate,
          end_date: effectiveDates.endDate,
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
  });

  const handleLocalFilterChange = (value: string) => {
    setLocalDateFilter(value);
    setUseLocalFilter(true);
  };

  const handleResetToGlobal = () => {
    setUseLocalFilter(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await supabase.functions.invoke('woocommerce-api', {
        body: {
          action: 'sync_all',
          client_id: clientId,
        }
      });
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="glass rounded-xl p-6 card-shadow animate-pulse">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#96588A]/20 flex items-center justify-center">
            <Store className="w-4 h-4 text-[#96588A]" />
          </div>
          <div className="h-6 bg-muted rounded w-32"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    const isIntegrationError = error.message?.includes('לא מוגדר') || error.message?.includes('חסר') || error.message?.includes('credentials');
    
    if (isIntegrationError && isAdmin && onAddIntegration) {
      return (
        <div className="glass rounded-xl p-6 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#96588A]/20 flex items-center justify-center">
              <Store className="w-4 h-4 text-[#96588A]" />
            </div>
            <h3 className="font-bold text-lg">WooCommerce</h3>
          </div>
          <div className="flex flex-col items-center gap-4 py-8">
            <Plug className="w-12 h-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">WooCommerce לא מוגדר עבור לקוח זה</p>
              <p className="text-sm text-muted-foreground">הוסף אינטגרציה כדי לראות נתוני חנות</p>
            </div>
            <Button onClick={onAddIntegration} className="glow">
              <Plus className="w-4 h-4 ml-2" />
              הוסף אינטגרציה
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="glass rounded-xl p-6 card-shadow">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#96588A]/20 flex items-center justify-center">
            <Store className="w-4 h-4 text-[#96588A]" />
          </div>
          <h3 className="font-bold text-lg">WooCommerce</h3>
        </div>
        <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">שגיאה בטעינת נתונים</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mr-auto">
            <RefreshCw className="w-4 h-4 ml-2" />
            נסה שוב
          </Button>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const dailySales = data?.dailySales || [];
  const topProducts = data?.topProducts || [];
  const recentOrders = data?.recentOrders || [];
  const statusBreakdown = data?.statusBreakdown || {};

  const summaryMetrics = [
    {
      label: "סה״כ הכנסות",
      value: formatCurrency(summary.totalRevenue || 0, summary.currency),
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-[#96588A]/20 text-[#96588A]",
    },
    {
      label: "הזמנות",
      value: formatNumber(summary.totalOrders || 0),
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "bg-blue-500/20 text-blue-500",
    },
    {
      label: "ממוצע להזמנה",
      value: formatCurrency(summary.averageOrderValue || 0, summary.currency),
      icon: <TrendingUp className="w-5 h-5" />,
      color: "bg-green-500/20 text-green-500",
    },
    {
      label: "פריטים",
      value: formatNumber(summary.totalItems || 0),
      icon: <Package className="w-5 h-5" />,
      color: "bg-orange-500/20 text-orange-500",
    },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="glass rounded-xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-[#96588A]/20 flex items-center justify-center">
                <Store className="w-4 h-4 text-[#96588A]" />
              </div>
              <div>
                <h3 className="font-bold text-lg">WooCommerce</h3>
                <p className="text-sm text-muted-foreground">
                  {useLocalFilter ? "סינון מותאם" : "לפי סינון גלובלי"}
                </p>
              </div>
            </div>
          </CollapsibleTrigger>
          
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
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" disabled={isLoading || isRefreshing} onClick={handleRefresh}>
              {isLoading || isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Summary Metrics - Always Visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {summaryMetrics.map((metric) => (
            <MetricWithComparison key={metric.label} {...metric} />
          ))}
        </div>

        {/* Status Breakdown */}
        {Object.keys(statusBreakdown).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <Badge 
                key={status} 
                variant="outline" 
                className="flex items-center gap-1"
              >
                <span className={cn("w-2 h-2 rounded-full", statusColors[status] || "bg-gray-500")} />
                {statusLabels[status] || status}: {count as number}
              </Badge>
            ))}
          </div>
        )}

        {/* Collapsible Detailed Content */}
        <CollapsibleContent className="mt-6 space-y-6">
          {/* Daily Sales Chart */}
          {dailySales.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-4">מכירות יומיות</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySales}>
                    <defs>
                      <linearGradient id="colorRevenueWoo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#96588A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#96588A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickFormatter={(value) => `₪${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem"
                      }}
                      formatter={(value: number) => [formatCurrency(value), "הכנסות"]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#96588A" 
                      fill="url(#colorRevenueWoo)" 
                      strokeWidth={2}
                      name="הכנסות"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Products */}
          {topProducts.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" />
                מוצרים מובילים
              </h4>
              <div className="space-y-2">
                {topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {product.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">{product.quantity} יח'</span>
                      <span className="font-semibold">
                        {formatCurrency(product.revenue, summary.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                הזמנות אחרונות
              </h4>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">מס' הזמנה</TableHead>
                      <TableHead className="text-right">לקוח</TableHead>
                      <TableHead className="text-right">סטטוס</TableHead>
                      <TableHead className="text-right">סכום</TableHead>
                      <TableHead className="text-right">תאריך</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.slice(0, 5).map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.number}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="flex items-center gap-1 w-fit"
                          >
                            <span className={cn("w-2 h-2 rounded-full", statusColors[order.status] || "bg-gray-500")} />
                            {statusLabels[order.status] || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(parseFloat(order.total), order.currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(order.date).toLocaleDateString('he-IL')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!data || (!dailySales.length && !recentOrders.length) && (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>אין נתונים זמינים לתקופה זו</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
                סנכרן נתונים
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
