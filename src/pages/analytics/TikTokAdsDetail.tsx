import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight,
  DollarSign, 
  MousePointer, 
  Eye, 
  Users, 
  RefreshCw,
  Loader2,
  Play,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
  TrendingUp,
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
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

function formatCurrency(num: number | undefined | null): string {
  return "₪" + formatNumber(num);
}

export default function TikTokAdsDetail() {
  const navigate = useNavigate();
  const { selectedClient } = useClient();
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("30");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>();

  const dateRange = getDateRangeFromFilter(dateFilter, customDateRange);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tiktok-ads-detail", selectedClient?.id, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const { data: responseData, error } = await supabase.functions.invoke('tiktok-ads', {
        body: { 
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

  const totals = data?.totals;
  const campaigns = data?.campaigns || [];
  const daily = data?.daily || [];

  const kpiCards = [
    { label: "הוצאות", value: formatCurrency(totals?.spend), icon: DollarSign, color: "text-red-500" },
    { label: "חשיפות", value: formatNumber(totals?.impressions), icon: Eye, color: "text-blue-500" },
    { label: "קליקים", value: formatNumber(totals?.clicks), icon: MousePointer, color: "text-green-500" },
    { label: "המרות", value: formatNumber(totals?.conversions), icon: TrendingUp, color: "text-purple-500" },
    { label: "צפיות בווידאו", value: formatNumber(totals?.videoViews), icon: Play, color: "text-pink-500" },
    { label: "חשיפה (Reach)", value: formatNumber(totals?.reach), icon: Users, color: "text-orange-500" },
    { label: "CTR", value: (totals?.ctr || 0).toFixed(2) + "%", icon: MousePointer, color: "text-teal-500" },
    { label: "CPC", value: formatCurrency(totals?.cpc), icon: DollarSign, color: "text-amber-500" },
  ];

  const engagementCards = [
    { label: "לייקים", value: formatNumber(totals?.likes), icon: Heart },
    { label: "תגובות", value: formatNumber(totals?.comments), icon: MessageCircle },
    { label: "שיתופים", value: formatNumber(totals?.shares), icon: Share2 },
    { label: "עוקבים חדשים", value: formatNumber(totals?.follows), icon: UserPlus },
  ];

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/analytics")}>
              <ArrowRight className="w-4 h-4 ml-1" />
              חזרה
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#000000] flex items-center justify-center">
                <span className="text-white text-lg font-bold">♪</span>
              </div>
              <PageHeader title="TikTok Ads" description="ניתוח קמפיינים ומעורבות" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AnalyticsPlatformNav />
            <GlobalDateFilter value={dateFilter} onChange={setDateFilter} customDateRange={customDateRange} onCustomDateChange={setCustomDateRange} />
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 ml-1" />
              רענן
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : data?.error ? (
          <div className="text-center py-20">
            <p className="text-destructive mb-2">שגיאה בטעינת נתוני TikTok</p>
            <p className="text-sm text-muted-foreground">{data.details || data.error}</p>
          </div>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {kpiCards.map((kpi, i) => (
                <div key={kpi.label} className="bg-card border border-border rounded-xl p-4 opacity-0 animate-slide-up" style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "forwards" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className={cn("w-4 h-4", kpi.color)} />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Engagement */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {engagementCards.map((card, i) => (
                <div key={card.label} className="bg-card border border-border rounded-xl p-4 opacity-0 animate-slide-up" style={{ animationDelay: `${(i + 8) * 0.05}s`, animationFillMode: "forwards" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <card.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{card.label}</span>
                  </div>
                  <p className="text-xl font-bold">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Daily Chart */}
            {daily.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6 mb-8">
                <h3 className="font-bold mb-4">הוצאות יומיות</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={daily}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Area type="monotone" dataKey="spend" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" name="הוצאות" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Campaigns Table */}
            {campaigns.length > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold">קמפיינים ({campaigns.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">שם</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right">הוצאות</TableHead>
                        <TableHead className="text-right">חשיפות</TableHead>
                        <TableHead className="text-right">קליקים</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-right">המרות</TableHead>
                        <TableHead className="text-right">צפיות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === 'ENABLE' || c.status === 'CAMPAIGN_STATUS_ENABLE' ? 'default' : 'secondary'}>
                              {c.status === 'ENABLE' || c.status === 'CAMPAIGN_STATUS_ENABLE' ? 'פעיל' : 'מושהה'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(c.spend)}</TableCell>
                          <TableCell>{formatNumber(c.impressions)}</TableCell>
                          <TableCell>{formatNumber(c.clicks)}</TableCell>
                          <TableCell>{c.ctr?.toFixed(2)}%</TableCell>
                          <TableCell>{formatNumber(c.conversions)}</TableCell>
                          <TableCell>{formatNumber(c.videoViews)}</TableCell>
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
