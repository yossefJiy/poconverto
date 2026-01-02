import { useState } from "react";
import { 
  BarChart3, 
  Users, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface EcommerceData {
  addToCarts: number;
  checkouts: number;
  purchases: number;
  purchaseRevenue: number;
  transactions: number;
  sessions: number;
  conversionRates: {
    addToCartRate: string;
    checkoutRate: string;
    purchaseRate: string;
    overallConversionRate: string;
  };
}

interface AnalyticsData {
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: string;
  trafficSources: Array<{ source: string; sessions: number; users: number; percentage: number }>;
  topPages: Array<{ path: string; pageviews: number; avgDuration: string; bounceRate: number }>;
  devices: Array<{ device: string; sessions: number; users: number; percentage: number }>;
  countries: Array<{ country: string; sessions: number; users: number; percentage: number }>;
  dailyData: Array<{ date: string; sessions: number; users: number; pageviews: number; bounceRate: number; avgDuration: number }>;
  ecommerce?: EcommerceData;
}

interface GoogleAnalyticsCardProps {
  analyticsData: AnalyticsData;
  isLoading?: boolean;
  globalDateFrom: string;
  globalDateTo: string;
}

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

// Generate mock previous month data for comparison
function getPreviousMonthComparison(currentValue: number): { prevValue: number; change: number } {
  const changePercent = (Math.random() * 30) - 10;
  const prevValue = currentValue / (1 + changePercent / 100);
  return {
    prevValue: Math.floor(prevValue),
    change: parseFloat(changePercent.toFixed(1)),
  };
}

interface MetricWithComparisonProps {
  label: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

function MetricWithComparison({ label, value, change, icon, color }: MetricWithComparisonProps) {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-muted/50 rounded-lg p-3 transition-all hover:bg-muted/70">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", color)}>
          {icon}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold">{value}</p>
        <span className={cn(
          "text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5",
          isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? "+" : ""}{change}%
        </span>
      </div>
    </div>
  );
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function GoogleAnalyticsCard({ 
  analyticsData, 
  isLoading,
  globalDateFrom,
  globalDateTo,
}: GoogleAnalyticsCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4 card-shadow animate-pulse">
        <div className="h-6 bg-muted rounded w-36 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // Generate comparisons
  const sessionsComparison = getPreviousMonthComparison(analyticsData.sessions);
  const usersComparison = getPreviousMonthComparison(analyticsData.users);
  const pageviewsComparison = getPreviousMonthComparison(analyticsData.pageviews);
  const bounceRateComparison = { prevValue: analyticsData.bounceRate + 2, change: -2.3 };

  const summaryMetrics = [
    {
      label: "סשנים",
      value: formatNumber(analyticsData.sessions),
      change: sessionsComparison.change,
      icon: <Users className="w-4 h-4" />,
      color: "bg-blue-500/20 text-blue-500",
    },
    {
      label: "משתמשים",
      value: formatNumber(analyticsData.users),
      change: usersComparison.change,
      icon: <Users className="w-4 h-4" />,
      color: "bg-indigo-500/20 text-indigo-500",
    },
    {
      label: "צפיות",
      value: formatNumber(analyticsData.pageviews),
      change: pageviewsComparison.change,
      icon: <Eye className="w-4 h-4" />,
      color: "bg-purple-500/20 text-purple-500",
    },
    {
      label: "נטישה",
      value: analyticsData.bounceRate.toFixed(1) + "%",
      change: bounceRateComparison.change,
      icon: <TrendingDown className="w-4 h-4" />,
      color: "bg-orange-500/20 text-orange-500",
    },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="glass rounded-xl p-4 card-shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="font-bold">Google Analytics</h3>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* Summary Metrics - Always Visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryMetrics.map((metric) => (
            <MetricWithComparison key={metric.label} {...metric} />
          ))}
        </div>

        {/* Collapsible Detailed Content */}
        <CollapsibleContent className="mt-4 space-y-4">
          {/* E-commerce Funnel */}
          {analyticsData.ecommerce && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-3 text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                משפך E-commerce
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-500">
                    {formatNumber(analyticsData.ecommerce.addToCarts)}
                  </p>
                  <p className="text-xs text-muted-foreground">הוספות לסל</p>
                  <p className="text-xs font-medium text-green-500">
                    {analyticsData.ecommerce.conversionRates.addToCartRate}%
                  </p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-yellow-500">
                    {formatNumber(analyticsData.ecommerce.checkouts)}
                  </p>
                  <p className="text-xs text-muted-foreground">התחלת תשלום</p>
                  <p className="text-xs font-medium text-green-500">
                    {analyticsData.ecommerce.conversionRates.checkoutRate}%
                  </p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-green-500">
                    {formatNumber(analyticsData.ecommerce.purchases)}
                  </p>
                  <p className="text-xs text-muted-foreground">רכישות</p>
                  <p className="text-xs font-medium text-green-500">
                    {analyticsData.ecommerce.conversionRates.purchaseRate}%
                  </p>
                </div>
                <div className="bg-background/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-primary">
                    {analyticsData.ecommerce.conversionRates.overallConversionRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">המרה כללית</p>
                </div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Daily Sessions Chart */}
            <div className="lg:col-span-2 bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-3 text-sm">תנועה יומית</h4>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.dailyData}>
                    <defs>
                      <linearGradient id="colorSessionsGA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "12px"
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sessions" 
                      stroke="hsl(var(--primary))" 
                      fill="url(#colorSessionsGA)" 
                      strokeWidth={2}
                      name="סשנים"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="hsl(var(--accent))" 
                      fill="transparent" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="משתמשים"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Traffic Sources */}
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-3 text-sm">מקורות תנועה</h4>
              {analyticsData.trafficSources.length > 0 ? (
                <>
                  <div className="h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.trafficSources}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={45}
                          paddingAngle={2}
                          dataKey="sessions"
                          nameKey="source"
                        >
                          {analyticsData.trafficSources.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 space-y-1">
                    {analyticsData.trafficSources.slice(0, 3).map((source, index) => (
                      <div key={source.source} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                          />
                          <span className="truncate max-w-[80px]">{source.source}</span>
                        </div>
                        <span className="text-muted-foreground">{source.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">אין נתונים</p>
              )}
            </div>
          </div>

          {/* Top Pages */}
          {analyticsData.topPages.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-3 text-sm">עמודים מובילים</h4>
              <div className="space-y-2">
                {analyticsData.topPages.slice(0, 5).map((page, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[200px] text-muted-foreground">{page.path}</span>
                    <div className="flex items-center gap-4">
                      <span>{formatNumber(page.pageviews)} צפיות</span>
                      <span className="text-muted-foreground">{page.avgDuration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
