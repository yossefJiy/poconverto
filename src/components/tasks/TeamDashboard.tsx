import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar,
  ChevronDown,
  ChevronLeft,
  User,
  Sun,
  Sunrise,
  Sunset,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  scheduled_time: string | null;
  assignee: string | null;
  department: string | null;
  category: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
}

const statusConfig: Record<string, { color: string; bg: string; label: string; icon: typeof Circle }> = {
  pending: { color: "text-warning", bg: "bg-warning/10", label: "ממתין", icon: Circle },
  "in-progress": { color: "text-info", bg: "bg-info/10", label: "בתהליך", icon: Clock },
  completed: { color: "text-success", bg: "bg-success/10", label: "הושלם", icon: CheckCircle2 },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "bg-muted", label: "נמוכה" },
  medium: { color: "bg-warning", label: "בינונית" },
  high: { color: "bg-destructive", label: "גבוהה" },
};

// Get time period icon and label
const getTimePeriod = (time: string | null) => {
  if (!time) return { icon: Calendar, label: "ללא שעה", period: "unscheduled" };
  const hour = parseInt(time.split(":")[0]);
  
  if (hour >= 6 && hour < 12) return { icon: Sunrise, label: "בוקר", period: "morning" };
  if (hour >= 12 && hour < 17) return { icon: Sun, label: "צהריים", period: "noon" };
  if (hour >= 17 && hour < 21) return { icon: Sunset, label: "ערב", period: "evening" };
  return { icon: Moon, label: "לילה", period: "night" };
};

const hebrewDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const hebrewMonths = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

