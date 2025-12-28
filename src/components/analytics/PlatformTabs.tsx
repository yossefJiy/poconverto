import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  MousePointer,
  Eye,
  Target,
  Users,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface TrafficSource {
  source: string;
  sessions: number;
  users: number;
  percentage: number;
}

interface TopPage {
  path: string;
  pageviews: number;
  avgDuration: string;
  bounceRate: number;
}

interface DeviceData {
  device: string;
  sessions: number;
  users: number;
  percentage: number;
}

interface CountryData {
  country: string;
  sessions: number;
  users: number;
  percentage: number;
}

interface PlatformData {
  platform: string;
  name: string;
  color: string;
  logo: string;
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    costPerConversion: number;
  };
  dailyData: Array<{
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
  }>;
  campaigns: Array<{
    name: string;
    status: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
}

interface AnalyticsData {
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: string;
  trafficSources: TrafficSource[];
  topPages: TopPage[];
  devices: DeviceData[];
  countries: CountryData[];
  dailyData: Array<{ date: string; sessions: number; users: number; pageviews: number; bounceRate: number; avgDuration: number }>;
}

interface PlatformTabsProps {
  platforms: PlatformData[];
  analyticsData: AnalyticsData;
  isLoading?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const deviceIcons: Record<string, React.ReactNode> = {
  desktop: <Monitor className="w-4 h-4" />,
  mobile: <Smartphone className="w-4 h-4" />,
  tablet: <Tablet className="w-4 h-4" />,
};

export function PlatformTabs({ platforms, analyticsData, isLoading }: PlatformTabsProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-muted rounded-lg mb-4"></div>
        <div className="h-96 bg-muted rounded-xl"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="analytics" className="w-full">
      <TabsList className="w-full justify-start gap-2 bg-muted/50 p-2 rounded-xl mb-4 flex-wrap h-auto">
        <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          <span className="text-lg">📊</span>
          Google Analytics
        </TabsTrigger>
        {platforms.map((platform) => (
          <TabsTrigger 
            key={platform.platform} 
            value={platform.platform}
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <span className="text-lg">{platform.logo}</span>
            {platform.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Google Analytics Tab */}
      <TabsContent value="analytics" className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MetricBox 
            label="סשנים" 
            value={formatNumber(analyticsData.sessions)} 
            icon={<Users className="w-4 h-4" />}
            color="bg-blue-500/20 text-blue-500"
          />
          <MetricBox 
            label="משתמשים" 
            value={formatNumber(analyticsData.users)} 
            icon={<Users className="w-4 h-4" />}
            color="bg-indigo-500/20 text-indigo-500"
          />
          <MetricBox 
            label="צפיות" 
            value={formatNumber(analyticsData.pageviews)} 
            icon={<Eye className="w-4 h-4" />}
            color="bg-purple-500/20 text-purple-500"
          />
          <MetricBox 
            label="Bounce Rate" 
            value={analyticsData.bounceRate.toFixed(1) + "%"} 
            icon={<TrendingUp className="w-4 h-4" />}
            color="bg-orange-500/20 text-orange-500"
          />
          <MetricBox 
            label="זמן ממוצע" 
            value={analyticsData.avgSessionDuration} 
            icon={<Calendar className="w-4 h-4" />}
            color="bg-teal-500/20 text-teal-500"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Sessions Chart */}
          <div className="lg:col-span-2 glass rounded-xl p-6">
            <h4 className="font-bold mb-4">תנועה יומית</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.dailyData}>
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                    fill="url(#colorSessions)" 
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
          <div className="glass rounded-xl p-6">
            <h4 className="font-bold mb-4">מקורות תנועה</h4>
            {analyticsData.trafficSources.length > 0 ? (
              <>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.trafficSources}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
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
                  {analyticsData.trafficSources.map((source, index) => (
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

        {/* Charts Row 2 - Pageviews & Devices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pageviews Chart */}
          <div className="glass rounded-xl p-6">
            <h4 className="font-bold mb-4">צפיות עמוד יומיות</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem"
                    }}
                  />
                  <Bar 
                    dataKey="pageviews" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="צפיות"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Devices Breakdown */}
          <div className="glass rounded-xl p-6">
            <h4 className="font-bold mb-4">התפלגות מכשירים</h4>
            {analyticsData.devices.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.devices.map((device, index) => (
                  <div key={device.device} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          index === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {deviceIcons[device.device.toLowerCase()] || <Monitor className="w-4 h-4" />}
                        </div>
                        <span className="font-medium capitalize">{device.device}</span>
                      </div>
                      <div className="text-left">
                        <span className="font-bold">{formatNumber(device.sessions)}</span>
                        <span className="text-muted-foreground text-sm mr-2">({device.percentage}%)</span>
                      </div>
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
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                אין נתונים
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 3 - Top Pages & Countries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h4 className="font-bold">דפים פופולריים</h4>
            </div>
            {analyticsData.topPages.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-2 font-medium">עמוד</th>
                      <th className="text-right py-2 font-medium">צפיות</th>
                      <th className="text-right py-2 font-medium">זמן ממוצע</th>
                      <th className="text-right py-2 font-medium">Bounce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.topPages.slice(0, 8).map((page, index) => (
                      <tr key={index} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2">
                          <span className="truncate block max-w-[180px]" title={page.path}>
                            {page.path}
                          </span>
                        </td>
                        <td className="py-2 font-medium">{formatNumber(page.pageviews)}</td>
                        <td className="py-2">{page.avgDuration}</td>
                        <td className="py-2">{page.bounceRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                אין נתונים
              </div>
            )}
          </div>

          {/* Countries */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h4 className="font-bold">מדינות</h4>
            </div>
            {analyticsData.countries.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.countries.slice(0, 8).map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getCountryFlag(country.country)}</span>
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${country.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-left">{country.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                אין נתונים
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Platform Tabs */}
      {platforms.map((platform) => (
        <TabsContent key={platform.platform} value={platform.platform} className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <MetricBox 
              label="הוצאה" 
              value={"₪" + formatNumber(platform.metrics.spend)} 
              icon={<DollarSign className="w-4 h-4" />}
              color="bg-green-500/20 text-green-500"
            />
            <MetricBox 
              label="חשיפות" 
              value={formatNumber(platform.metrics.impressions)} 
              icon={<Eye className="w-4 h-4" />}
              color="bg-cyan-500/20 text-cyan-500"
            />
            <MetricBox 
              label="קליקים" 
              value={formatNumber(platform.metrics.clicks)} 
              icon={<MousePointer className="w-4 h-4" />}
              color="bg-blue-500/20 text-blue-500"
            />
            <MetricBox 
              label="CTR" 
              value={platform.metrics.ctr.toFixed(2) + "%"} 
              icon={<Target className="w-4 h-4" />}
              color="bg-teal-500/20 text-teal-500"
            />
            <MetricBox 
              label="CPC" 
              value={"₪" + platform.metrics.cpc.toFixed(2)} 
              icon={<DollarSign className="w-4 h-4" />}
              color="bg-amber-500/20 text-amber-500"
            />
            <MetricBox 
              label="המרות" 
              value={formatNumber(platform.metrics.conversions)} 
              icon={<Target className="w-4 h-4" />}
              color="bg-emerald-500/20 text-emerald-500"
            />
            <MetricBox 
              label="עלות/המרה" 
              value={"₪" + platform.metrics.costPerConversion.toFixed(0)} 
              icon={<BarChart3 className="w-4 h-4" />}
              color="bg-rose-500/20 text-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Performance Chart */}
            <div className="glass rounded-xl p-6">
              <h4 className="font-bold mb-4">ביצועים יומיים</h4>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={platform.dailyData}>
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
                    <Line 
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                      name="קליקים"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="conversions" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={false}
                      name="המרות"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Campaigns Table */}
            <div className="glass rounded-xl p-6 overflow-hidden">
              <h4 className="font-bold mb-4">קמפיינים</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-2 font-medium">קמפיין</th>
                      <th className="text-right py-2 font-medium">הוצאה</th>
                      <th className="text-right py-2 font-medium">קליקים</th>
                      <th className="text-right py-2 font-medium">המרות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platform.campaigns.map((campaign, index) => (
                      <tr key={index} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-2 h-2 rounded-full",
                              campaign.status === "active" ? "bg-success" : "bg-muted"
                            )} />
                            <span className="font-medium truncate max-w-[150px]">{campaign.name}</span>
                          </div>
                        </td>
                        <td className="py-3">₪{formatNumber(campaign.spend)}</td>
                        <td className="py-3">{formatNumber(campaign.clicks)}</td>
                        <td className="py-3">{campaign.conversions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function MetricBox({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
          {icon}
        </div>
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// Helper function to get country flag emoji
function getCountryFlag(country: string): string {
  const countryFlags: Record<string, string> = {
    "Israel": "🇮🇱",
    "United States": "🇺🇸",
    "United Kingdom": "🇬🇧",
    "Germany": "🇩🇪",
    "France": "🇫🇷",
    "Canada": "🇨🇦",
    "Australia": "🇦🇺",
    "India": "🇮🇳",
    "Brazil": "🇧🇷",
    "Russia": "🇷🇺",
    "China": "🇨🇳",
    "Japan": "🇯🇵",
    "Spain": "🇪🇸",
    "Italy": "🇮🇹",
    "Netherlands": "🇳🇱",
    "Poland": "🇵🇱",
    "South Africa": "🇿🇦",
    "Mexico": "🇲🇽",
    "Argentina": "🇦🇷",
    "Turkey": "🇹🇷",
  };
  return countryFlags[country] || "🌍";
}
