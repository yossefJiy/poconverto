import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Building2, 
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  ExternalLink,
  MoreVertical,
  Plus,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
  industry: string | null;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  created_at: string;
}

const statusConfig = {
  active: { color: "text-success", bg: "bg-success/10", label: "פעיל" },
  paused: { color: "text-warning", bg: "bg-warning/10", label: "מושהה" },
  churned: { color: "text-destructive", bg: "bg-destructive/10", label: "עזב" },
};

export default function Clients() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: taskCounts = {} } = useQuery({
    queryKey: ["client-task-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("client_id, status");
      if (error) throw error;
      
      const counts: Record<string, { total: number; completed: number }> = {};
      data.forEach((task) => {
        if (task.client_id) {
          if (!counts[task.client_id]) {
            counts[task.client_id] = { total: 0, completed: 0 };
          }
          counts[task.client_id].total++;
          if (task.status === "completed") {
            counts[task.client_id].completed++;
          }
        }
      });
      return counts;
    },
  });

  const { data: campaignCounts = {} } = useQuery({
    queryKey: ["client-campaign-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("client_id, status");
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach((campaign) => {
        if (campaign.client_id && campaign.status === "active") {
          counts[campaign.client_id] = (counts[campaign.client_id] || 0) + 1;
        }
      });
      return counts;
    },
  });

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <div>
            <h1 className="text-3xl font-bold mb-2">לקוחות</h1>
            <p className="text-muted-foreground">ניהול ומעקב אחר לקוחות</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors glow">
            <Plus className="w-4 h-4" />
            <span>לקוח חדש</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : clients.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">אין לקוחות עדיין</h3>
            <p className="text-muted-foreground">הוסף לקוח חדש כדי להתחיל</p>
          </div>
        ) : (
          /* Clients Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clients.map((client, index) => {
              const clientTasks = taskCounts[client.id] || { total: 0, completed: 0 };
              const activeCampaigns = campaignCounts[client.id] || 0;
              const performance = clientTasks.total > 0 
                ? Math.round((clientTasks.completed / clientTasks.total) * 100) 
                : 0;
              const performanceColor = performance >= 50 ? "text-success" : "text-warning";
              
              return (
                <div 
                  key={client.id}
                  className="glass rounded-xl card-shadow opacity-0 animate-slide-up glass-hover"
                  style={{ animationDelay: `${0.1 + index * 0.08}s`, animationFillMode: "forwards" }}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold">{client.name}</h3>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              statusConfig.active.bg, statusConfig.active.color
                            )}>
                              {statusConfig.active.label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{client.industry || "לא צוין"}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            לקוח מ{new Date(client.created_at).toLocaleDateString("he-IL", { month: "long", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Description */}
                    {client.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{client.description}</p>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Target className="w-4 h-4" />
                          <span className="text-xs">משימות</span>
                        </div>
                        <p className="text-xl font-bold">{clientTasks.total}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Building2 className="w-4 h-4" />
                          <span className="text-xs">קמפיינים פעילים</span>
                        </div>
                        <p className="text-xl font-bold">{activeCampaigns}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs">הושלמו</span>
                        </div>
                        <p className="text-xl font-bold">{clientTasks.completed}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-xs">התקדמות</span>
                        </div>
                        <p className={cn("text-xl font-bold", performanceColor)}>
                          {performance}%
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Link 
                        to={`/client/${client.id}`}
                        className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium text-center"
                      >
                        צפה בפרטים
                      </Link>
                      {client.website && (
                        <a 
                          href={client.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
