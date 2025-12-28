import { useState } from "react";
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
  ArrowUpDown,
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

interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  created_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string | null;
  }>;
}

interface ShopifyAnalyticsProps {
  orders: ShopifyOrder[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

function formatCurrency(num: number): string {
  return "₪" + formatNumber(num);
}

function getDateRange(filter: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case "mtd": {
      // Month to date
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = today;
      // Previous month same period
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return { start, end, prevStart, prevEnd };
    }
    case "ytd": {
      // Year to date
      const start = new Date(now.getFullYear(), 0, 1);
      const end = today;
      // Previous year same period
      const prevStart = new Date(now.getFullYear() - 1, 0, 1);
      const prevEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      return { start, end, prevStart, prevEnd };
    }
    case "y1": {
      // This month vs same month last year
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const prevStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      const prevEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);
      return { start, end, prevStart, prevEnd };
    }
    case "y2": {
      // This month vs same month 2 years ago
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const prevStart = new Date(now.getFullYear() - 2, now.getMonth(), 1);
      const prevEnd = new Date(now.getFullYear() - 2, now.getMonth() + 1, 0);
      return { start, end, prevStart, prevEnd };
    }
    case "y3": {
      // This month vs same month 3 years ago
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const prevStart = new Date(now.getFullYear() - 3, now.getMonth(), 1);
      const prevEnd = new Date(now.getFullYear() - 3, now.getMonth() + 1, 0);
      return { start, end, prevStart, prevEnd };
    }
    default:
      return getDateRange("mtd");
  }
}

function filterOrdersByDateRange(orders: ShopifyOrder[], start: Date, end: Date): ShopifyOrder[] {
  return orders.filter(order => {
    const orderDate = new Date(order.created_at);
    return orderDate >= start && orderDate <= end;
  });
}

function calculateMetrics(orders: ShopifyOrder[]) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItems = orders.reduce((sum, o) => 
    sum + o.line_items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );
  const paidOrders = orders.filter(o => o.financial_status === 'paid').length;
  const fulfilledOrders = orders.filter(o => o.fulfillment_status === 'fulfilled').length;
  
  return {
    totalOrders,
    totalRevenue,
    avgOrderValue,
    totalItems,
    paidOrders,
    fulfilledOrders,
  };
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function ShopifyAnalytics({ 
  orders, 
  isLoading, 
  isError, 
  error, 
  refetch,
  dateFilter,
  onDateFilterChange,
}: ShopifyAnalyticsProps) {
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>שגיאה בטעינת נתוני Shopify</AlertTitle>
        <AlertDescription>
          {error?.message || 'לא ניתן לטעון נתונים'}
          <Button variant="outline" size="sm" className="mr-4" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 ml-2" />
            נסה שוב
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const dateRange = getDateRange(dateFilter);
  const currentOrders = filterOrdersByDateRange(orders, dateRange.start, dateRange.end);
  const previousOrders = filterOrdersByDateRange(orders, dateRange.prevStart, dateRange.prevEnd);
  
  const current = calculateMetrics(currentOrders);
  const previous = calculateMetrics(previousOrders);

  const changes = {
    orders: calculateChange(current.totalOrders, previous.totalOrders),
    revenue: calculateChange(current.totalRevenue, previous.totalRevenue),
    avgOrder: calculateChange(current.avgOrderValue, previous.avgOrderValue),
    items: calculateChange(current.totalItems, previous.totalItems),
  };

  const getFilterLabel = () => {
    switch (dateFilter) {
      case "mtd": return "מתחילת החודש";
      case "ytd": return "מתחילת השנה";
      case "y1": return "מול שנה שעברה";
      case "y2": return "מול לפני שנתיים";
      case "y3": return "מול לפני 3 שנים";
      default: return "";
    }
  };

  const metrics = [
    {
      label: "הזמנות",
      value: formatNumber(current.totalOrders),
      change: changes.orders,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "bg-purple-500/20 text-purple-500",
    },
    {
      label: "הכנסות",
      value: formatCurrency(current.totalRevenue),
      change: changes.revenue,
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-green-500/20 text-green-500",
    },
    {
      label: "ממוצע להזמנה",
      value: formatCurrency(current.avgOrderValue),
      change: changes.avgOrder,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "bg-blue-500/20 text-blue-500",
    },
    {
      label: "פריטים נמכרו",
      value: formatNumber(current.totalItems),
      change: changes.items,
      icon: <Package className="w-5 h-5" />,
      color: "bg-orange-500/20 text-orange-500",
    },
  ];

  return (
    <div className="glass rounded-xl p-6 card-shadow">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <h3 className="font-bold text-lg">נתוני Shopify</h3>
            <p className="text-sm text-muted-foreground">{getFilterLabel()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={onDateFilterChange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mtd">מתחילת החודש (MTD)</SelectItem>
              <SelectItem value="ytd">מתחילת השנה (YTD)</SelectItem>
              <SelectItem value="y1">השוואה - שנה שעברה</SelectItem>
              <SelectItem value="y2">השוואה - לפני שנתיים</SelectItem>
              <SelectItem value="y3">השוואה - לפני 3 שנים</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" disabled={isLoading} onClick={() => refetch()}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-muted/50 rounded-lg p-4 transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", metric.color)}>
                  {metric.icon}
                </div>
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1",
                  metric.change >= 0 
                    ? "bg-green-500/20 text-green-500" 
                    : "bg-red-500/20 text-red-500"
                )}>
                  {metric.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(metric.change).toFixed(1)}%
                </span>
              </div>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Orders status breakdown */}
      {!isLoading && current.totalOrders > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              {current.paidOrders} הזמנות שולמו
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
              {current.fulfilledOrders} הזמנות נשלחו
            </Badge>
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              {current.totalOrders - current.fulfilledOrders} ממתינות למשלוח
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
