import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, 
  Users, 
  TrendingUp, 
  Activity,
  ChevronRight,
  Zap,
  Network,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function AgencyAgentDashboard() {
  // Fetch master agent
  const { data: masterAgent } = useQuery({
    queryKey: ["master-agent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_agents")
        .select("*")
        .eq("agent_type", "master")
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch all client agents with stats
  const { data: clientAgents } = useQuery({
    queryKey: ["all-client-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select(`
          *,
          client:clients(name, logo_url),
          permissions:ai_agent_permissions(count),
          usage:ai_capability_usage(count)
        `)
        .eq("agent_type", "client_specific")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch aggregate stats
  const { data: aggregateStats } = useQuery({
    queryKey: ["agency-aggregate-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      
      const [usageResult, actionsResult, insightsResult] = await Promise.all([
        supabase
          .from("ai_capability_usage")
          .select("id", { count: "exact" })
          .gte("executed_at", today),
        supabase
          .from("ai_agent_actions")
          .select("id", { count: "exact" })
          .eq("status", "pending"),
        supabase
          .from("client_insights")
          .select("id", { count: "exact" })
          .gte("created_at", today),
      ]);

      return {
        todayUsage: usageResult.count || 0,
        pendingActions: actionsResult.count || 0,
        todayInsights: insightsResult.count || 0,
        activeAgents: clientAgents?.length || 0,
      };
    },
    enabled: !!clientAgents,
  });

  const capabilities = masterAgent?.capabilities || [];
  const settings = masterAgent?.settings as Record<string, any> || {};

  return (
    <div className="space-y-6">
      {/* Master Agent Header */}
      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{masterAgent?.name || "JIY Master Agent"}</CardTitle>
                <CardDescription>{masterAgent?.description}</CardDescription>
              </div>
            </div>
            <Badge variant="default" className="text-sm">
              <Activity className="w-3 h-3 mr-1" />
              פעיל
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {capabilities.map((cap: string) => (
              <Badge key={cap} variant="secondary" className="text-xs">
                {cap}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">סוכנים פעילים</p>
                <p className="text-3xl font-bold">{aggregateStats?.activeAgents || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">פעולות היום</p>
                <p className="text-3xl font-bold">{aggregateStats?.todayUsage || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ממתינות לאישור</p>
                <p className="text-3xl font-bold">{aggregateStats?.pendingActions || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">תובנות היום</p>
                <p className="text-3xl font-bold">{aggregateStats?.todayInsights || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Agents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                סוכני לקוחות
              </CardTitle>
              <CardDescription>כל הסוכנים המנוהלים תחת הסוכן-על</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clientAgents?.map((agent) => {
              const settings = agent.settings as Record<string, any> || {};
              const modulesEnabled = settings.modules_enabled || {};
              const activeModules = Object.entries(modulesEnabled).filter(([_, v]) => v).length;
              const totalModules = Object.keys(modulesEnabled).length || 1;
              
              return (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{agent.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {(agent.client as any)?.name || "לקוח"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">מודולים פעילים</p>
                      <div className="flex items-center gap-2">
                        <Progress value={(activeModules / totalModules) * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{activeModules}/{totalModules}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {agent.capabilities?.slice(0, 3).map((cap: string) => (
                        <Badge key={cap} variant="outline" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {(!clientAgents || clientAgents.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>אין סוכני לקוחות עדיין</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings Summary */}
      {settings && Object.keys(settings).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">הגדרות סוכן-על</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">הסלמה אוטומטית</span>
                <Badge variant={settings.auto_escalate ? "default" : "secondary"}>
                  {settings.auto_escalate ? "פעיל" : "כבוי"}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">תדירות דוחות</span>
                <Badge variant="outline">{settings.report_frequency || "יומי"}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">אגרגציה</span>
                <Badge variant={settings.aggregation_enabled ? "default" : "secondary"}>
                  {settings.aggregation_enabled ? "פעיל" : "כבוי"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
