import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useClientModules } from "@/hooks/useClientModules";
import { useCodeHealth } from "@/hooks/useCodeHealth";
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
  Loader2,
  Circle,
  Calendar,
  Clock,
  Building2,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { AIContentDialog } from "@/components/ai/AIContentDialog";
import { AIInsightsDialog } from "@/components/ai/AIInsightsDialog";
import { ReportDialog } from "@/components/reports/ReportDialog";
import { NotificationsDropdown } from "@/components/notifications/NotificationsDropdown";
import { ShareDashboardDialog } from "@/components/client/ShareDashboardDialog";
import { ClientLinksCard } from "@/components/dashboard/ClientLinksCard";
import { IntegrationsCard } from "@/components/dashboard/IntegrationsCard";
import { QuickActionsCard } from "@/components/dashboard/QuickActionsCard";
import { DraggableTimelineWidget } from "@/components/dashboard/DraggableTimelineWidget";
import { JiyPremiumCard } from "@/components/dashboard/JiyPremiumCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { selectedClient } = useClient();
  const { isModuleEnabled } = useClientModules();
  const { stats: codeHealthStats } = useCodeHealth();

  // Get current user's team member name
  const { data: currentTeamMember } = useQuery({
    queryKey: ["current-team-member"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return null;
      
      const { data } = await supabase
        .from("team")
        .select("name")
        .eq("email", user.email)
        .single();
      return data;
    },
  });

  // Check if this is the master account (JIY) using is_master_account column
  const { data: masterClient } = useQuery({
    queryKey: ["master-client"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .eq("is_master_account", true)
        .single();
      return data;
    },
  });

  const isMasterAccount = selectedClient?.id === masterClient?.id ||
                          selectedClient?.name?.toLowerCase().includes("jiy") || 
                          selectedClient?.name?.includes("סוכנות") ||
                          !selectedClient; // No client selected = show all

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", selectedClient?.id, isMasterAccount],
    queryFn: async () => {
      // Get tasks - for master account, get ALL tasks
      let tasksQuery = supabase.from("tasks").select("status, client_id");
      if (selectedClient && !isMasterAccount) {
        tasksQuery = tasksQuery.eq("client_id", selectedClient.id);
      }
      const { data: tasks } = await tasksQuery;

      // Get campaigns - for master account, get ALL campaigns
      let campaignsQuery = supabase.from("campaigns").select("status, budget, spent, impressions, clicks, conversions, client_id");
      if (selectedClient && !isMasterAccount) {
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
      
      // Count unique clients for master account view
      const uniqueClients = isMasterAccount 
        ? new Set([...tasks?.map(t => t.client_id), ...campaigns?.map(c => c.client_id)].filter(Boolean)).size
        : 0;

      return {
        activeCampaigns,
        totalBudget,
        totalSpent,
        totalImpressions,
        totalClicks,
        totalConversions,
        openTasks,
        completedTasks,
        uniqueClients,
        ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0",
      };
    },
  });

  // Fetch client full data for links
  const { data: clientData } = useQuery({
    queryKey: ["client-full-dashboard", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", selectedClient.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  // Fetch integrations
  const { data: integrations = [] } = useQuery({
    queryKey: ["client-integrations-dashboard", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("client_id", selectedClient.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  // Fetch tasks with new fields for timeline (excluding completed)
  const { data: recentTasks = [] } = useQuery({
    queryKey: ["recent-tasks", selectedClient?.id, isMasterAccount],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*, clients:clients!tasks_client_id_fkey(name, is_master_account)")
        .neq("status", "completed")
        .order("due_date", { ascending: true })
        .limit(50);
      if (selectedClient && !isMasterAccount) {
        query = query.eq("client_id", selectedClient.id);
      }
      const { data } = await query;
      return data || [];
    },
  });

  // Fetch completed tasks today for hours calculation
  const { data: completedTodayTasks = [] } = useQuery({
    queryKey: ["completed-today-dashboard", selectedClient?.id, isMasterAccount],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      let query = supabase
        .from("tasks")
        .select("id, duration_minutes, client_id, updated_at")
        .eq("status", "completed")
        .gte("updated_at", todayStart.toISOString());
      
      if (selectedClient && !isMasterAccount) {
        query = query.eq("client_id", selectedClient.id);
      }
      const { data } = await query;
      return data || [];
    },
  });

  // Calculate today's stats
  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasksCount = recentTasks.filter((t: any) => t.due_date === todayStr).length;
  const totalMinutesToday = completedTodayTasks.reduce((sum: number, t: any) => sum + (t.duration_minutes || 60), 0);
  const hoursCompletedToday = (totalMinutesToday / 60).toFixed(1);
  const clientsHandledToday = new Set(completedTodayTasks.map((t: any) => t.client_id).filter(Boolean)).size;

  const { data: recentCampaigns = [] } = useQuery({
    queryKey: ["recent-campaigns", selectedClient?.id, isMasterAccount],
    queryFn: async () => {
      let query = supabase
        .from("campaigns")
        .select("*, clients:clients!campaigns_client_id_fkey(name)")
        .order("created_at", { ascending: false })
        .limit(10);
      if (selectedClient && !isMasterAccount) {
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
        <div className="flex items-center justify-between mb-6">
          <PageHeader 
            title={selectedClient ? `דשבורד - ${selectedClient.name}` : "דשבורד כללי"}
            description={selectedClient ? `סקירת ביצועים עבור ${selectedClient.name}` : "סקירה כללית של כל הפעילות"}
          />
          {selectedClient && <ShareDashboardDialog />}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Critical Code Issues Alert */}
            {codeHealthStats && codeHealthStats.criticalCount > 0 && (
              <Alert variant="destructive" className="mb-6 animate-fade-in">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>בעיות קוד קריטיות</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    יש {codeHealthStats.criticalCount} בעיות קריטיות פתוחות שדורשות טיפול מיידי
                  </span>
                  <Link 
                    to="/code-health" 
                    className="text-destructive-foreground underline hover:no-underline font-medium"
                  >
                    צפה בבעיות
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            {/* Greeting with elegant quote */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {currentTeamMember?.name || "שלום"}
                </h2>
              </div>
              <blockquote className="border-r-2 border-primary/30 pr-4 py-1">
                <p className="text-sm text-muted-foreground italic">
                  "רומא לא נבנתה ביום אחד, גם לא JIY"
                </p>
              </blockquote>
            </div>

            {/* Stats sections */}
            {isModuleEnabled("tasks") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* All pending tasks + active clients */}
                <div className="bg-card border border-border rounded-xl p-5 animate-fade-in hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">סקירה כללית</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                        <Circle className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <span className="text-3xl font-bold text-foreground">{stats?.openTasks || 0}</span>
                        <p className="text-sm text-muted-foreground">משימות פתוחות</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                        <Building2 className="w-5 h-5 text-accent-foreground" />
                      </div>
                      <div>
                        <span className="text-3xl font-bold text-foreground">{stats?.uniqueClients || 0}</span>
                        <p className="text-sm text-muted-foreground">לקוחות פעילים</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's stats */}
                <div className="bg-card border border-border rounded-xl p-5 animate-fade-in hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">היום</h3>
                    <span className="text-xs text-muted-foreground/70 font-medium bg-muted/50 px-2 py-1 rounded-md">
                      {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center group">
                      <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-2 transition-transform duration-300 group-hover:scale-110">
                        <Calendar className="w-4 h-4 text-warning" />
                      </div>
                      <span className="text-xl font-bold text-foreground block">{todayTasksCount}</span>
                      <p className="text-xs text-muted-foreground">משימות</p>
                    </div>
                    <div className="text-center group">
                      <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center mx-auto mb-2 transition-transform duration-300 group-hover:scale-110">
                        <Clock className="w-4 h-4 text-info" />
                      </div>
                      <span className="text-xl font-bold text-foreground block">{hoursCompletedToday}</span>
                      <p className="text-xs text-muted-foreground">שעות</p>
                    </div>
                    <div className="text-center group">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2 transition-transform duration-300 group-hover:scale-110">
                        <Users className="w-4 h-4 text-success" />
                      </div>
                      <span className="text-xl font-bold text-foreground block">{clientsHandledToday}</span>
                      <p className="text-xs text-muted-foreground">לקוחות</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {isModuleEnabled("campaigns") && (
                <MetricCard
                  title="קמפיינים פעילים"
                  value={stats?.activeCampaigns || 0}
                  icon={<Megaphone className="w-5 h-5" />}
                  delay={0.1}
                />
              )}
              {isModuleEnabled("campaigns") && (
                <MetricCard
                  title="חשיפות"
                  value={formatNumber(stats?.totalImpressions || 0)}
                  icon={<Eye className="w-5 h-5" />}
                  delay={0.2}
                />
              )}
              {isModuleEnabled("campaigns") && (
                <MetricCard
                  title="המרות"
                  value={stats?.totalConversions || 0}
                  icon={<TrendingUp className="w-5 h-5" />}
                  delay={0.25}
                />
              )}
            </div>

            {/* Budget & Performance */}
            {isModuleEnabled("campaigns") && (
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

                {isModuleEnabled("tasks") && (
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
                )}
              </div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Daily Timeline Widget */}
              <div className="lg:col-span-2 space-y-6">
                {/* Daily Timeline Widget */}
                {isModuleEnabled("tasks") && (
                  <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.45s", animationFillMode: "forwards" }}>
                    <DraggableTimelineWidget 
                      tasks={recentTasks} 
                      masterClientId={masterClient?.id}
                    />
                  </div>
                )}


                {/* Recent Campaigns */}
                {isModuleEnabled("campaigns") && (
                  <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.55s", animationFillMode: "forwards" }}>
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
                )}
              </div>

              {/* Right Column - Links, Integrations, Quick Actions or JIY Premium Card */}
              {selectedClient && (
                <div className="space-y-4 opacity-0 animate-slide-up" style={{ animationDelay: "0.6s", animationFillMode: "forwards" }}>
                  {isMasterAccount ? (
                    <JiyPremiumCard title="סוכנות הדיגיטל">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-[hsl(var(--jiy-gold))]">{stats?.uniqueClients || 0}</p>
                            <p className="text-xs text-muted-foreground">לקוחות פעילים</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-[hsl(var(--jiy-gold))]">{stats?.openTasks || 0}</p>
                            <p className="text-xs text-muted-foreground">משימות פתוחות</p>
                          </div>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground mb-1">תקציב כולל</p>
                          <p className="text-xl font-bold">₪{formatNumber(stats?.totalBudget || 0)}</p>
                        </div>
                      </div>
                    </JiyPremiumCard>
                  ) : (
                    <>
                      <ClientLinksCard 
                        website={clientData?.website}
                        instagram_url={(clientData as any)?.instagram_url}
                        facebook_url={(clientData as any)?.facebook_url}
                        tiktok_url={(clientData as any)?.tiktok_url}
                      />
                      <IntegrationsCard integrations={integrations} />
                    </>
                  )}
                  <QuickActionsCard isModuleEnabled={isModuleEnabled} />
                </div>
              )}
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

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}
