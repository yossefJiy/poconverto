// Social Analytics Dashboard Component

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Heart, 
  MessageCircle, 
  Share2, 
  Eye,
  TrendingUp,
  TrendingDown,
  Users
} from 'lucide-react';
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
} from 'recharts';

interface EngagementStats {
  total_posts: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_reach: number;
  avg_engagement_rate: number;
}

interface PlatformBreakdown {
  platform: string;
  posts: number;
  engagement: number;
  color: string;
}

interface SocialAnalyticsDashboardProps {
  stats: EngagementStats;
  platformBreakdown?: PlatformBreakdown[];
  trendData?: Array<{ date: string; engagement: number; reach: number }>;
  previousPeriodStats?: EngagementStats;
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  twitter: '#000000',
};

export function SocialAnalyticsDashboard({ 
  stats, 
  platformBreakdown = [],
  trendData = [],
  previousPeriodStats 
}: SocialAnalyticsDashboardProps) {
  
  const calculateChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change 
  }: { 
    title: string; 
    value: number; 
    icon: React.ComponentType<{ className?: string }>; 
    change?: number | null;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatNumber(value)}</p>
            {change !== null && change !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="לייקים"
          value={stats.total_likes}
          icon={Heart}
          change={calculateChange(stats.total_likes, previousPeriodStats?.total_likes)}
        />
        <MetricCard
          title="תגובות"
          value={stats.total_comments}
          icon={MessageCircle}
          change={calculateChange(stats.total_comments, previousPeriodStats?.total_comments)}
        />
        <MetricCard
          title="שיתופים"
          value={stats.total_shares}
          icon={Share2}
          change={calculateChange(stats.total_shares, previousPeriodStats?.total_shares)}
        />
        <MetricCard
          title="חשיפה"
          value={stats.total_reach}
          icon={Eye}
          change={calculateChange(stats.total_reach, previousPeriodStats?.total_reach)}
        />
      </div>

      {/* Engagement Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            יחס מעורבות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.avg_engagement_rate.toFixed(2)}%</span>
              <span className="text-muted-foreground">מתוך {formatNumber(stats.total_reach)} חשיפות</span>
            </div>
            <Progress value={Math.min(stats.avg_engagement_rate * 10, 100)} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>0%</span>
              <span>5%</span>
              <span>10%+</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Trend Chart */}
        {trendData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">מגמת מעורבות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="engagement"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                      name="מעורבות"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Breakdown */}
        {platformBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">התפלגות לפי פלטפורמה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="engagement"
                      nameKey="platform"
                    >
                      {platformBreakdown.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PLATFORM_COLORS[entry.platform] || entry.color} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {platformBreakdown.map((item) => (
                  <div key={item.platform} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: PLATFORM_COLORS[item.platform] || item.color }}
                    />
                    <span className="text-sm capitalize">{item.platform}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">סה"כ פוסטים בתקופה:</span>
            </div>
            <span className="font-bold">{stats.total_posts}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
