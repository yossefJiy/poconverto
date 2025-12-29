import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Store, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Package, 
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface WooCommerceCardProps {
  clientId: string;
  startDate?: string;
  endDate?: string;
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

export function WooCommerceCard({ clientId, startDate, endDate }: WooCommerceCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["woocommerce-analytics", clientId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('woocommerce-api', {
        body: {
          action: 'get_analytics',
          client_id: clientId,
          start_date: startDate,
          end_date: endDate,
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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

  const formatCurrency = (value: number, currency = 'ILS') => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#96588A]" />
            WooCommerce
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[200px]" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#96588A]" />
            WooCommerce
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>שגיאה בטעינת נתונים</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              נסה שוב
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary || {};
  const dailySales = data?.dailySales || [];
  const topProducts = data?.topProducts || [];
  const recentOrders = data?.recentOrders || [];
  const statusBreakdown = data?.statusBreakdown || {};

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5 text-[#96588A]" />
          WooCommerce Analytics
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("w-4 h-4 ml-2", isRefreshing && "animate-spin")} />
          רענן
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#96588A]/20 to-[#96588A]/5 border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              סה"כ הכנסות
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalRevenue || 0, summary.currency)}
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/5 border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <ShoppingCart className="w-4 h-4" />
              הזמנות
            </div>
            <div className="text-2xl font-bold">{summary.totalOrders || 0}</div>
          </div>
          
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              ממוצע להזמנה
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.averageOrderValue || 0, summary.currency)}
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-500/5 border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Package className="w-4 h-4" />
              פריטים
            </div>
            <div className="text-2xl font-bold">{summary.totalItems || 0}</div>
          </div>
        </div>

        {/* Status Breakdown */}
        {Object.keys(statusBreakdown).length > 0 && (
          <div className="flex flex-wrap gap-2">
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

        {/* Sales Chart */}
        {dailySales.length > 0 && (
          <div className="h-[200px]">
            <ChartContainer
              config={{
                revenue: { label: "הכנסות", color: "#96588A" },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySales}>
                  <defs>
                    <linearGradient id="wooRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#96588A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#96588A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₪${value.toLocaleString()}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#96588A"
                    fill="url(#wooRevenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              מוצרים מובילים
            </h4>
            <div className="space-y-2">
              {topProducts.slice(0, 5).map((product: any, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
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
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
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
      </CardContent>
    </Card>
  );
}
