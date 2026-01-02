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
  Calendar,
  Coins,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { CreditMeter } from "@/components/credits/CreditMeter";
import { CreditHistory } from "@/components/credits/CreditHistory";
import { TaskRequestForm } from "@/components/credits/TaskRequestForm";
import { UpsellSuggestions } from "@/components/credits/UpsellSuggestions";
import { useClientCredits, creditsToHours } from "@/hooks/useClientCredits";

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

  const { credits, transactions, taskRequests, isLoading: isLoadingCredits } = useClientCredits(clientId);

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["public-dashboard-stats", clientId],
    queryFn: async () => {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("status, credits_cost")
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
      const totalCreditsUsed = tasks?.filter(t => t.status === "completed").reduce((sum, t) => sum + (t.credits_cost || 60), 0) || 0;

      return {
        activeCampaigns,
        totalBudget,
        totalSpent,
        totalImpressions,
        totalClicks,
        totalConversions,
        openTasks,
        completedTasks,
        totalCreditsUsed,
        ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0",
      };
    },
    enabled: !!clientId,
  });

  // Calculate monthly growth
  const { data: monthlyGrowth } = useQuery({
    queryKey: ["monthly-growth", clientId],
    queryFn: async () => {
      const now = new Date();
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const { data: thisMonth } = await supabase
        .from("tasks")
        .select("id")
        .eq("client_id", clientId)
        .eq("status", "completed")
        .gte("updated_at", startOfThisMonth.toISOString());

      const { data: lastMonth } = await supabase
        .from("tasks")
        .select("id")
        .eq("client_id", clientId)
        .eq("status", "completed")
        .gte("updated_at", startOfLastMonth.toISOString())
        .lte("updated_at", endOfLastMonth.toISOString());

      const thisMonthCount = thisMonth?.length || 0;
      const lastMonthCount = lastMonth?.length || 0;
      
      const growthPercent = lastMonthCount > 0 
        ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100 
        : thisMonthCount > 0 ? 100 : 0;

      return { thisMonthCount, lastMonthCount, growthPercent };
    },
    enabled: !!clientId,
  });

  const { data: recentTasks = [] } = useQuery({
    queryKey: ["public-recent-tasks", clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", clientId)
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(10);
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
    approved: { color: "bg-success", label: "אושר" },
    rejected: { color: "bg-destructive", label: "נדחה" },
  };

  const isLoading = isLoadingClient || isLoadingStats || isLoadingCredits;
  const showCredits = credits?.show_credits_to_client !== false;

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
          <div className="space-y-8">
            {/* Credits Section */}
            {showCredits && credits && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CreditMeter 
                  totalCredits={credits.total_credits} 
                  usedCredits={credits.used_credits} 
                />
                <CreditHistory transactions={transactions} maxHeight="250px" />
              </div>
            )}

            {/* Monthly Growth Card */}
            {monthlyGrowth && (
              <div className="bg-card rounded-xl border border-border p-6 opacity-0 animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      monthlyGrowth.growthPercent >= 0 ? "bg-success/20" : "bg-destructive/20"
                    )}>
                      {monthlyGrowth.growthPercent >= 0 ? (
                        <ArrowUpRight className="w-6 h-6 text-success" />
                      ) : (
                        <ArrowDownRight className="w-6 h-6 text-destructive" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold">צמיחה חודשית</h3>
                      <p className="text-sm text-muted-foreground">בהשוואה לחודש שעבר</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className={cn(
                      "text-3xl font-bold",
                      monthlyGrowth.growthPercent >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {monthlyGrowth.growthPercent >= 0 ? "+" : ""}{monthlyGrowth.growthPercent.toFixed(0)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {monthlyGrowth.thisMonthCount} משימות החודש (לעומת {monthlyGrowth.lastMonthCount})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard title="קמפיינים פעילים" value={stats?.activeCampaigns || 0} icon={<Megaphone className="w-5 h-5" />} delay={0.15} />
              <MetricCard title="משימות פתוחות" value={stats?.openTasks || 0} icon={<CheckSquare className="w-5 h-5" />} delay={0.2} />
              <MetricCard title="חשיפות" value={formatNumber(stats?.totalImpressions || 0)} icon={<Eye className="w-5 h-5" />} delay={0.25} />
              <MetricCard title="המרות" value={stats?.totalConversions || 0} icon={<TrendingUp className="w-5 h-5" />} delay={0.3} />
            </div>

            {/* Completed Tasks with Credits */}
            <div className="bg-card rounded-xl border border-border opacity-0 animate-slide-up" style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  משימות שהושלמו
                </h3>
                <span className="text-sm text-muted-foreground">
                  סה״כ {stats?.totalCreditsUsed || 0} קרדיטים ({creditsToHours(stats?.totalCreditsUsed || 0).toFixed(1)} שעות)
                </span>
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {recentTasks.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">אין משימות שהושלמו</div>
                ) : (
                  recentTasks.map((task: any) => (
                    <div key={task.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {task.assignee || "צוות JIY"}
                            {task.updated_at && ` • ${format(new Date(task.updated_at), "dd/MM/yyyy")}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-sm">
                            <Coins className="w-4 h-4 text-jiy-gold" />
                            {task.credits_cost || 60}
                          </span>
                          <span className={cn("px-2 py-1 rounded-full text-xs font-medium bg-success text-foreground")}>
                            הושלם
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Task Requests Status */}
            {taskRequests.length > 0 && (
              <div className="bg-card rounded-xl border border-border opacity-0 animate-slide-up" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
                <div className="p-4 border-b border-border">
                  <h3 className="font-bold">בקשות משימות שלי</h3>
                </div>
                <div className="divide-y divide-border max-h-60 overflow-y-auto">
                  {taskRequests.map((request: any) => (
                    <div key={request.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(request.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                          </p>
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium text-foreground",
                          statusConfig[request.status]?.color || "bg-muted"
                        )}>
                          {statusConfig[request.status]?.label || request.status}
                        </span>
                      </div>
                      {request.rejection_reason && (
                        <p className="mt-2 text-sm text-destructive">{request.rejection_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Task & Upsell */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.45s", animationFillMode: "forwards" }}>
                <TaskRequestForm clientId={clientId} />
              </div>
              <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.5s", animationFillMode: "forwards" }}>
                <UpsellSuggestions />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-12 py-6 text-center text-sm text-muted-foreground">
        <p>דוח זה נוצר אוטומטית • {format(new Date(), "dd/MM/yyyy HH:mm", { locale: he })}</p>
      </footer>
    </div>
  );
}

function MetricCard({ title, value, icon, delay }: { title: string; value: string | number; icon: React.ReactNode; delay: number }) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm opacity-0 animate-slide-up" style={{ animationDelay: `${delay}s`, animationFillMode: "forwards" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">{icon}</div>
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
