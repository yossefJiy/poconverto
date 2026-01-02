import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowRight,
  ShoppingCart, 
  DollarSign, 
  Package, 
  Users, 
  RefreshCw,
  Loader2,
  Download,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { GlobalDateFilter, getDateRangeFromFilter, type DateFilterValue } from "@/components/analytics/GlobalDateFilter";
import { AnalyticsPlatformNav } from "@/components/analytics/AnalyticsPlatformNav";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

function formatCurrency(num: number | undefined | null): string {
  return "₪" + formatNumber(num);
}

const statusLabels: Record<string, string> = {
  processing: 'בטיפול',
  pending: 'ממתין',
  'on-hold': 'בהמתנה',
  completed: 'הושלם',
  cancelled: 'בוטל',
  refunded: 'הוחזר',
  failed: 'נכשל',
};

const statusColors: Record<string, string> = {
  processing: 'bg-blue-500/20 text-blue-500',
  pending: 'bg-yellow-500/20 text-yellow-500',
  'on-hold': 'bg-orange-500/20 text-orange-500',
  completed: 'bg-green-500/20 text-green-500',
  cancelled: 'bg-gray-500/20 text-gray-500',
  refunded: 'bg-red-500/20 text-red-500',
  failed: 'bg-red-500/20 text-red-500',
};

export default function WooCommerceDetail() {
  const navigate = useNavigate();
  const { selectedClient } = useClient();
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("30");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>();

  const dateRange = getDateRangeFromFilter(dateFilter, customDateRange);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["woocommerce-detail", selectedClient?.id, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const { data: responseData, error } = await supabase.functions.invoke('woocommerce-api', {
        body: { 
          action: 'getAnalytics',
          clientId: selectedClient?.id,
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate, 
        }
      });
      if (error) throw error;
      return responseData;
    },
    enabled: !!selectedClient?.id,
    staleTime: 5 * 60 * 1000,
  });

  const summary = data?.summary || {
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    totalItemsSold: 0,
    uniqueCustomers: 0,
  };

  const ordersByStatus = data?.ordersByStatus || {};
  const topProducts = data?.topProducts || [];
  const recentOrders = data?.recentOrders || [];
  const dailySales = data?.dailySales || [];

  const orderStatusData = useMemo(() => {
    return Object.entries(ordersByStatus)
      .map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count as number,
        color: statusColors[status]?.includes('green') ? '#22c55e' :
               statusColors[status]?.includes('blue') ? '#3b82f6' :
               statusColors[status]?.includes('yellow') ? '#f59e0b' :
               statusColors[status]?.includes('orange') ? '#f97316' :
               statusColors[status]?.includes('red') ? '#ef4444' : '#6b7280',
      }))
      .filter(item => item.value > 0);
  }, [ordersByStatus]);

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <p>בחר לקוח כדי לצפות בנתונים</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Right side: Back, Platform Nav */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/analytics')}>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <AnalyticsPlatformNav />
          </div>
          
          {/* Left side: Date, Refresh, Export */}
          <div className="flex items-center gap-2">
            <GlobalDateFilter
              value={dateFilter}
              onChange={setDateFilter}
              customDateRange={customDateRange}
              onCustomDateChange={setCustomDateRange}
            />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>ייצוא PDF</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Page Header */}
        <PageHeader 
          title="WooCommerce"
          description="נתונים מפורטים"
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[
                { label: "סה״כ מכירות", value: formatCurrency(summary.totalRevenue), icon: <DollarSign className="w-5 h-5" />, color: "bg-green-500/20 text-green-500" },
                { label: "הזמנות", value: formatNumber(summary.totalOrders), icon: <ShoppingCart className="w-5 h-5" />, color: "bg-purple-500/20 text-purple-500" },
                { label: "ממוצע להזמנה", value: formatCurrency(summary.avgOrderValue), icon: <DollarSign className="w-5 h-5" />, color: "bg-blue-500/20 text-blue-500" },
                { label: "פריטים שנמכרו", value: formatNumber(summary.totalItemsSold), icon: <Package className="w-5 h-5" />, color: "bg-orange-500/20 text-orange-500" },
                { label: "לקוחות", value: formatNumber(summary.uniqueCustomers), icon: <Users className="w-5 h-5" />, color: "bg-pink-500/20 text-pink-500" },
              ].map((metric) => (
                <div key={metric.label} className="glass rounded-xl p-4 card-shadow">
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

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4">מכירות יומיות</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailySales}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#a855f7" fill="url(#colorRevenue)" name="הכנסות" />
                      <Area yAxisId="right" type="monotone" dataKey="orders" stroke="#3b82f6" fill="url(#colorOrders)" name="הזמנות" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4">סטטוס הזמנות</h3>
                <div className="h-[300px]">
                  {orderStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {orderStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      אין נתוני סטטוס
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Products */}
            {topProducts.length > 0 && (
              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4">מוצרים מובילים</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">מוצר</TableHead>
                        <TableHead className="text-left">כמות שנמכרה</TableHead>
                        <TableHead className="text-left">הכנסות</TableHead>
                        <TableHead className="text-left">אחוז מסה״כ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.slice(0, 10).map((product: any, index: number) => {
                        const percentage = summary.totalRevenue > 0 
                          ? (product.revenue / summary.totalRevenue) * 100 
                          : 0;
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium max-w-[250px] truncate">{product.name}</TableCell>
                            <TableCell>{formatNumber(product.quantity)}</TableCell>
                            <TableCell>{formatCurrency(product.revenue)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={percentage} className="w-20 h-2" />
                                <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4">הזמנות אחרונות</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">מזהה</TableHead>
                        <TableHead className="text-right">לקוח</TableHead>
                        <TableHead className="text-center">סטטוס</TableHead>
                        <TableHead className="text-left">סכום</TableHead>
                        <TableHead className="text-left">תאריך</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.slice(0, 10).map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>{order.billing?.first_name} {order.billing?.last_name}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("text-xs", statusColors[order.status] || '')}>
                              {statusLabels[order.status] || order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(parseFloat(order.total || '0'))}</TableCell>
                          <TableCell>{new Date(order.date_created).toLocaleDateString('he-IL')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}