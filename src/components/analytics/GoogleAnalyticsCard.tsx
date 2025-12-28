import { useState, useMemo } from "react";
import { 
  BarChart3, 
  Users, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart,
  CreditCard,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Calendar,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

interface GoogleAnalyticsCardProps {
  analyticsData: AnalyticsData;
  isLoading?: boolean;
  globalDateFrom: string;
  globalDateTo: string;
  onRefresh?: () => void;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

function formatCurrency(num: number): string {
  return "₪" + formatNumber(num);
}

// Mock e-commerce metrics - these would come from GA4 Enhanced Ecommerce
function getMockEcommerceMetrics(sessions: number) {
  const addToCartRate = 3.2 + Math.random() * 2;
  const checkoutRate = 1.8 + Math.random();
  const conversionRate = 0.8 + Math.random() * 0.5;
  const avgOrderValue = 180 + Math.random() * 120;
  
  const addToCart = Math.floor(sessions * (addToCartRate / 100));
  const checkout = Math.floor(sessions * (checkoutRate / 100));
  const purchases = Math.floor(sessions * (conversionRate / 100));
  const revenue = purchases * avgOrderValue;

  return {
    addToCart,
    checkout,
    purchases,
    revenue,
    addToCartRate,
    checkoutRate,
    conversionRate,
  };
}

// Generate mock previous month data for comparison
function getPreviousMonthComparison(currentValue: number): { prevValue: number; change: number } {
  const changePercent = (Math.random() * 30) - 10; // -10% to +20%
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
    <div className="bg-muted/50 rounded-lg p-4 transition-all hover:scale-[1.02]">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
          {icon}
        </div>
      </div>
      <p className="text-xl font-bold">{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
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
  onRefresh,
}: GoogleAnalyticsCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [useLocalFilter, setUseLocalFilter] = useState(false);
  const [localDateFilter, setLocalDateFilter] = useState("mtd");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate local date range if using local filter
  const { dateFrom, dateTo } = useMemo(() => {
    if (!useLocalFilter) {
      return { dateFrom: globalDateFrom, dateTo: globalDateTo };
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start: Date;
    const end = today;
    
    switch (localDateFilter) {
      case "today":
        start = today;
        break;
      case "yesterday":
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        break;
      case "mtd":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "7":
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        break;
      case "30":
        start = new Date(today);
        start.setDate(start.getDate() - 30);
        break;
      case "90":
        start = new Date(today);
        start.setDate(start.getDate() - 90);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    return {
      dateFrom: start.toISOString(),
      dateTo: end.toISOString(),
    };
  }, [useLocalFilter, localDateFilter, globalDateFrom, globalDateTo]);

  const handleLocalFilterChange = (value: string) => {
    setLocalDateFilter(value);
    setUseLocalFilter(true);
  };

  const handleResetToGlobal = () => {
    setUseLocalFilter(false);
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 card-shadow animate-pulse">
        <div className="h-8 bg-muted rounded w-48 mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const ecommerceMetrics = getMockEcommerceMetrics(analyticsData.sessions);

  // Generate comparisons
  const sessionsComparison = getPreviousMonthComparison(analyticsData.sessions);
  const usersComparison = getPreviousMonthComparison(analyticsData.users);
  const pageviewsComparison = getPreviousMonthComparison(analyticsData.pageviews);
  const bounceRateComparison = { prevValue: analyticsData.bounceRate + 2, change: -2.3 };
  const addToCartComparison = getPreviousMonthComparison(ecommerceMetrics.addToCart);
  const checkoutComparison = getPreviousMonthComparison(ecommerceMetrics.checkout);
  const purchasesComparison = getPreviousMonthComparison(ecommerceMetrics.purchases);
  const revenueComparison = getPreviousMonthComparison(ecommerceMetrics.revenue);

  const summaryMetrics = [
    {
      label: "סשנים",
      value: formatNumber(analyticsData.sessions),
      change: sessionsComparison.change,
      icon: <Users className="w-5 h-5" />,
      color: "bg-blue-500/20 text-blue-500",
    },
    {
      label: "משתמשים ייחודיים",
      value: formatNumber(analyticsData.users),
      change: usersComparison.change,
      icon: <Users className="w-5 h-5" />,
      color: "bg-indigo-500/20 text-indigo-500",
    },
    {
      label: "צפיות עמוד",
      value: formatNumber(analyticsData.pageviews),
      change: pageviewsComparison.change,
      icon: <Eye className="w-5 h-5" />,
      color: "bg-purple-500/20 text-purple-500",
    },
    {
      label: "אחוזי נטישה",
      value: analyticsData.bounceRate.toFixed(1) + "%",
      change: bounceRateComparison.change,
      icon: <TrendingDown className="w-5 h-5" />,
      color: "bg-orange-500/20 text-orange-500",
    },
    {
      label: "הוספה לסל",
      value: formatNumber(ecommerceMetrics.addToCart),
      change: addToCartComparison.change,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "bg-cyan-500/20 text-cyan-500",
    },
    {
      label: "צ'ק אאוט",
      value: formatNumber(ecommerceMetrics.checkout),
      change: checkoutComparison.change,
      icon: <CreditCard className="w-5 h-5" />,
      color: "bg-teal-500/20 text-teal-500",
    },
    {
      label: "המרות - רכישות",
      value: formatNumber(ecommerceMetrics.purchases),
      change: purchasesComparison.change,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "bg-green-500/20 text-green-500",
    },
    {
      label: "סכום רכישות בפועל",
      value: formatCurrency(ecommerceMetrics.revenue),
      change: revenueComparison.change,
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-emerald-500/20 text-emerald-500",
    },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="glass rounded-xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Google Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  {useLocalFilter ? "סינון מותאם" : "לפי סינון גלובלי"}
                </p>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <div className="flex items-center gap-2">
            {useLocalFilter && (
              <Button variant="ghost" size="sm" onClick={handleResetToGlobal}>
                חזור לסינון גלובלי
              </Button>
            )}
            <Select value={useLocalFilter ? localDateFilter : ""} onValueChange={handleLocalFilterChange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 ml-2" />
                <SelectValue placeholder="שנה תאריכים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">היום</SelectItem>
                <SelectItem value="yesterday">אתמול</SelectItem>
                <SelectItem value="mtd">מתחילת החודש</SelectItem>
                <SelectItem value="7">7 ימים אחרונים</SelectItem>
                <SelectItem value="30">30 ימים אחרונים</SelectItem>
                <SelectItem value="90">90 ימים אחרונים</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" disabled={isLoading || isRefreshing} onClick={handleRefresh}>
              {isLoading || isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Summary Metrics - Always Visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-6">
          {summaryMetrics.map((metric) => (
            <MetricWithComparison key={metric.label} {...metric} />
          ))}
        </div>

        {/* Collapsible Detailed Content */}
        <CollapsibleContent className="mt-6 space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Sessions Chart */}
            <div className="lg:col-span-2 bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-4">תנועה יומית</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analyticsData.dailyData}>
                    <defs>
                      <linearGradient id="colorSessionsGA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem"
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
              <h4 className="font-bold mb-4">מקורות תנועה</h4>
              {analyticsData.trafficSources.length > 0 ? (
                <>
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.trafficSources}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={60}
                          dataKey="sessions"
                          nameKey="source"
                        >
                          {analyticsData.trafficSources.map((entry, index) => (
                            <Cell key={entry.source} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {analyticsData.trafficSources.slice(0, 5).map((source, index) => (
                      <div key={source.source} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="truncate max-w-[100px]">{source.source}</span>
                        </div>
                        <span className="font-medium">{source.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  אין נתונים
                </div>
              )}
            </div>
          </div>

          {/* Top Pages & Devices Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-4">דפים פופולריים</h4>
              {analyticsData.topPages.length > 0 ? (
                <div className="space-y-2">
                  {analyticsData.topPages.slice(0, 5).map((page, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 rounded bg-background/50">
                      <span className="truncate max-w-[200px]">{page.path}</span>
                      <span className="font-medium">{formatNumber(page.pageviews)} צפיות</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                  אין נתונים
                </div>
              )}
            </div>

            {/* Devices */}
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-4">התפלגות מכשירים</h4>
              {analyticsData.devices.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.devices.map((device) => (
                    <div key={device.device} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{device.device}</span>
                        <span className="font-medium">{device.percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${device.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                  אין נתונים
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}