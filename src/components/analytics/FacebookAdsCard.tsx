import { useState, useMemo } from "react";
import { 
  DollarSign,
  MousePointerClick,
  Eye,
  ChevronDown,
  ChevronUp,
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
  Plus,
  Plug,
  Clock,
  Users,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isAuthError } from "@/lib/authError";
import { useNavigate } from "react-router-dom";
import { useAnalyticsSnapshot, formatSnapshotDate } from "@/hooks/useAnalyticsSnapshot";
import { MetricWithComparison } from "./MetricWithComparison";
import { formatNumber, formatCurrency, formatPercentage } from "@/lib/analytics/formatters";

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  budget: number;
  impressions: number;
  clicks: number;
  cost: number;
  reach: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  cpc: number;
}

interface DailyData {
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  reach: number;
  conversions: number;
  ctr: number;
}

interface FacebookAdsData {
  campaigns: Campaign[];
  daily: DailyData[];
  totals: {
    impressions: number;
    clicks: number;
    cost: number;
    reach: number;
    conversions: number;
    conversionValue: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface FacebookAdsCardProps {
  globalDateFrom: string;
  globalDateTo: string;
  clientId?: string;
  adAccountId?: string;
  isAdmin?: boolean;
  onAddIntegration?: () => void;
  onRefresh?: () => void;
}

// formatNumber and formatCurrency imported from shared module
// MetricWithComparison imported from shared component

const COLORS = ['#1877F2', '#42B72A', '#F7B928', '#E4405F', '#833AB4'];

export function FacebookAdsCard({ 
  globalDateFrom,
  globalDateTo,
  clientId,
  adAccountId,
  isAdmin = false,
  onAddIntegration,
  onRefresh,
}: FacebookAdsCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [useLocalFilter, setUseLocalFilter] = useState(false);
  const [localDateFilter, setLocalDateFilter] = useState("mtd");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

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

  const effectiveDates = useMemo(() => {
    if (useLocalFilter) {
      return {
        startDate: getLocalStartDate(localDateFilter),
        endDate: new Date().toISOString().split('T')[0],
      };
    }
    return {
      startDate: globalDateFrom.split('T')[0],
      endDate: globalDateTo.split('T')[0],
    };
  }, [useLocalFilter, localDateFilter, globalDateFrom, globalDateTo]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["facebook-ads", clientId, adAccountId, effectiveDates.startDate, effectiveDates.endDate],
    queryFn: async () => {
      if (!adAccountId) {
        throw new Error('חשבון Facebook Ads לא מוגדר');
      }

      const { data: responseData, error: functionError } = await supabase.functions.invoke('facebook-ads', {
        body: { 
          adAccountId,
          startDate: effectiveDates.startDate, 
          endDate: effectiveDates.endDate, 
          clientId 
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to fetch Facebook Ads data');
      }

      if (responseData?.error) {
        throw new Error(responseData.error);
      }

      return responseData as FacebookAdsData;
    },
    enabled: !!clientId && !!adAccountId,
    staleTime: 8 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  // Fetch snapshot fallback
  const { data: snapshot } = useAnalyticsSnapshot(clientId, 'facebook_ads');

  const handleLocalFilterChange = (value: string) => {
    setLocalDateFilter(value);
    setUseLocalFilter(true);
  };

  const handleResetToGlobal = () => {
    setUseLocalFilter(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading && !data) {
    return (
      <div className="glass rounded-xl p-6 card-shadow animate-pulse">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#1877F2]/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>
          <div className="h-6 bg-muted rounded w-32"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (isAuthError(error)) {
      return (
        <div className="glass rounded-xl p-6 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#1877F2]/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <h3 className="font-bold text-lg">Facebook Ads</h3>
          </div>
          <div className="flex items-center gap-3 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-600">פג תוקף ההתחברות</p>
              <p className="text-sm text-muted-foreground">יש להתחבר מחדש כדי לצפות בנתונים</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              התחבר מחדש
            </Button>
          </div>
        </div>
      );
    }
    
    const isIntegrationError = errorMessage.includes('לא מוגדר') || errorMessage.includes('חסר');
    
    if (isIntegrationError && isAdmin && onAddIntegration) {
      return (
        <div className="glass rounded-xl p-6 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#1877F2]/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <h3 className="font-bold text-lg">Facebook Ads</h3>
          </div>
          <div className="flex flex-col items-center gap-4 py-8">
            <Plug className="w-12 h-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Facebook Ads לא מוגדר עבור לקוח זה</p>
              <p className="text-sm text-muted-foreground">הוסף אינטגרציה כדי לראות נתוני קמפיינים</p>
            </div>
            <Button onClick={onAddIntegration} className="glow bg-[#1877F2] hover:bg-[#1877F2]/90">
              <Plus className="w-4 h-4 ml-2" />
              הוסף אינטגרציה
            </Button>
          </div>
        </div>
      );
    }

    if (!snapshot) {
      return (
        <div className="glass rounded-xl p-6 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#1877F2]/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <h3 className="font-bold text-lg">Facebook Ads</h3>
          </div>
          <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">שגיאה בטעינת נתונים</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mr-auto">
              <RefreshCw className="w-4 h-4 ml-2" />
              נסה שוב
            </Button>
          </div>
        </div>
      );
    }
  }

  const usingSnapshot = !data && !!snapshot;
  const effectiveData = data || (snapshot?.data as FacebookAdsData | undefined);

  const campaigns = effectiveData?.campaigns || [];
  const dailyData = effectiveData?.daily || [];
  const totals = effectiveData?.totals;

  const totalImpressions = totals?.impressions || campaigns.reduce((sum, c) => sum + c.impressions, 0);
  const totalClicks = totals?.clicks || campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalCost = totals?.cost || campaigns.reduce((sum, c) => sum + c.cost, 0);
  const totalReach = totals?.reach || campaigns.reduce((sum, c) => sum + c.reach, 0);
  const totalConversions = totals?.conversions || campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalCost / totalClicks : 0;
  const costPerConversion = totalConversions > 0 ? totalCost / totalConversions : 0;
  const frequency = totalReach > 0 ? totalImpressions / totalReach : 0;
  const frequencyDisplay = Number.isFinite(frequency) ? frequency.toFixed(2) : "0.00";

  const summaryMetrics = [
    {
      label: "הגעה",
      value: formatNumber(totalReach),
      icon: <Users className="w-5 h-5" />,
      color: "bg-[#1877F2]/20 text-[#1877F2]",
    },
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
      value: formatCurrency(totalCost),
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

  // Campaign performance for pie chart
  const campaignSpendData = campaigns
    .filter(c => c.cost > 0)
    .slice(0, 5)
    .map(c => ({
      name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
      value: c.cost,
    }));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="glass rounded-xl p-6 card-shadow">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-[#1877F2]/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="font-bold text-lg">Facebook Ads</h3>
                  <p className="text-sm text-muted-foreground">
                    {useLocalFilter ? "סינון מותאם" : "לפי סינון גלובלי"}
                  </p>
                </div>
                {usingSnapshot && snapshot && (
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    נתונים שמורים מ־{formatSnapshotDate(snapshot.updated_at)}
                  </Badge>
                )}
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

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          {summaryMetrics.map((metric) => (
            <MetricWithComparison key={metric.label} {...metric} />
          ))}
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-lg font-bold">{formatPercentage(avgCtr, 2)}</p>
            <p className="text-xs text-muted-foreground">CTR</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-lg font-bold">{formatCurrency(avgCpc)}</p>
            <p className="text-xs text-muted-foreground">CPC ממוצע</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-lg font-bold">{formatCurrency(costPerConversion)}</p>
            <p className="text-xs text-muted-foreground">עלות להמרה</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-lg font-bold">{frequencyDisplay}</p>
            <p className="text-xs text-muted-foreground">תדירות</p>
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
                      <linearGradient id="colorClicksFb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1877F2" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorReachFb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#42B72A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#42B72A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatNumber(value)}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        color: "hsl(var(--card-foreground))",
                      }}
                      formatter={(value: number, name: string) => [
                        formatNumber(value),
                        name === 'clicks' ? 'קליקים' : 
                        name === 'reach' ? 'הגעה' : name
                      ]}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString('he-IL');
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="reach"
                      stroke="#42B72A"
                      fillOpacity={1}
                      fill="url(#colorReachFb)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#1877F2"
                      fillOpacity={1}
                      fill="url(#colorClicksFb)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Campaign Spend Distribution */}
            {campaignSpendData.length > 0 && (
              <div className="bg-muted/30 rounded-xl p-4">
                <h4 className="font-bold mb-4">התפלגות הוצאות לפי קמפיין</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={campaignSpendData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {campaignSpendData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'הוצאה']}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {campaignSpendData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-1 text-xs">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cost by Day */}
            {dailyData.length > 0 && (
              <div className="bg-muted/30 rounded-xl p-4">
                <h4 className="font-bold mb-4">הוצאה יומית</h4>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}`;
                        }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₪${value}`}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'הוצאה']}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                        }}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return date.toLocaleDateString('he-IL');
                        }}
                      />
                      <Bar dataKey="cost" fill="#1877F2" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Campaigns Table */}
          {campaigns.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-4">קמפיינים ({campaigns.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-right py-2 px-2 font-medium">קמפיין</th>
                      <th className="text-right py-2 px-2 font-medium">סטטוס</th>
                      <th className="text-right py-2 px-2 font-medium">הגעה</th>
                      <th className="text-right py-2 px-2 font-medium">חשיפות</th>
                      <th className="text-right py-2 px-2 font-medium">קליקים</th>
                      <th className="text-right py-2 px-2 font-medium">הוצאה</th>
                      <th className="text-right py-2 px-2 font-medium">CTR</th>
                      <th className="text-right py-2 px-2 font-medium">המרות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.slice(0, 10).map((campaign) => (
                      <tr key={campaign.id} className="border-b border-border/30 hover:bg-muted/30">
                        <td className="py-2 px-2">
                          <div className="max-w-[200px] truncate" title={campaign.name}>
                            {campaign.name}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                            {campaign.status === 'ACTIVE' ? 'פעיל' : campaign.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">{formatNumber(campaign.reach)}</td>
                        <td className="py-2 px-2">{formatNumber(campaign.impressions)}</td>
                        <td className="py-2 px-2">{formatNumber(campaign.clicks)}</td>
                        <td className="py-2 px-2">{formatCurrency(campaign.cost)}</td>
                        <td className="py-2 px-2">{formatPercentage(campaign.ctr, 2)}</td>
                        <td className="py-2 px-2">{formatNumber(campaign.conversions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
