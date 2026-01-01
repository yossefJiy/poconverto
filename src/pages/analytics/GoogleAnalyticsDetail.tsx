import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowRight,
  BarChart3, 
  Users, 
  Eye, 
  TrendingDown,
  RefreshCw,
  Loader2,
  Download,
  Clock,
  ShoppingCart,
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

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

const COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f97316', '#ec4899', '#14b8a6'];

export default function GoogleAnalyticsDetail() {
  const navigate = useNavigate();
  const { selectedClient } = useClient();
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("30");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>();

  const dateRange = getDateRangeFromFilter(dateFilter, customDateRange);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["google-analytics-detail", selectedClient?.id, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const { data: responseData, error } = await supabase.functions.invoke('google-analytics', {
        body: { 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate, 
          clientId: selectedClient?.id 
        }
      });
      if (error) throw error;
      return responseData;
    },
    enabled: !!selectedClient?.id,
    staleTime: 5 * 60 * 1000,
  });

  const metrics = {
    sessions: data?.sessions || 0,
    users: data?.users || 0,
    pageviews: data?.pageviews || 0,
    bounceRate: data?.bounceRate || 0,
    avgSessionDuration: data?.avgSessionDuration || '0:00',
  };

  const trafficSources = data?.trafficSources || [];
  const topPages = data?.topPages || [];
  const devices = data?.devices || [];
  const countries = data?.countries || [];
  const dailyData = data?.dailyData || [];
  const ecommerce = data?.ecommerce;

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
          title="Google Analytics"
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
                { label: "סשנים", value: formatNumber(metrics.sessions), icon: <BarChart3 className="w-5 h-5" />, color: "bg-blue-500/20 text-blue-500" },
                { label: "משתמשים", value: formatNumber(metrics.users), icon: <Users className="w-5 h-5" />, color: "bg-indigo-500/20 text-indigo-500" },
                { label: "צפיות בעמודים", value: formatNumber(metrics.pageviews), icon: <Eye className="w-5 h-5" />, color: "bg-purple-500/20 text-purple-500" },
                { label: "שיעור נטישה", value: `${metrics.bounceRate.toFixed(1)}%`, icon: <TrendingDown className="w-5 h-5" />, color: "bg-orange-500/20 text-orange-500" },
                { label: "זמן ממוצע", value: metrics.avgSessionDuration, icon: <Clock className="w-5 h-5" />, color: "bg-green-500/20 text-green-500" },
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

            {/* E-commerce Funnel */}
            {ecommerce && (
              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  משפך E-commerce
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-500">{formatNumber(ecommerce.addToCarts)}</p>
                    <p className="text-sm text-muted-foreground">הוספות לסל</p>
                    <p className="text-xs font-medium text-green-500">{ecommerce.conversionRates?.addToCartRate}%</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-500">{formatNumber(ecommerce.checkouts)}</p>
                    <p className="text-sm text-muted-foreground">התחלת תשלום</p>
                    <p className="text-xs font-medium text-green-500">{ecommerce.conversionRates?.checkoutRate}%</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-500">{formatNumber(ecommerce.purchases)}</p>
                    <p className="text-sm text-muted-foreground">רכישות</p>
                    <p className="text-xs font-medium text-green-500">{ecommerce.conversionRates?.purchaseRate}%</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-primary">{ecommerce.conversionRates?.overallConversionRate}%</p>
                    <p className="text-sm text-muted-foreground">המרה כללית</p>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4">תנועה יומית</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="sessions" stroke="#3b82f6" fill="url(#colorSessions)" name="סשנים" />
                      <Area type="monotone" dataKey="users" stroke="#a855f7" fill="url(#colorUsers)" name="משתמשים" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4">מקורות תנועה</h3>
                <div className="h-[300px]">
                  {trafficSources.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={trafficSources}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="sessions"
                          nameKey="source"
                          label={({ source, percentage }) => `${source}: ${percentage}%`}
                        >
                          {trafficSources.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      אין נתוני מקורות
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Devices & Countries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {devices.length > 0 && (
                <div className="glass rounded-xl p-6 card-shadow">
                  <h3 className="font-bold text-lg mb-4">מכשירים</h3>
                  <div className="space-y-3">
                    {devices.map((device: any, index: number) => (
                      <div key={index} className="flex items-center gap-4">
                        <span className="w-20 text-sm">{device.device}</span>
                        <div className="flex-1">
                          <Progress value={device.percentage} className="h-2" />
                        </div>
                        <span className="text-sm font-medium w-16 text-left">{device.percentage}%</span>
                        <span className="text-sm text-muted-foreground w-20 text-left">{formatNumber(device.sessions)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {countries.length > 0 && (
                <div className="glass rounded-xl p-6 card-shadow">
                  <h3 className="font-bold text-lg mb-4">מדינות</h3>
                  <div className="space-y-3">
                    {countries.slice(0, 6).map((country: any, index: number) => (
                      <div key={index} className="flex items-center gap-4">
                        <span className="w-24 text-sm truncate">{country.country}</span>
                        <div className="flex-1">
                          <Progress value={country.percentage} className="h-2" />
                        </div>
                        <span className="text-sm font-medium w-16 text-left">{country.percentage}%</span>
                        <span className="text-sm text-muted-foreground w-20 text-left">{formatNumber(country.sessions)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Top Pages */}
            {topPages.length > 0 && (
              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4">עמודים מובילים</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">עמוד</TableHead>
                        <TableHead className="text-left">צפיות</TableHead>
                        <TableHead className="text-left">זמן ממוצע</TableHead>
                        <TableHead className="text-left">שיעור נטישה</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPages.slice(0, 10).map((page: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium max-w-[300px] truncate">{page.path}</TableCell>
                          <TableCell>{formatNumber(page.pageviews)}</TableCell>
                          <TableCell>{page.avgDuration}</TableCell>
                          <TableCell>
                            <span className={cn(
                              page.bounceRate > 70 ? "text-red-500" : 
                              page.bounceRate > 50 ? "text-yellow-500" : "text-green-500"
                            )}>
                              {page.bounceRate.toFixed(1)}%
                            </span>
                          </TableCell>
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