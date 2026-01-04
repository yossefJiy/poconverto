import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Legend,
} from "recharts";
import {
  Bot,
  Activity,
  Shield,
  AlertTriangle,
  TrendingUp,
  Zap,
  Ban,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { he } from "date-fns/locale";

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#22c55e", "#06b6d4", "#8b5cf6"];

interface UsageStat {
  id: string;
  agent_id: string | null;
  capability_id: string | null;
  client_id: string | null;
  was_allowed: boolean;
  was_approved: boolean | null;
  executed_at: string | null;
  error_message: string | null;
  capability?: {
    name: string;
    display_name: string;
    category: string;
    is_dangerous: boolean;
  };
  agent?: {
    name: string;
    agent_type: string;
  };
}

export function AICapabilityUsageStats() {
  // Fetch usage stats for last 30 days
  const { data: usageStats = [], isLoading } = useQuery({
    queryKey: ["ai-capability-usage-stats"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from("ai_capability_usage")
        .select(`
          *,
          capability:capability_id (name, display_name, category, is_dangerous),
          agent:agent_id (name, agent_type)
        `)
        .gte("executed_at", thirtyDaysAgo)
        .order("executed_at", { ascending: false });
      if (error) throw error;
      return data as UsageStat[];
    },
  });

  // Calculate daily usage for chart
  const dailyUsage = (() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return last7Days.map((day) => {
      const dayStart = startOfDay(day);
      const dayStats = usageStats.filter((stat) => {
        const statDate = stat.executed_at ? startOfDay(new Date(stat.executed_at)) : null;
        return statDate && statDate.getTime() === dayStart.getTime();
      });

      return {
        date: format(day, "EEEE", { locale: he }),
        allowed: dayStats.filter((s) => s.was_allowed).length,
        denied: dayStats.filter((s) => !s.was_allowed).length,
        total: dayStats.length,
      };
    });
  })();

  // Calculate capability distribution
  const capabilityDistribution = (() => {
    const counts: Record<string, { name: string; count: number }> = {};
    usageStats.forEach((stat) => {
      if (stat.capability) {
        const key = stat.capability.name;
        if (!counts[key]) {
          counts[key] = { name: stat.capability.display_name, count: 0 };
        }
        counts[key].count++;
      }
    });
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  })();

  // Calculate agent activity
  const agentActivity = (() => {
    const counts: Record<string, { name: string; type: string; count: number; allowed: number; denied: number }> = {};
    usageStats.forEach((stat) => {
      if (stat.agent) {
        const key = stat.agent_id || "";
        if (!counts[key]) {
          counts[key] = { 
            name: stat.agent.name, 
            type: stat.agent.agent_type, 
            count: 0,
            allowed: 0,
            denied: 0,
          };
        }
        counts[key].count++;
        if (stat.was_allowed) {
          counts[key].allowed++;
        } else {
          counts[key].denied++;
        }
      }
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  })();

  // Summary stats
  const totalRequests = usageStats.length;
  const allowedRequests = usageStats.filter((s) => s.was_allowed).length;
  const deniedRequests = usageStats.filter((s) => !s.was_allowed).length;
  const dangerousActions = usageStats.filter(
    (s) => s.capability?.is_dangerous && s.was_allowed
  ).length;
  const approvalRate = totalRequests > 0 ? (allowedRequests / totalRequests) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRequests}</p>
                <p className="text-sm text-muted-foreground">סה״כ פעולות</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allowedRequests}</p>
                <p className="text-sm text-muted-foreground">אושרו</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Ban className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deniedRequests}</p>
                <p className="text-sm text-muted-foreground">נדחו</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dangerousActions}</p>
                <p className="text-sm text-muted-foreground">פעולות רגישות</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            אחוז אישור פעולות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{allowedRequests} מתוך {totalRequests}</span>
              <span>{approvalRate.toFixed(1)}%</span>
            </div>
            <Progress value={approvalRate} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              שימוש ביכולות - 7 ימים אחרונים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    direction: "rtl", 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }} 
                />
                <Bar dataKey="allowed" name="אושרו" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="denied" name="נדחו" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Capability Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              יכולות פופולריות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {capabilityDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                אין נתונים עדיין
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={capabilityDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {capabilityDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4" />
            סוכנים פעילים
          </CardTitle>
          <CardDescription>פעילות סוכני AI ב-30 יום האחרונים</CardDescription>
        </CardHeader>
        <CardContent>
          {agentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              אין פעילות סוכנים עדיין
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>סוכן</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead className="text-center">אושרו</TableHead>
                  <TableHead className="text-center">נדחו</TableHead>
                  <TableHead className="text-center">סה״כ</TableHead>
                  <TableHead className="text-center">אחוז אישור</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentActivity.slice(0, 10).map((agent, index) => {
                  const rate = agent.count > 0 ? (agent.allowed / agent.count) * 100 : 0;
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{agent.type}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-green-600">{agent.allowed}</TableCell>
                      <TableCell className="text-center text-red-600">{agent.denied}</TableCell>
                      <TableCell className="text-center font-bold">{agent.count}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={rate >= 80 ? "default" : rate >= 50 ? "secondary" : "destructive"}>
                          {rate.toFixed(0)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">פעולות אחרונות</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {usageStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                אין פעולות עדיין
              </div>
            ) : (
              <div className="space-y-2">
                {usageStats.slice(0, 20).map((stat) => (
                  <div
                    key={stat.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${stat.was_allowed ? "bg-green-500/10" : "bg-red-500/10"}`}>
                        {stat.was_allowed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Ban className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {stat.capability?.display_name || "פעולה לא ידועה"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{stat.agent?.name || "סוכן"}</span>
                          {stat.capability?.is_dangerous && (
                            <Badge variant="destructive" className="text-xs h-4">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              רגיש
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {stat.executed_at && format(new Date(stat.executed_at), "dd/MM HH:mm")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
