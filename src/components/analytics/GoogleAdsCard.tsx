import { useState, useEffect } from "react";
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  MousePointerClick,
  Eye,
  ChevronDown,
  ChevronUp,
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
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
  BarChart,
  Bar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  status: string;
  channelType: string;
  budget: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  avgCpc: number;
}

interface DailyData {
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
}

interface AccountData {
  id: string;
  name: string;
  currency: string;
  totalImpressions: number;
  totalClicks: number;
  totalCost: number;
  totalConversions: number;
  totalConversionValue: number;
}

interface GoogleAdsData {
  campaigns: Campaign[];
  daily: DailyData[];
  account: AccountData | null;
  adGroups: any[];
  keywords: any[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface GoogleAdsIntegration {
  id: string;
  settings: {
    customer_id?: string;
    login_customer_id?: string;
  } | null;
}

interface GoogleAdsCardProps {
  globalDateFrom: string;
  globalDateTo: string;
  onRefresh?: () => void;
  integration?: GoogleAdsIntegration;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

function formatCurrency(num: number, currency = "ILS"): string {
  const symbol = currency === "USD" ? "$" : "₪";
  return symbol + formatNumber(num);
}

interface MetricWithComparisonProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

function MetricWithComparison({ label, value, change, icon, color }: MetricWithComparisonProps) {
  const isPositive = change !== undefined && change >= 0;
  
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
        {change !== undefined && (
          <span className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5",
            isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? "+" : ""}{change}%
          </span>
        )}
      </div>
    </div>
  );
}

export function GoogleAdsCard({ 
  globalDateFrom,
  globalDateTo,
  onRefresh,
  integration,
}: GoogleAdsCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [useLocalFilter, setUseLocalFilter] = useState(false);
  const [localDateFilter, setLocalDateFilter] = useState("mtd");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GoogleAdsData | null>(null);

  const fetchGoogleAdsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const startDate = useLocalFilter 
        ? getLocalStartDate(localDateFilter) 
        : globalDateFrom.split('T')[0];
      const endDate = useLocalFilter 
        ? new Date().toISOString().split('T')[0] 
        : globalDateTo.split('T')[0];

      // Get customer ID from integration settings or use env fallback
      const customerId = (integration?.settings as any)?.customer_id;
      const loginCustomerId = (integration?.settings as any)?.login_customer_id;

      const { data: responseData, error: functionError } = await supabase.functions.invoke('google-ads', {
        body: { 
          startDate, 
          endDate,
          customerId,
          loginCustomerId
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to fetch Google Ads data');
      }

      if (responseData?.error) {
        throw new Error(responseData.error);
      }

      setData(responseData);
    } catch (err) {
      console.error('[GoogleAdsCard] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalStartDate = (filter: string): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start: Date;
    
    switch (filter) {
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
    
    return start.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchGoogleAdsData();
  }, [globalDateFrom, globalDateTo, useLocalFilter, localDateFilter, integration?.id]);

  const handleLocalFilterChange = (value: string) => {
    setLocalDateFilter(value);
    setUseLocalFilter(true);
  };

  const handleResetToGlobal = () => {
    setUseLocalFilter(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGoogleAdsData();
    setIsRefreshing(false);
    if (onRefresh) onRefresh();
  };

  if (isLoading && !data) {
    return (
      <div className="glass rounded-xl p-6 card-shadow animate-pulse">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-orange-500" />
          </div>
          <div className="h-6 bg-muted rounded w-32"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-xl p-6 card-shadow">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-orange-500" />
          </div>
          <h3 className="font-bold text-lg">Google Ads</h3>
        </div>
        <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">שגיאה בטעינת נתונים</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="mr-auto">
            <RefreshCw className="w-4 h-4 ml-2" />
            נסה שוב
          </Button>
        </div>
      </div>
    );
  }

  const account = data?.account;
  const campaigns = data?.campaigns || [];
  const dailyData = data?.daily || [];

  // Calculate summary metrics
  const totalImpressions = account?.totalImpressions || campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = account?.totalClicks || campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalCost = account?.totalCost || campaigns.reduce((sum, c) => sum + c.cost, 0);
  const totalConversions = account?.totalConversions || campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalCost / totalClicks : 0;
  const costPerConversion = totalConversions > 0 ? totalCost / totalConversions : 0;

  const summaryMetrics = [
    {
      label: "חשיפות",
      value: formatNumber(totalImpressions),
      icon: <Eye className="w-5 h-5" />,
      color: "bg-blue-500/20 text-blue-500",
    },
    {
      label: "קליקים",
      value: formatNumber(totalClicks),
      icon: <MousePointerClick className="w-5 h-5" />,
      color: "bg-green-500/20 text-green-500",
    },
    {
      label: "הוצאה",
      value: formatCurrency(totalCost, account?.currency),
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-orange-500/20 text-orange-500",
    },
    {
      label: "המרות",
      value: formatNumber(totalConversions),
      icon: <Target className="w-5 h-5" />,
      color: "bg-purple-500/20 text-purple-500",
    },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="glass rounded-xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Google Ads</h3>
                <p className="text-sm text-muted-foreground">
                  {account?.name || (useLocalFilter ? "סינון מותאם" : "לפי סינון גלובלי")}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {summaryMetrics.map((metric) => (
            <MetricWithComparison key={metric.label} {...metric} />
          ))}
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-lg font-bold">{avgCtr.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">CTR</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-lg font-bold">{formatCurrency(avgCpc, account?.currency)}</p>
            <p className="text-xs text-muted-foreground">CPC ממוצע</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-lg font-bold">{formatCurrency(costPerConversion, account?.currency)}</p>
            <p className="text-xs text-muted-foreground">עלות להמרה</p>
          </div>
        </div>

        {/* Collapsible Detailed Content */}
        <CollapsibleContent className="mt-6 space-y-6">
          {/* Daily Performance Chart */}
          {dailyData.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-4">ביצועים יומיים</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorClicksAds" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCostAds" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem"
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === "cost") return [formatCurrency(value), "הוצאה"];
                        if (name === "clicks") return [formatNumber(value), "קליקים"];
                        return [value, name];
                      }}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="#22c55e" 
                      fill="url(#colorClicksAds)" 
                      strokeWidth={2}
                      name="clicks"
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#f97316" 
                      fill="url(#colorCostAds)" 
                      strokeWidth={2}
                      name="cost"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Campaigns Table */}
          {campaigns.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-4">קמפיינים ({campaigns.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-2 px-3">קמפיין</th>
                      <th className="text-right py-2 px-3">סטטוס</th>
                      <th className="text-right py-2 px-3">חשיפות</th>
                      <th className="text-right py-2 px-3">קליקים</th>
                      <th className="text-right py-2 px-3">CTR</th>
                      <th className="text-right py-2 px-3">הוצאה</th>
                      <th className="text-right py-2 px-3">המרות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.slice(0, 10).map((campaign) => (
                      <tr key={campaign.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 px-3 font-medium">{campaign.name}</td>
                        <td className="py-2 px-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs",
                            campaign.status === "ENABLED" 
                              ? "bg-green-500/20 text-green-500" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {campaign.status === "ENABLED" ? "פעיל" : campaign.status}
                          </span>
                        </td>
                        <td className="py-2 px-3">{formatNumber(campaign.impressions)}</td>
                        <td className="py-2 px-3">{formatNumber(campaign.clicks)}</td>
                        <td className="py-2 px-3">{campaign.ctr.toFixed(2)}%</td>
                        <td className="py-2 px-3">{formatCurrency(campaign.cost, account?.currency)}</td>
                        <td className="py-2 px-3">{campaign.conversions.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Campaign Performance Bar Chart */}
          {campaigns.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-4">השוואת קמפיינים - הוצאה</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={campaigns.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10}
                      width={100}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem"
                      }}
                      formatter={(value: number) => [formatCurrency(value), "הוצאה"]}
                    />
                    <Bar dataKey="cost" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
