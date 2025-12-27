import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Target, 
  TrendingUp, 
  CheckSquare,
  Megaphone,
  DollarSign,
  Eye,
  MousePointer,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";

export default function Dashboard() {
  const { selectedClient } = useClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", selectedClient?.id],
    queryFn: async () => {
      // Get tasks
      let tasksQuery = supabase.from("tasks").select("status");
      if (selectedClient) {
        tasksQuery = tasksQuery.eq("client_id", selectedClient.id);
      }
      const { data: tasks } = await tasksQuery;

      // Get campaigns
      let campaignsQuery = supabase.from("campaigns").select("status, budget, spent, impressions, clicks, conversions");
      if (selectedClient) {
        campaignsQuery = campaignsQuery.eq("client_id", selectedClient.id);
      }
      const { data: campaigns } = await campaignsQuery;

      const activeCampaigns = campaigns?.filter(c => c.status === "active").length || 0;
      const totalBudget = campaigns?.reduce((sum, c) => sum + (c.budget || 0), 0) || 0;
      const totalSpent = campaigns?.reduce((sum, c) => sum + (c.spent || 0), 0) || 0;
      const totalImpressions = campaigns?.reduce((sum, c) => sum + (c.impressions || 0), 0) || 0;
      const totalClicks = campaigns?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;
      const totalConversions = campaigns?.reduce((sum, c) => sum + (c.conversions || 0), 0) || 0;

      const openTasks = tasks?.filter(t => t.status !== "completed").length || 0;
      const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;

      return {
        activeCampaigns,
        totalBudget,
        totalSpent,
        totalImpressions,
        totalClicks,
        totalConversions,
        openTasks,
        completedTasks,
        ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0",
      };
    },
  });

  const { data: recentTasks = [] } = useQuery({
    queryKey: ["recent-tasks", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*, team_members(name)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      const { data } = await query;
      return data || [];
    },
  });

  const { data: recentCampaigns = [] } = useQuery({
    queryKey: ["recent-campaigns", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      const { data } = await query;
      return data || [];
    },
  });

  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: "bg-warning", label: "ממתין" },
    "in-progress": { color: "bg-info", label: "בתהליך" },
    completed: { color: "bg-success", label: "הושלם" },
    active: { color: "bg-success", label: "פעיל" },
    paused: { color: "bg-warning", label: "מושהה" },
  };

  return (
    <MainLayout>
      <div className="p-8">
        <PageHeader 
          title={selectedClient ? `דשבורד - ${selectedClient.name}` : "דשבורד כללי"}
          description={selectedClient ? `סקירת ביצועים עבור ${selectedClient.name}` : "סקירה כללית של כל הפעילות"}
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <MetricCard
                title="קמפיינים פעילים"
                value={stats?.activeCampaigns || 0}
                icon={<Megaphone className="w-5 h-5" />}
                delay={0.1}
              />
              <MetricCard
                title="משימות פתוחות"
                value={stats?.openTasks || 0}
                icon={<CheckSquare className="w-5 h-5" />}
                delay={0.15}
              />
              <MetricCard
                title="חשיפות"
                value={formatNumber(stats?.totalImpressions || 0)}
                icon={<Eye className="w-5 h-5" />}
                delay={0.2}
              />
              <MetricCard
                title="המרות"
                value={stats?.totalConversions || 0}
                icon={<TrendingUp className="w-5 h-5" />}
                delay={0.25}
              />
            </div>

            {/* Budget & Performance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">תקציב</p>
                    <p className="text-2xl font-bold">₪{formatNumber(stats?.totalBudget || 0)}</p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${stats?.totalBudget ? (stats.totalSpent / stats.totalBudget) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ₪{formatNumber(stats?.totalSpent || 0)} מתוך ₪{formatNumber(stats?.totalBudget || 0)}
                </p>
              </div>

              <div className="glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <MousePointer className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">קליקים</p>
                    <p className="text-2xl font-bold">{formatNumber(stats?.totalClicks || 0)}</p>
                  </div>
                </div>
                <p className="text-sm">
                  <span className="text-success font-medium">{stats?.ctr}%</span>
                  <span className="text-muted-foreground"> CTR</span>
                </p>
              </div>

              <div className="glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">משימות הושלמו</p>
                    <p className="text-2xl font-bold">{stats?.completedTasks || 0}</p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full transition-all"
                    style={{ width: `${stats?.openTasks || stats?.completedTasks ? (stats.completedTasks / (stats.openTasks + stats.completedTasks)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Tasks */}
              <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.45s", animationFillMode: "forwards" }}>
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold">משימות אחרונות</h3>
                </div>
                <div className="divide-y divide-border">
                  {recentTasks.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">אין משימות</div>
                  ) : (
                    recentTasks.map((task: any) => (
                      <div key={task.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {task.team_members?.name || task.assignee || "לא משויך"}
                            </p>
                          </div>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            statusConfig[task.status]?.color || "bg-muted",
                            "text-foreground"
                          )}>
                            {statusConfig[task.status]?.label || task.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Campaigns */}
              <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold">קמפיינים אחרונים</h3>
                </div>
                <div className="divide-y divide-border">
                  {recentCampaigns.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">אין קמפיינים</div>
                  ) : (
                    recentCampaigns.map((campaign: any) => (
                      <div key={campaign.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-xs text-muted-foreground">{campaign.platform}</p>
                          </div>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            statusConfig[campaign.status]?.color || "bg-muted",
                            "text-foreground"
                          )}>
                            {statusConfig[campaign.status]?.label || campaign.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

function MetricCard({ title, value, icon, delay }: { title: string; value: string | number; icon: React.ReactNode; delay: number }) {
  return (
    <div 
      className="glass rounded-xl p-5 card-shadow opacity-0 animate-slide-up"
      style={{ animationDelay: `${delay}s`, animationFillMode: "forwards" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}
