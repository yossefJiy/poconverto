import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Megaphone,
  DollarSign,
  Eye,
  MousePointer,
  TrendingUp,
  CheckSquare,
  Loader2,
  Building2,
  Globe,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function ClientDashboard() {
  const { clientId } = useParams<{ clientId: string }>();

  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ["public-client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["public-dashboard-stats", clientId],
    queryFn: async () => {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("status")
        .eq("client_id", clientId);

      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("status, budget, spent, impressions, clicks, conversions")
        .eq("client_id", clientId);

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
    enabled: !!clientId,
  });

  const { data: recentTasks = [] } = useQuery({
    queryKey: ["public-recent-tasks", clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*, team_members(name)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!clientId,
  });

  const { data: recentCampaigns = [] } = useQuery({
    queryKey: ["public-recent-campaigns", clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!clientId,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["public-goals", clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!clientId,
  });

  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: "bg-warning", label: "ממתין" },
    "in-progress": { color: "bg-info", label: "בתהליך" },
    completed: { color: "bg-success", label: "הושלם" },
    active: { color: "bg-success", label: "פעיל" },
    paused: { color: "bg-warning", label: "מושהה" },
  };

  const isLoading = isLoadingClient || isLoadingStats;

  if (!clientId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">לא נמצא מזהה לקוח</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30" dir="rtl">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {client?.logo_url ? (
                <img src={client.logo_url} alt={client?.name} className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">{client?.name || "טוען..."}</h1>
                {client?.industry && (
                  <p className="text-sm text-muted-foreground">{client.industry}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {client?.website && (
                <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">אתר</span>
                </a>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(), "dd/MM/yyyy", { locale: he })}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
              <div className="bg-card rounded-xl p-6 border border-border shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
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

              <div className="bg-card rounded-xl p-6 border border-border shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                    <MousePointer className="w-5 h-5 text-accent-foreground" />
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

              <div className="bg-card rounded-xl p-6 border border-border shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
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

            {/* Goals */}
            {goals.length > 0 && (
              <div className="mb-8 opacity-0 animate-slide-up" style={{ animationDelay: "0.45s", animationFillMode: "forwards" }}>
                <h2 className="text-lg font-bold mb-4">יעדים</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goals.map((goal: any) => (
                    <div key={goal.id} className="bg-card rounded-xl p-4 border border-border shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{goal.name}</h3>
                        <span className="text-xs text-muted-foreground">{goal.period}</span>
                      </div>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-2xl font-bold">{goal.current_value || 0}</span>
                        <span className="text-muted-foreground">/ {goal.target_value}</span>
                        {goal.unit && <span className="text-sm text-muted-foreground">{goal.unit}</span>}
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Tasks */}
              <div className="bg-card rounded-xl border border-border shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold">משימות אחרונות</h3>
                </div>
                <div className="divide-y divide-border max-h-96 overflow-y-auto">
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
                              {task.due_date && ` • ${format(new Date(task.due_date), "dd/MM/yyyy")}`}
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
              <div className="bg-card rounded-xl border border-border shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: "0.55s", animationFillMode: "forwards" }}>
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold">קמפיינים</h3>
                </div>
                <div className="divide-y divide-border max-h-96 overflow-y-auto">
                  {recentCampaigns.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">אין קמפיינים</div>
                  ) : (
                    recentCampaigns.map((campaign: any) => (
                      <div key={campaign.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
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
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span className="block text-foreground font-medium">{formatNumber(campaign.impressions || 0)}</span>
                            <span>חשיפות</span>
                          </div>
                          <div>
                            <span className="block text-foreground font-medium">{formatNumber(campaign.clicks || 0)}</span>
                            <span>קליקים</span>
                          </div>
                          <div>
                            <span className="block text-foreground font-medium">{campaign.conversions || 0}</span>
                            <span>המרות</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6 text-center text-sm text-muted-foreground">
        <p>דוח זה נוצר אוטומטית • {format(new Date(), "dd/MM/yyyy HH:mm", { locale: he })}</p>
      </footer>
    </div>
  );
}

function MetricCard({ title, value, icon, delay }: { title: string; value: string | number; icon: React.ReactNode; delay: number }) {
  return (
    <div 
      className="bg-card rounded-xl p-5 border border-border shadow-sm opacity-0 animate-slide-up"
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
