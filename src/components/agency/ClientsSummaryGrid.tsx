import { Building2, CheckSquare, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Client {
  id: string;
  name: string;
  is_master_account?: boolean;
  logo_url?: string;
  industry?: string;
}

interface Task {
  id: string;
  client_id: string;
  status: string;
  priority?: string;
  due_date?: string;
}

interface ClientsSummaryGridProps {
  clients: Client[];
  tasks: Task[];
}

export function ClientsSummaryGrid({ clients, tasks }: ClientsSummaryGridProps) {
  // Filter out master account
  const regularClients = clients.filter(c => !c.is_master_account);

  const getClientStats = (clientId: string) => {
    const clientTasks = tasks.filter(t => t.client_id === clientId);
    const openTasks = clientTasks.length;
    const urgentTasks = clientTasks.filter(t => t.priority === "urgent" || t.priority === "high").length;
    const todayStr = new Date().toISOString().split("T")[0];
    const todayTasks = clientTasks.filter(t => t.due_date === todayStr).length;
    const overdueTasks = clientTasks.filter(t => t.due_date && t.due_date < todayStr).length;
    
    return { openTasks, urgentTasks, todayTasks, overdueTasks };
  };

  const getHealthColor = (stats: ReturnType<typeof getClientStats>) => {
    if (stats.overdueTasks > 0) return "destructive";
    if (stats.urgentTasks > 2) return "warning";
    return "success";
  };

  if (regularClients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>אין לקוחות פעילים</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {regularClients.map((client) => {
        const stats = getClientStats(client.id);
        const healthColor = getHealthColor(stats);

        return (
          <Link
            key={client.id}
            to={`/dashboard?client=${client.id}`}
            className={cn(
              "block p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200",
              "hover:shadow-md hover:-translate-y-0.5"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {client.logo_url ? (
                  <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden shadow-sm">
                    <img 
                      src={client.logo_url} 
                      alt={client.name}
                      className="w-full h-full object-contain p-0.5"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-foreground">{client.name}</h4>
                  {client.industry && (
                    <p className="text-xs text-muted-foreground">{client.industry}</p>
                  )}
                </div>
              </div>
              <Badge 
                variant={healthColor === "success" ? "default" : healthColor === "warning" ? "secondary" : "destructive"}
                className="text-xs"
              >
                {healthColor === "success" ? "תקין" : healthColor === "warning" ? "דורש תשומת לב" : "דחוף"}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-muted/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckSquare className="w-3 h-3 text-muted-foreground" />
                </div>
                <p className="text-lg font-bold">{stats.openTasks}</p>
                <p className="text-xs text-muted-foreground">פתוחות</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                </div>
                <p className="text-lg font-bold">{stats.todayTasks}</p>
                <p className="text-xs text-muted-foreground">היום</p>
              </div>
              <div className={cn(
                "p-2 rounded",
                stats.overdueTasks > 0 ? "bg-destructive/10" : "bg-muted/50"
              )}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <AlertTriangle className={cn(
                    "w-3 h-3",
                    stats.overdueTasks > 0 ? "text-destructive" : "text-muted-foreground"
                  )} />
                </div>
                <p className={cn(
                  "text-lg font-bold",
                  stats.overdueTasks > 0 && "text-destructive"
                )}>{stats.overdueTasks}</p>
                <p className="text-xs text-muted-foreground">באיחור</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}