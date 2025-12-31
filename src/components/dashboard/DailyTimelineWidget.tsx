import { useMemo } from "react";
import { format, parseISO, isToday, isBefore, startOfDay } from "date-fns";
import { he } from "date-fns/locale";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import logoIcon from "@/assets/logo-icon.svg";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  scheduled_time?: string | null;
  duration_minutes?: number;
  due_date?: string | null;
  client_id?: string | null;
  clients?: { name: string; is_master_account?: boolean } | null;
}

interface DailyTimelineWidgetProps {
  tasks: Task[];
  masterClientId?: string;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

const priorityConfig: Record<string, { color: string; label: string }> = {
  high: { color: "bg-destructive/20 text-destructive border-destructive/50", label: "גבוהה" },
  medium: { color: "bg-warning/20 text-warning border-warning/50", label: "בינונית" },
  low: { color: "bg-muted text-muted-foreground border-border", label: "נמוכה" },
};

const statusConfig: Record<string, { icon: typeof Clock; color: string }> = {
  pending: { icon: Clock, color: "text-warning" },
  "in-progress": { icon: Clock, color: "text-info" },
  completed: { icon: CheckCircle2, color: "text-success" },
};

export function DailyTimelineWidget({ tasks, masterClientId }: DailyTimelineWidgetProps) {
  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    const today = startOfDay(new Date());
    
    // Filter tasks for today
    const todayTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = parseISO(task.due_date);
      return isToday(dueDate) || isBefore(dueDate, today);
    });

    const scheduled: (Task & { hour: number })[] = [];
    const unscheduled: Task[] = [];

    todayTasks.forEach(task => {
      if (task.scheduled_time) {
        const [hours] = task.scheduled_time.split(':').map(Number);
        if (hours >= 8 && hours <= 20) {
          scheduled.push({ ...task, hour: hours });
        } else {
          unscheduled.push(task);
        }
      } else {
        unscheduled.push(task);
      }
    });

    // Sort scheduled by time
    scheduled.sort((a, b) => a.hour - b.hour);

    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [tasks]);

  const isJiyTask = (task: Task) => {
    return task.clients?.is_master_account || 
           task.client_id === masterClientId ||
           task.clients?.name?.toLowerCase().includes("jiy") ||
           task.clients?.name?.includes("סוכנות");
  };

  const renderTask = (task: Task, showTime?: boolean) => {
    const isJiy = isJiyTask(task);
    const StatusIcon = statusConfig[task.status]?.icon || Clock;
    const duration = task.duration_minutes || 60;

    return (
      <div
        key={task.id}
        className={cn(
          "p-3 rounded-lg transition-all hover:scale-[1.02]",
          isJiy 
            ? "jiy-gold-border bg-card/90" 
            : "bg-muted/50 border border-border/50",
          task.status === "completed" && "opacity-60"
        )}
      >
        <div className="flex items-start gap-3">
          {isJiy && (
            <img src={logoIcon} alt="JIY" className="w-5 h-5 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {showTime && task.scheduled_time && (
                <span className="text-xs font-mono text-muted-foreground">
                  {task.scheduled_time.slice(0, 5)}
                </span>
              )}
              <StatusIcon className={cn("w-4 h-4", statusConfig[task.status]?.color)} />
              <span className="font-medium truncate">{task.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-xs", priorityConfig[task.priority]?.color)}>
                {priorityConfig[task.priority]?.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{duration} דק׳</span>
              {task.clients?.name && (
                <span className="text-xs text-muted-foreground truncate">
                  • {task.clients.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const currentHour = new Date().getHours();

  return (
    <div className="glass rounded-xl card-shadow overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-bold">לוח זמנים יומי</h3>
        </div>
        <span className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE, d בMMMM", { locale: he })}
        </span>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="p-4 space-y-1">
          {HOURS.map((hour) => {
            const hourTasks = scheduledTasks.filter(t => t.hour === hour);
            const isCurrentHour = hour === currentHour;

            return (
              <div key={hour} className="flex gap-3">
                {/* Time column */}
                <div className={cn(
                  "w-14 text-left text-sm font-mono py-2 flex-shrink-0",
                  isCurrentHour ? "text-primary font-bold" : "text-muted-foreground"
                )}>
                  {String(hour).padStart(2, '0')}:00
                </div>

                {/* Tasks column */}
                <div className={cn(
                  "flex-1 min-h-[48px] border-r-2 pr-3 py-1",
                  isCurrentHour ? "border-primary" : "border-border/50"
                )}>
                  {isCurrentHour && (
                    <div className="flex items-center gap-1 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs text-primary font-medium">עכשיו</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {hourTasks.map(task => renderTask(task, true))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Unscheduled tasks section */}
      {unscheduledTasks.length > 0 && (
        <div className="border-t border-border">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-warning" />
              <span className="text-sm font-medium">משימות ללא שעה מתוזמנת</span>
              <Badge variant="secondary" className="text-xs">{unscheduledTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {unscheduledTasks.map(task => renderTask(task, false))}
            </div>
          </div>
        </div>
      )}

      {scheduledTasks.length === 0 && unscheduledTasks.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>אין משימות להיום</p>
        </div>
      )}
    </div>
  );
}