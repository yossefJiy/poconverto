import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { he } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Calendar,
  Target,
  DollarSign,
  MousePointer,
  Eye,
  Loader2,
  ChartLine,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  ShoppingCart,
  ListTodo,
  Users,
  FileText,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AIInsightsChat } from "@/components/ai/AIInsightsChat";

type TimeRange = "7d" | "30d" | "90d" | "12m";

const timeRangeOptions = [
  { value: "7d", label: "7 ימים" },
  { value: "30d", label: "30 ימים" },
  { value: "90d", label: "90 ימים" },
  { value: "12m", label: "12 חודשים" },
];

const metricConfig = {
  impressions: { label: "חשיפות", icon: Eye, color: "#8b5cf6", format: (v: number) => v.toLocaleString() },
  clicks: { label: "קליקים", icon: MousePointer, color: "#3b82f6", format: (v: number) => v.toLocaleString() },
  conversions: { label: "המרות", icon: Target, color: "#10b981", format: (v: number) => v.toLocaleString() },
  spend: { label: "הוצאה", icon: DollarSign, color: "#f59e0b", format: (v: number) => `₪${v.toLocaleString()}` },
  ctr: { label: "CTR", icon: ChartLine, color: "#ec4899", format: (v: number) => `${v.toFixed(2)}%` },
  cpc: { label: "CPC", icon: Activity, color: "#6366f1", format: (v: number) => `₪${v.toFixed(2)}` },
};