export function TeamDashboard() {
  const { user } = useAuth();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Get user's profile to match with team member
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get team member info
  const { data: teamMember } = useQuery({
    queryKey: ["team-member", profile?.email],
    queryFn: async () => {
      if (!profile?.email) return null;
      const { data, error } = await supabase
        .from("team")
        .select("*")
        .eq("email", profile.email)
        .maybeSingle();
      if (error) throw error;
      return data as TeamMember | null;
    },
    enabled: !!profile?.email,
  });

  // Get tasks assigned to this team member (excluding completed)
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["my-tasks", teamMember?.name],
    queryFn: async () => {
      if (!teamMember?.name) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("assignee", teamMember.name)
        .neq("status", "completed")
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []).map(task => ({
        ...task,
        scheduled_time: (task as any).scheduled_time || null,
      })) as Task[];
    },
    enabled: !!teamMember?.name,
  });

  // Get completed tasks for today (for hours calculation)
  const { data: completedTodayTasks = [] } = useQuery({
    queryKey: ["my-completed-today", teamMember?.name],
    queryFn: async () => {
      if (!teamMember?.name) return [];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from("tasks")
        .select("id, duration_minutes, client_id, updated_at")
        .eq("assignee", teamMember.name)
        .eq("status", "completed")
        .gte("updated_at", todayStart.toISOString());
      if (error) throw error;
      return data || [];
    },
    enabled: !!teamMember?.name,
  });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayOfWeek = hebrewDays[today.getDay()];
  const dayOfMonth = today.getDate();
  const month = hebrewMonths[today.getMonth()];
  const year = today.getFullYear();
  
  // Get greeting based on time
  const hour = today.getHours();
  const greeting = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : hour < 21 ? "ערב טוב" : "לילה טוב";

  // Organize tasks
  const { todayTasks, upcomingTasks, overdueTasks, tasksByCategory } = useMemo(() => {
    const todayT: Task[] = [];
    const upcomingT: Task[] = [];
    const overdueT: Task[] = [];
    const byCat: Map<string, Task[]> = new Map();

    tasks.forEach(task => {
      if (task.due_date === todayStr) {
        todayT.push(task);
      } else if (task.due_date && task.due_date < todayStr) {
        overdueT.push(task);
      } else {
        upcomingT.push(task);
      }

      // Group by category
      const cat = task.category || "ללא קטגוריה";
      const existing = byCat.get(cat) || [];
      byCat.set(cat, [...existing, task]);
    });

    // Sort today tasks by scheduled time
    todayT.sort((a, b) => {
      if (!a.scheduled_time && !b.scheduled_time) return 0;
      if (!a.scheduled_time) return 1;
      if (!b.scheduled_time) return -1;
      return a.scheduled_time.localeCompare(b.scheduled_time);
    });

    return { 
      todayTasks: todayT, 
      upcomingTasks: upcomingT, 
      overdueTasks: overdueT,
      tasksByCategory: byCat 
    };
  }, [tasks, todayStr]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const displayName = profile?.full_name || teamMember?.name || "משתמש";

  const renderTask = (task: Task, showDate = false) => {
    const status = statusConfig[task.status] || statusConfig.pending;
    const priority = priorityConfig[task.priority] || priorityConfig.medium;
    const StatusIcon = status.icon;
    const time = task.scheduled_time?.slice(0, 5);

    return (
      <div 
        key={task.id} 
        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className={cn("p-1.5 rounded-lg", status.bg)}>
          <StatusIcon className={cn("w-4 h-4", status.color)} />
        </div>
        
        {time && (
          <span className="text-sm font-mono text-muted-foreground w-12 flex-shrink-0">
            {time}
          </span>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priority.color)} />
            <span className={cn("truncate", task.status === "completed" && "line-through text-muted-foreground")}>
              {task.title}
            </span>
          </div>
        </div>

        {showDate && task.due_date && (
          <span className={cn(
            "text-xs text-muted-foreground",
            task.due_date < todayStr && "text-destructive"
          )}>
            {new Date(task.due_date).toLocaleDateString("he-IL")}
          </span>
        )}

        <Badge variant="outline" className={cn("text-xs flex-shrink-0", status.bg, status.color)}>
          {status.label}
        </Badge>
      </div>
    );
  };

  if (!teamMember) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">לא נמצא פרופיל צוות</h3>
        <p className="text-muted-foreground">
          כדי לצפות בדשבורד האישי, יש לשייך את המייל שלך לעובד במערכת
        </p>
      </div>
    );
  }

  // Calculate stats
  const openTasksCount = tasks.length;
  const todayTasksCount = todayTasks.length;
  // Calculate hours from completed tasks today
  const totalMinutesToday = completedTodayTasks.reduce((sum, t: any) => sum + (t.duration_minutes || 60), 0);
  const hoursCompletedToday = (totalMinutesToday / 60).toFixed(1);
  const clientsHandledToday = new Set(completedTodayTasks.map((t: any) => t.client_id).filter(Boolean)).size;

  return (
    <div className="space-y-4">
      {/* Compact stats row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 text-sm">
          <Circle className="w-3 h-3 text-primary" />
          <span className="font-medium">{openTasksCount}</span>
          <span className="text-muted-foreground text-xs">פתוחות</span>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 text-sm">
          <Calendar className="w-3 h-3 text-warning" />
          <span className="font-medium">{todayTasksCount}</span>
          <span className="text-muted-foreground text-xs">להיום</span>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 text-sm">
          <Clock className="w-3 h-3 text-info" />
          <span className="font-medium">{hoursCompletedToday}</span>
          <span className="text-muted-foreground text-xs">שעות</span>
        </div>
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 text-sm">
          <User className="w-3 h-3 text-success" />
          <span className="font-medium">{clientsHandledToday}</span>
          <span className="text-muted-foreground text-xs">לקוחות</span>
        </div>
      </div>

      {/* Header with greeting */}
      <div className="glass rounded-xl p-4">
        <h1 className="text-xl font-bold mb-0.5">{greeting}, {displayName}!</h1>
        <p className="text-sm text-muted-foreground">
          יום {dayOfWeek}, {dayOfMonth} ב{month} {year}
        </p>
      </div>

      {/* Overdue tasks */}
      {overdueTasks.length > 0 && (
        <div className="glass rounded-xl overflow-hidden border-destructive/30 border">
          <div className="p-4 border-b border-destructive/30 bg-destructive/5">
            <h2 className="font-semibold text-destructive flex items-center gap-2">
              <Clock className="w-5 h-5" />
              משימות באיחור ({overdueTasks.length})
            </h2>
          </div>
          <div className="p-2">
            {overdueTasks.map(task => renderTask(task, true))}
          </div>
        </div>
      )}

      {/* Today's tasks by time */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            משימות להיום ({todayTasks.length})
          </h2>
        </div>
        
        {todayTasks.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-success" />
            <p>אין משימות להיום - יום נקי!</p>
          </div>
        ) : (
          <div className="p-2">
            {/* Group by time period */}
            {["morning", "noon", "evening", "night", "unscheduled"].map(period => {
              const periodTasks = todayTasks.filter(t => getTimePeriod(t.scheduled_time).period === period);
              if (periodTasks.length === 0) return null;
              
              const periodInfo = getTimePeriod(period === "unscheduled" ? null : `${period === "morning" ? "09" : period === "noon" ? "14" : period === "evening" ? "18" : "22"}:00`);
              const PeriodIcon = periodInfo.icon;
              
              return (
                <div key={period} className="mb-2 last:mb-0">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <PeriodIcon className="w-4 h-4" />
                    <span>{periodInfo.label}</span>
                  </div>
                  {periodTasks.map(task => renderTask(task))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tasks by category */}
      {tasksByCategory.size > 0 && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold">משימות נוספות לפי קטגוריה</h2>
          </div>
          <div className="divide-y divide-border">
            {Array.from(tasksByCategory.entries())
              .filter(([_, tasks]) => tasks.some(t => t.due_date !== todayStr))
              .map(([category, catTasks]) => {
                const futureTasks = catTasks.filter(t => t.due_date !== todayStr && t.due_date && t.due_date > todayStr);
                if (futureTasks.length === 0) return null;
                
                const isExpanded = expandedCategories.has(category);
                
                return (
                  <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{category}</span>
                        <Badge variant="secondary">{futureTasks.length}</Badge>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-2 pb-2">
                      {futureTasks.map(task => renderTask(task, true))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
          </div>
        </div>
      )}

    </div>
  );
}
