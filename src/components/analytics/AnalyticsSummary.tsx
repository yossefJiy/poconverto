import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  MousePointer, 
  DollarSign,
  ShoppingCart,
  Target,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryMetric {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
}

interface AnalyticsSummaryProps {
  websiteData: {
    sessions: number;
    users: number;
    pageviews: number;
    bounceRate: number;
  };
  adsData: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    cpc: number;
  };
  isLoading?: boolean;
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

export function AnalyticsSummary({ websiteData, adsData, isLoading }: AnalyticsSummaryProps) {
  // Calculate cross-platform metrics
  const costPerSession = websiteData.sessions > 0 
    ? (adsData.spend / websiteData.sessions).toFixed(2) 
    : "0";
  const conversionRate = websiteData.sessions > 0 
    ? ((adsData.conversions / websiteData.sessions) * 100).toFixed(2) 
    : "0";
  const roas = adsData.spend > 0 
    ? ((adsData.conversions * 150) / adsData.spend).toFixed(2) // Assuming avg order value
    : "0";

  const websiteMetrics: SummaryMetric[] = [
    {
      label: "סשנים",
      value: formatNumber(websiteData.sessions),
      icon: <Users className="w-5 h-5" />,
      color: "bg-blue-500/20 text-blue-500"
    },
    {
      label: "משתמשים ייחודיים",
      value: formatNumber(websiteData.users),
      icon: <Users className="w-5 h-5" />,
      color: "bg-indigo-500/20 text-indigo-500"
    },
    {
      label: "צפיות עמוד",
      value: formatNumber(websiteData.pageviews),
      icon: <Eye className="w-5 h-5" />,
      color: "bg-purple-500/20 text-purple-500"
    },
    {
      label: "Bounce Rate",
      value: websiteData.bounceRate.toFixed(1) + "%",
      icon: <TrendingDown className="w-5 h-5" />,
      color: "bg-orange-500/20 text-orange-500"
    },
  ];

  const adsMetrics: SummaryMetric[] = [
    {
      label: "הוצאות פרסום",
      value: formatCurrency(adsData.spend),
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-green-500/20 text-green-500"
    },
    {
      label: "חשיפות",
      value: formatNumber(adsData.impressions),
      icon: <Eye className="w-5 h-5" />,
      color: "bg-cyan-500/20 text-cyan-500"
    },
    {
      label: "קליקים",
      value: formatNumber(adsData.clicks),
      icon: <MousePointer className="w-5 h-5" />,
      color: "bg-blue-500/20 text-blue-500"
    },
    {
      label: "CTR",
      value: adsData.ctr.toFixed(2) + "%",
      icon: <Target className="w-5 h-5" />,
      color: "bg-teal-500/20 text-teal-500"
    },
  ];

  const crossMetrics: SummaryMetric[] = [
    {
      label: "המרות",
      value: formatNumber(adsData.conversions),
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "bg-emerald-500/20 text-emerald-500"
    },
    {
      label: "עלות לסשן",
      value: "₪" + costPerSession,
      icon: <BarChart3 className="w-5 h-5" />,
      color: "bg-amber-500/20 text-amber-500"
    },
    {
      label: "אחוז המרה",
      value: conversionRate + "%",
      icon: <Target className="w-5 h-5" />,
      color: "bg-rose-500/20 text-rose-500"
    },
    {
      label: "ROAS",
      value: roas + "x",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "bg-violet-500/20 text-violet-500"
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-xl"></div>
        <div className="h-32 bg-muted rounded-xl"></div>
        <div className="h-32 bg-muted rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Website Analytics */}
      <div className="glass rounded-xl p-6 card-shadow">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="font-bold text-lg">תנועה באתר (Google Analytics)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {websiteMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </div>

      {/* Ads Performance */}
      <div className="glass rounded-xl p-6 card-shadow">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-green-500" />
          </div>
          <h3 className="font-bold text-lg">ביצועי פרסום</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {adsMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </div>

      {/* Cross-Platform Insights */}
      <div className="glass rounded-xl p-6 card-shadow border-2 border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-bold text-lg">הצלבת נתונים - אתר מול פרסום</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {crossMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} highlight />
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ metric, highlight }: { metric: SummaryMetric; highlight?: boolean }) {
  return (
    <div className={cn(
      "rounded-lg p-4 transition-all hover:scale-[1.02]",
      highlight ? "bg-primary/10 border border-primary/30" : "bg-muted/50"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", metric.color)}>
          {metric.icon}
        </div>
        {metric.change !== undefined && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            metric.change >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
          )}>
            {metric.change >= 0 ? "+" : ""}{metric.change}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{metric.value}</p>
      <p className="text-sm text-muted-foreground">{metric.label}</p>
    </div>
  );
}
