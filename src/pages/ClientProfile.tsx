import { MainLayout } from "@/components/layout/MainLayout";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Briefcase,
  Globe,
  FileText,
  BarChart3,
  Users,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
  pending: { icon: Circle, color: "text-warning", bg: "bg-warning/10", label: "ממתין" },
  "in-progress": { icon: Clock, color: "text-info", bg: "bg-info/10", label: "בתהליך" },
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "הושלם" },
};

const priorityConfig = {
  low: { color: "bg-muted", label: "נמוכה" },
  medium: { color: "bg-warning", label: "בינונית" },
  high: { color: "bg-destructive", label: "גבוהה" },
};

export default function ClientProfile() {
  const { clientId } = useParams<{ clientId: string }>();

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["client-tasks", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("client_id", clientId)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["client-campaigns", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("client_id", clientId);
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  if (clientLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!client) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">לקוח לא נמצא</h1>
          <Link to="/clients" className="text-primary hover:underline">
            חזרה לרשימת הלקוחות
          </Link>
        </div>
      </MainLayout>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Group tasks by assignee
  const tasksByAssignee = tasks.reduce((acc, task) => {
    const assignee = task.assignee || "לא מוקצה";
    if (!acc[assignee]) acc[assignee] = [];
    acc[assignee].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  // Group tasks by department
  const tasksByDepartment = tasks.reduce((acc, task) => {
    const dept = task.department || "כללי";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  return (
    <MainLayout>
      <div className="p-8">
        {/* Back Link */}
        <Link 
          to="/clients" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          חזרה ללקוחות
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{client.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                {client.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {client.industry}
                  </span>
                )}
                {client.website && (
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                    <Globe className="w-4 h-4" />
                    אתר
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(client.created_at).toLocaleDateString("he-IL")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {client.description && (
          <div className="glass rounded-xl p-6 mb-8 opacity-0 animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              תיאור
            </h3>
            <p className="text-muted-foreground">{client.description}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-6 opacity-0 animate-slide-up" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <span className="text-muted-foreground text-sm">סה״כ משימות</span>
            </div>
            <p className="text-3xl font-bold">{totalTasks}</p>
          </div>

          <div className="glass rounded-xl p-6 opacity-0 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <span className="text-muted-foreground text-sm">הושלמו</span>
            </div>
            <p className="text-3xl font-bold text-success">{completedTasks}</p>
          </div>

          <div className="glass rounded-xl p-6 opacity-0 animate-slide-up" style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Clock className="w-5 h-5 text-info" />
              </div>
              <span className="text-muted-foreground text-sm">בתהליך</span>
            </div>
            <p className="text-3xl font-bold text-info">{inProgressTasks}</p>
          </div>

          <div className="glass rounded-xl p-6 opacity-0 animate-slide-up" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Circle className="w-5 h-5 text-warning" />
              </div>
              <span className="text-muted-foreground text-sm">ממתינות</span>
            </div>
            <p className="text-3xl font-bold text-warning">{pendingTasks}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="glass rounded-xl p-6 mb-8 opacity-0 animate-slide-up" style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              התקדמות כללית
            </h3>
            <span className="text-lg font-bold">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="opacity-0 animate-slide-up" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
          <TabsList className="mb-6">
            <TabsTrigger value="tasks">משימות ({totalTasks})</TabsTrigger>
            <TabsTrigger value="by-assignee">לפי עובד</TabsTrigger>
            <TabsTrigger value="by-department">לפי מחלקה</TabsTrigger>
            <TabsTrigger value="campaigns">קמפיינים ({campaigns.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <div className="glass rounded-xl divide-y divide-border">
              {tasksLoading ? (
                <div className="p-6">
                  <Skeleton className="h-20" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  אין משימות ללקוח זה
                </div>
              ) : (
                tasks.map((task) => {
                  const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.pending;
                  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
                  const StatusIcon = status.icon;

                  return (
                    <div key={task.id} className="p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-lg", status.bg)}>
                          <StatusIcon className={cn("w-5 h-5", status.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{task.title}</h3>
                            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priority.color)} />
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            {task.assignee && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assignee}
                              </span>
                            )}
                            {task.department && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {task.department}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.due_date).toLocaleDateString("he-IL")}
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                        <span className={cn("px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap", status.bg, status.color)}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="by-assignee">
            <div className="space-y-6">
              {Object.entries(tasksByAssignee).map(([assignee, assigneeTasks]) => (
                <div key={assignee} className="glass rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {assignee}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {assigneeTasks.filter(t => t.status === "completed").length}/{assigneeTasks.length} הושלמו
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {assigneeTasks.map((task) => {
                      const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      return (
                        <div key={task.id} className="p-3 flex items-center gap-3">
                          <StatusIcon className={cn("w-4 h-4", status.color)} />
                          <span className="flex-1 truncate">{task.title}</span>
                          {task.due_date && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(task.due_date).toLocaleDateString("he-IL")}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="by-department">
            <div className="space-y-6">
              {Object.entries(tasksByDepartment).map(([dept, deptTasks]) => (
                <div key={dept} className="glass rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {dept}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {deptTasks.filter(t => t.status === "completed").length}/{deptTasks.length} הושלמו
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-border">
                    {deptTasks.map((task) => {
                      const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      return (
                        <div key={task.id} className="p-3 flex items-center gap-3">
                          <StatusIcon className={cn("w-4 h-4", status.color)} />
                          <span className="flex-1 truncate">{task.title}</span>
                          <span className="text-xs text-muted-foreground">{task.assignee}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="campaigns">
            {campaigns.length === 0 ? (
              <div className="glass rounded-xl p-6 text-center text-muted-foreground">
                אין קמפיינים ללקוח זה
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="glass rounded-xl p-6">
                    <h3 className="font-semibold mb-2">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{campaign.platform}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn(
                        "px-2 py-1 rounded-full",
                        campaign.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {campaign.status === "active" ? "פעיל" : campaign.status}
                      </span>
                      {campaign.budget && (
                        <span className="text-muted-foreground">₪{campaign.budget.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
