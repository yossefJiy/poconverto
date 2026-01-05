import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { 
  Users, 
  TrendingUp, 
  Target, 
  DollarSign,
  Percent,
  Clock
} from "lucide-react";
import { Lead } from "@/hooks/useLeads";

interface LeadAnalyticsProps {
  leads: Lead[];
  className?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

const stageLabels: Record<string, string> = {
  new: "חדש",
  contacted: "נוצר קשר",
  qualified: "מוסמך",
  proposal: "הצעה",
  negotiation: "משא ומתן",
  won: "נסגר",
  lost: "אבוד",
};

const sourceLabels: Record<string, string> = {
  website: "אתר",
  facebook: "פייסבוק",
  instagram: "אינסטגרם",
  google: "גוגל",
  referral: "המלצה",
  manual: "ידני",
};

export function LeadAnalytics({ leads, className }: LeadAnalyticsProps) {
  const stats = useMemo(() => {
    const total = leads.length;
    const won = leads.filter(l => l.pipeline_stage === "won").length;
    const lost = leads.filter(l => l.pipeline_stage === "lost").length;
    const active = total - won - lost;
    const totalValue = leads.filter(l => l.pipeline_stage === "won")
      .reduce((sum, l) => sum + (l.conversion_value || 0), 0);
    const avgValue = won > 0 ? totalValue / won : 0;
    const conversionRate = total > 0 ? (won / total) * 100 : 0;
    const avgScore = total > 0 ? leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / total : 0;

    return { total, won, lost, active, totalValue, avgValue, conversionRate, avgScore };
  }, [leads]);

  const stageData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      const stage = l.pipeline_stage || "new";
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return Object.entries(counts).map(([stage, count]) => ({
      name: stageLabels[stage] || stage,
      value: count,
    }));
  }, [leads]);

  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      const source = l.source || "manual";
      counts[source] = (counts[source] || 0) + 1;
    });
    return Object.entries(counts).map(([source, count]) => ({
      name: sourceLabels[source] || source,
      לידים: count,
    }));
  }, [leads]);

  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      const priority = l.priority || "medium";
      counts[priority] = (counts[priority] || 0) + 1;
    });
    return [
      { name: "נמוך", value: counts.low || 0 },
      { name: "בינוני", value: counts.medium || 0 },
      { name: "גבוה", value: counts.high || 0 },
      { name: "דחוף", value: counts.urgent || 0 },
    ];
  }, [leads]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">סה״כ לידים</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs">פעילים</span>
            </div>
            <p className="text-2xl font-bold text-primary">{stats.active}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">נסגרו</span>
            </div>
            <p className="text-2xl font-bold text-success">{stats.won}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Percent className="w-4 h-4" />
              <span className="text-xs">המרה</span>
            </div>
            <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">שווי כולל</span>
            </div>
            <p className="text-2xl font-bold text-success">₪{stats.totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">ציון ממוצע</span>
            </div>
            <p className="text-2xl font-bold">{stats.avgScore.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">התפלגות לפי שלב</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {stageData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">לידים לפי מקור</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="לידים" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">לפי עדיפות</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                >
                  <Cell fill="hsl(var(--muted))" />
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--warning))" />
                  <Cell fill="hsl(var(--destructive))" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">משפך המרה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stageData.slice(0, 6).map((stage, i) => {
                const maxValue = Math.max(...stageData.map(s => s.value));
                const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                
                return (
                  <div key={stage.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{stage.name}</span>
                      <span className="font-medium">{stage.value}</span>
                    </div>
                    <div className="h-6 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: COLORS[i % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
