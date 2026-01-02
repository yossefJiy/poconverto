import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowRight,
  ShoppingCart, 
  DollarSign, 
  Package, 
  Users, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  Download,
  Eye,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalDateFilter, getDateRangeFromFilter, type DateFilterValue } from "@/components/analytics/GlobalDateFilter";
import { AnalyticsPlatformNav } from "@/components/analytics/AnalyticsPlatformNav";
import { useShopifyAnalytics } from "@/hooks/useShopifyData";
import { useShopifyComparison } from "@/hooks/useShopifyComparison";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
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

const COLORS = ['#a855f7', '#3b82f6', '#22c55e', '#f97316', '#ec4899', '#14b8a6'];

export default function ShopifyDetail() {
  const navigate = useNavigate();
  const { selectedClient } = useClient();
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("30");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>();

  const dateRange = getDateRangeFromFilter(dateFilter, customDateRange);

  const { data, isLoading, refetch } = useShopifyAnalytics(dateRange.startDate, dateRange.endDate);
  const { data: comparisonData } = useShopifyComparison(dateRange.startDate, dateRange.endDate);

  const summary = data?.summary || {
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    totalItemsSold: 0,
    uniqueCustomers: 0,
    sessions: null,
    conversionRate: null,
    isRealSessionData: false,
  };

  const orderStatus = data?.orderStatus || { paid: 0, fulfilled: 0, pending: 0, refunded: 0 };
  const topProducts = data?.topProducts || [];
  const trafficSources = data?.trafficSources || [];
  const salesBreakdown = data?.salesBreakdown || {
    grossSales: 0,
    discounts: 0,
    returns: 0,
    netSales: 0,
    shipping: 0,
    taxes: 0,
    totalSales: summary.totalRevenue,
  };

  const hasRealSessionData = summary.isRealSessionData && summary.sessions !== null;

  const orderStatusData = useMemo(() => [
    { name: 'שולם', value: orderStatus.paid, color: '#22c55e' },
    { name: 'נשלח', value: orderStatus.fulfilled, color: '#3b82f6' },
    { name: 'ממתין', value: orderStatus.pending, color: '#f97316' },
    { name: 'הוחזר', value: orderStatus.refunded, color: '#ef4444' },
  ].filter(item => item.value > 0), [orderStatus]);

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
          title="Shopify"
          description="נתונים מפורטים"
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: "סה״כ מכירות", value: formatCurrency(summary.totalRevenue), icon: <DollarSign className="w-5 h-5" />, color: "bg-green-500/20 text-green-500", change: comparisonData?.changes.revenue },
                { label: "הזמנות", value: formatNumber(summary.totalOrders), icon: <ShoppingCart className="w-5 h-5" />, color: "bg-purple-500/20 text-purple-500", change: comparisonData?.changes.orders },
                { label: "ממוצע להזמנה", value: formatCurrency(summary.avgOrderValue), icon: <DollarSign className="w-5 h-5" />, color: "bg-blue-500/20 text-blue-500" },
                { label: "פריטים שנמכרו", value: formatNumber(summary.totalItemsSold), icon: <Package className="w-5 h-5" />, color: "bg-orange-500/20 text-orange-500" },
                { label: "לקוחות", value: formatNumber(summary.uniqueCustomers), icon: <Users className="w-5 h-5" />, color: "bg-pink-500/20 text-pink-500" },
                { label: "סשנים", value: hasRealSessionData ? formatNumber(summary.sessions!) : "N/A", icon: <Eye className="w-5 h-5" />, color: "bg-indigo-500/20 text-indigo-500" },
                { label: "יחס המרה", value: hasRealSessionData ? `${summary.conversionRate}%` : "N/A", icon: <Percent className="w-5 h-5" />, color: "bg-cyan-500/20 text-cyan-500" },
              ].map((metric) => (
                <div key={metric.label} className="glass rounded-xl p-4 card-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", metric.color)}>
                      {metric.icon}
                    </div>
                  </div>
                  <p className="text-xl font-bold">{metric.value}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    {metric.change !== undefined && (
                      <span className={cn(
                        "text-xs font-medium flex items-center gap-0.5",
                        metric.change >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {metric.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {metric.change >= 0 ? "+" : ""}{metric.change.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Sales Breakdown & Order Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4">פירוט מכירות</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>מכירות ברוטו</span>
                    <span className="font-bold">{formatCurrency(salesBreakdown.grossSales)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>הנחות</span>
                    <span className="text-red-500">-{formatCurrency(salesBreakdown.discounts)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>החזרות</span>
                    <span className="text-red-500">-{formatCurrency(salesBreakdown.returns)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span>מכירות נטו</span>
                    <span className="font-bold">{formatCurrency(salesBreakdown.netSales)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>משלוח</span>
                    <span>{formatCurrency(salesBreakdown.shipping)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>מיסים</span>
                    <span>{formatCurrency(salesBreakdown.taxes)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center text-lg">
                    <span className="font-bold">סה״כ</span>
                    <span className="font-bold text-green-500">{formatCurrency(salesBreakdown.totalSales)}</span>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4">סטטוס הזמנות</h3>
                <div className="h-[250px]">
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

            {/* Traffic Sources */}
            {trafficSources.length > 0 && (
              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4">מקורות תנועה</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {trafficSources.map((source: any, index: number) => (
                    <div key={index} className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold">{source.sessions || source.percentage}%</p>
                      <p className="text-sm text-muted-foreground">{source.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}