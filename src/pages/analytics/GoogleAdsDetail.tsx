import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight,
  Target, 
  DollarSign, 
  MousePointerClick, 
  Eye, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  Download,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { GlobalDateFilter, getDateRangeFromFilter, type DateFilterValue } from "@/components/analytics/GlobalDateFilter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
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

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

function formatCurrency(num: number, currency = "ILS"): string {
  const symbol = currency === "USD" ? "$" : "₪";
  return symbol + formatNumber(num);
}

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6'];

export default function GoogleAdsDetail() {
  const navigate = useNavigate();
  const { selectedClient } = useClient();
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("30");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>();

  const dateRange = getDateRangeFromFilter(dateFilter, customDateRange);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["google-ads-detail", selectedClient?.id, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const { data: responseData, error } = await supabase.functions.invoke('google-ads', {
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

  const campaigns = data?.campaigns || [];
  const dailyData = data?.daily || [];
  const account = data?.account;

  const metrics = useMemo(() => {
    const totalImpressions = account?.totalImpressions || campaigns.reduce((sum: number, c: any) => sum + c.impressions, 0);
    const totalClicks = account?.totalClicks || campaigns.reduce((sum: number, c: any) => sum + c.clicks, 0);
    const totalCost = account?.totalCost || campaigns.reduce((sum: number, c: any) => sum + c.cost, 0);
    const totalConversions = account?.totalConversions || campaigns.reduce((sum: number, c: any) => sum + c.conversions, 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCpc = totalClicks > 0 ? totalCost / totalClicks : 0;
    const costPerConversion = totalConversions > 0 ? totalCost / totalConversions : 0;

    return { totalImpressions, totalClicks, totalCost, totalConversions, avgCtr, avgCpc, costPerConversion };
  }, [account, campaigns]);

  // Campaign breakdown for pie chart
  const campaignBreakdown = useMemo(() => {
    return campaigns.slice(0, 6).map((c: any) => ({
      name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
      value: c.cost,
    }));
  }, [campaigns]);

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
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/analytics')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <PageHeader 
              title="Google Ads - נתונים מפורטים"
              description={selectedClient.name}
            />
          </div>
          <div className="flex items-center gap-3">
            <GlobalDateFilter
              value={dateFilter}
              onChange={setDateFilter}
              customDateRange={customDateRange}
              onCustomDateChange={setCustomDateRange}
            />
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 ml-2" />
              ייצוא
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: "חשיפות", value: formatNumber(metrics.totalImpressions), icon: <Eye className="w-5 h-5" />, color: "bg-blue-500/20 text-blue-500" },
                { label: "קליקים", value: formatNumber(metrics.totalClicks), icon: <MousePointerClick className="w-5 h-5" />, color: "bg-green-500/20 text-green-500" },
                { label: "הוצאה", value: formatCurrency(metrics.totalCost), icon: <DollarSign className="w-5 h-5" />, color: "bg-orange-500/20 text-orange-500" },
                { label: "המרות", value: formatNumber(metrics.totalConversions), icon: <Target className="w-5 h-5" />, color: "bg-purple-500/20 text-purple-500" },
                { label: "CTR", value: `${metrics.avgCtr.toFixed(2)}%`, icon: <TrendingUp className="w-5 h-5" />, color: "bg-cyan-500/20 text-cyan-500" },
                { label: "CPC ממוצע", value: formatCurrency(metrics.avgCpc), icon: <DollarSign className="w-5 h-5" />, color: "bg-indigo-500/20 text-indigo-500" },
                { label: "עלות להמרה", value: formatCurrency(metrics.costPerConversion), icon: <Target className="w-5 h-5" />, color: "bg-pink-500/20 text-pink-500" },
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
              {/* Daily Performance Chart */}
              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4">ביצועים יומיים</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="clicks" stroke="#22c55e" fill="url(#colorClicks)" name="קליקים" />
                      <Area type="monotone" dataKey="cost" stroke="#f97316" fill="url(#colorCost)" name="הוצאה" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Campaign Breakdown Pie */}
              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4">חלוקת הוצאות לפי קמפיין</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={campaignBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {campaignBreakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Campaigns Table */}
            <div className="glass rounded-xl p-6 card-shadow">
              <h3 className="font-bold text-lg mb-4">קמפיינים ({campaigns.length})</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">שם קמפיין</TableHead>
                      <TableHead className="text-center">סטטוס</TableHead>
                      <TableHead className="text-left">חשיפות</TableHead>
                      <TableHead className="text-left">קליקים</TableHead>
                      <TableHead className="text-left">CTR</TableHead>
                      <TableHead className="text-left">הוצאה</TableHead>
                      <TableHead className="text-left">המרות</TableHead>
                      <TableHead className="text-left">עלות/המרה</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign: any) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{campaign.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={campaign.status === 'ENABLED' ? 'default' : 'secondary'}>
                            {campaign.status === 'ENABLED' ? 'פעיל' : campaign.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatNumber(campaign.impressions)}</TableCell>
                        <TableCell>{formatNumber(campaign.clicks)}</TableCell>
                        <TableCell>{campaign.ctr?.toFixed(2)}%</TableCell>
                        <TableCell>{formatCurrency(campaign.cost)}</TableCell>
                        <TableCell>{formatNumber(campaign.conversions)}</TableCell>
                        <TableCell>
                          {campaign.conversions > 0 
                            ? formatCurrency(campaign.cost / campaign.conversions) 
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