export default function ClientInsights() {
  const { selectedClient } = useClient();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedMetric, setSelectedMetric] = useState<keyof typeof metricConfig>("impressions");

  // Calculate date range
  const dateRange = useMemo(() => {
    const end = new Date();
    let start: Date;
    
    switch (timeRange) {
      case "7d":
        start = subDays(end, 7);
        break;
      case "30d":
        start = subDays(end, 30);
        break;
      case "90d":
        start = subDays(end, 90);
        break;
      case "12m":
        start = subMonths(end, 12);
        break;
      default:
        start = subDays(end, 30);
    }
    
    return { start, end };
  }, [timeRange]);

  // Fetch performance history
  const { data: performanceHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["client-performance-history", selectedClient?.id, timeRange],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      const { data, error } = await supabase
        .from("client_performance_history")
        .select("*")
        .eq("client_id", selectedClient.id)
        .gte("recorded_at", dateRange.start.toISOString())
        .lte("recorded_at", dateRange.end.toISOString())
        .order("recorded_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClient,
  });

  // Fetch analytics snapshots
  const { data: snapshots = [], isLoading: snapshotsLoading } = useQuery({
    queryKey: ["analytics-snapshots", selectedClient?.id, timeRange],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      const { data, error } = await supabase
        .from("analytics_snapshots")
        .select("*")
        .eq("client_id", selectedClient.id)
        .gte("snapshot_date", format(dateRange.start, "yyyy-MM-dd"))
        .lte("snapshot_date", format(dateRange.end, "yyyy-MM-dd"))
        .order("snapshot_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClient,
  });

  // Fetch client insights (including AI agent insights)
  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ["client-insights", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      
      const { data, error } = await supabase
        .from("client_insights")
        .select("*")
        .eq("client_id", selectedClient.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClient,
  });

  // Separate agent insights from other insights
  const agentInsights = insights.filter(i => i.insight_type.startsWith("agent_"));
  const otherInsights = insights.filter(i => !i.insight_type.startsWith("agent_"));

  // Module config for displaying agent insights
  const agentModuleConfig: Record<string, { icon: any; label: string; color: string; bgColor: string }> = {
    agent_marketing: { icon: Target, label: "שיווק ופרסום", color: "text-blue-500", bgColor: "bg-blue-500/10" },
    agent_analytics: { icon: BarChart3, label: "אנליטיקס", color: "text-green-500", bgColor: "bg-green-500/10" },
    agent_ecommerce: { icon: ShoppingCart, label: "איקומרס", color: "text-orange-500", bgColor: "bg-orange-500/10" },
    agent_tasks: { icon: ListTodo, label: "משימות", color: "text-purple-500", bgColor: "bg-purple-500/10" },
    agent_campaigns: { icon: TrendingUp, label: "קמפיינים", color: "text-pink-500", bgColor: "bg-pink-500/10" },
    agent_team: { icon: Users, label: "צוות", color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
    agent_reports: { icon: FileText, label: "דוחות", color: "text-amber-500", bgColor: "bg-amber-500/10" },
    agent_insights: { icon: Lightbulb, label: "תובנות", color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  };

  // Process chart data from snapshots - prioritize real data
  const chartData = useMemo(() => {
    if (!snapshots.length) {
      // No real data - show empty state instead of demo data
      return [];
    }

    // Group by date and aggregate metrics from all platforms
    const grouped = snapshots.reduce((acc: any, snapshot) => {
      const date = snapshot.snapshot_date;
      if (!acc[date]) {
        acc[date] = {
          date,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          revenue: 0,
          orders: 0,
          sessions: 0,
        };
      }
      
      const metrics = snapshot.metrics as any;
      const data = snapshot.data as any;
      
      // Aggregate based on platform
      if (snapshot.platform === 'google_ads' || snapshot.platform === 'facebook_ads') {
        acc[date].impressions += metrics?.total_impressions || metrics?.impressions || 0;
        acc[date].clicks += metrics?.total_clicks || metrics?.clicks || 0;
        acc[date].conversions += metrics?.total_conversions || metrics?.conversions || 0;
        acc[date].spend += metrics?.total_spent || metrics?.spend || 0;
      } else if (snapshot.platform === 'shopify' || snapshot.platform === 'woocommerce') {
        acc[date].revenue += data?.total_revenue || metrics?.total_revenue || 0;
        acc[date].orders += data?.orders_count || metrics?.orders_count || data?.orders || 0;
      } else if (snapshot.platform === 'google_analytics') {
        acc[date].sessions += metrics?.sessions || 0;
      }
      
      return acc;
    }, {});

    return Object.values(grouped).map((item: any) => ({
      ...item,
      ctr: item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0,
      cpc: item.clicks > 0 ? item.spend / item.clicks : 0,
      label: format(new Date(item.date), "dd/MM", { locale: he }),
    })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [snapshots]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!chartData.length) return null;

    const current = chartData.slice(-Math.ceil(chartData.length / 2));
    const previous = chartData.slice(0, Math.ceil(chartData.length / 2));

    const sum = (arr: any[], key: string) => arr.reduce((acc, item) => acc + (item[key] || 0), 0);
    const avg = (arr: any[], key: string) => sum(arr, key) / arr.length;

    return {
      impressions: { current: sum(current, "impressions"), previous: sum(previous, "impressions") },
      clicks: { current: sum(current, "clicks"), previous: sum(previous, "clicks") },
      conversions: { current: sum(current, "conversions"), previous: sum(previous, "conversions") },
      spend: { current: sum(current, "spend"), previous: sum(previous, "spend") },
      ctr: { current: avg(current, "ctr"), previous: avg(previous, "ctr") },
      cpc: { current: avg(current, "cpc"), previous: avg(previous, "cpc") },
    };
  }, [chartData]);

  const isLoading = historyLoading || snapshotsLoading || insightsLoading;

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="w-4 h-4 text-success" />;
    if (change < 0) return <ArrowDownRight className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6">
        <PageHeader
          title="תובנות היסטוריות"
          description="ניתוח מגמות ביצועים לאורך זמן"
          actions={
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-32">
                  <Calendar className="w-4 h-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRangeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !selectedClient ? (
          <div className="glass rounded-xl p-12 text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח</h3>
            <p className="text-muted-foreground">בחר לקוח כדי לצפות בתובנות היסטוריות</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(metricConfig).map(([key, config]) => {
                const metrics = summaryMetrics?.[key as keyof typeof summaryMetrics];
                const change = metrics ? getChangePercentage(metrics.current, metrics.previous) : 0;
                const MetricIcon = config.icon;
                
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedMetric(key as keyof typeof metricConfig)}
                    className={cn(
                      "glass rounded-xl p-4 text-right transition-all",
                      selectedMetric === key 
                        ? "ring-2 ring-primary border-primary" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <MetricIcon className="w-4 h-4" style={{ color: config.color }} />
                      </div>
                      {getTrendIcon(change)}
                    </div>
                    <p className="text-2xl font-bold mb-1">
                      {metrics ? config.format(metrics.current) : "-"}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{config.label}</span>
                      <span className={cn(
                        "text-xs",
                        change > 0 ? "text-success" : change < 0 ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {change > 0 ? "+" : ""}{change.toFixed(1)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main Chart */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ChartLine className="w-5 h-5 text-primary" />
                  מגמת {metricConfig[selectedMetric].label}
                </h3>
                <Badge variant="secondary">
                  {timeRangeOptions.find(t => t.value === timeRange)?.label}
                </Badge>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={metricConfig[selectedMetric].color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={metricConfig[selectedMetric].color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [
                        metricConfig[selectedMetric].format(value),
                        metricConfig[selectedMetric].label
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke={metricConfig[selectedMetric].color}
                      fillOpacity={1}
                      fill="url(#colorMetric)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  השוואת ביצועים
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="label" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="clicks" fill="#3b82f6" name="קליקים" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="conversions" fill="#10b981" name="המרות" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  יעילות
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="label" className="text-xs" />
                      <YAxis className="text-xs" yAxisId="left" />
                      <YAxis className="text-xs" yAxisId="right" orientation="right" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="ctr" 
                        stroke="#ec4899" 
                        name="CTR (%)" 
                        dot={false}
                        strokeWidth={2}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="cpc" 
                        stroke="#6366f1" 
                        name="CPC (₪)" 
                        dot={false}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* AI Agent Insights - Central Hub */}
            {agentInsights.length > 0 && (
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    תובנות מצטברות מהסוכנים
                  </h3>
                  <Badge variant="secondary">{agentInsights.length} סוכנים</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agentInsights.map((insight) => {
                    const config = agentModuleConfig[insight.insight_type] || {
                      icon: Brain,
                      label: insight.insight_type.replace("agent_", ""),
                      color: "text-primary",
                      bgColor: "bg-primary/10",
                    };
                    const AgentIcon = config.icon;
                    const insightData = insight.insights as { summary?: string; updatedAt?: string; createdAt?: string } | null;
                    
                    return (
                      <div key={insight.id} className={cn("p-4 rounded-xl border border-border", config.bgColor)}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-background/50", config.color)}>
                            <AgentIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold">סוכן {config.label}</h4>
                            <p className="text-xs text-muted-foreground">
                              עודכן: {format(new Date(insight.period_end), "dd/MM/yyyy", { locale: he })}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                          {insightData?.summary || "אין תובנות זמינות"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No agent insights yet */}
            {agentInsights.length === 0 && (
              <div className="glass rounded-xl p-8 text-center">
                <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">אין תובנות מצטברות עדיין</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  התחל שיחות עם הסוכנים השונים ושמור את התובנות כדי שיופיעו כאן
                </p>
                <Button variant="outline" onClick={() => window.location.href = "/ai-agents"}>
                  <Brain className="w-4 h-4 ml-2" />
                  עבור לסוכנים
                </Button>
              </div>
            )}

            {/* Other AI Insights */}
            {otherInsights.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  תובנות נוספות
                </h3>
                <div className="space-y-3">
                  {otherInsights.map((insight) => (
                    <div key={insight.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{insight.insight_type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(insight.created_at), "dd/MM/yyyy", { locale: he })}
                        </span>
                      </div>
                      {insight.recommendations && (
                        <ul className="space-y-1">
                          {(insight.recommendations as string[]).map((rec, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* AI Insights Chat Agent */}
        <AIInsightsChat 
          performanceData={chartData}
          campaignsData={[]}
          insightsData={insights}
        />
      </div>
    </MainLayout>
  );
}

// Generate demo data for visualization
function generateDemoData(timeRange: TimeRange) {
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
  const data = [];
  
  for (let i = days; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const baseImpressions = 1000 + Math.random() * 2000;
    const clicks = baseImpressions * (0.02 + Math.random() * 0.03);
    const conversions = clicks * (0.05 + Math.random() * 0.1);
    const spend = clicks * (2 + Math.random() * 3);
    
    data.push({
      date: format(date, "yyyy-MM-dd"),
      label: format(date, "dd/MM", { locale: he }),
      impressions: Math.round(baseImpressions),
      clicks: Math.round(clicks),
      conversions: Math.round(conversions),
      spend: Math.round(spend),
      ctr: (clicks / baseImpressions) * 100,
      cpc: spend / clicks,
    });
  }
  
  return data;
}
