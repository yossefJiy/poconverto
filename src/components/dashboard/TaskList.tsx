import { CheckCircle2, Circle, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  client: string;
  assignee: string;
  status: "pending" | "in-progress" | "completed";
  dueDate: string;
  priority: "low" | "medium" | "high";
}

const tasks: Task[] = [
  {
    id: "1",
    title: "עיצוב באנר לקמפיין קיץ",
    client: "חברת אלפא",
    assignee: "יעל כהן",
    status: "in-progress",
    dueDate: "היום",
    priority: "high",
  },
  {
    id: "2",
    title: "כתיבת תוכן לפוסט אינסטגרם",
    client: "סטארטאפ בטא",
    assignee: "דני לוי",
    status: "pending",
    dueDate: "מחר",
    priority: "medium",
  },
  {
    id: "3",
    title: "אופטימיזציה לקמפיין גוגל",
    client: "חברת גמא",
    assignee: "מיכל אברהם",
    status: "completed",
    dueDate: "אתמול",
    priority: "high",
  },
  {
    id: "4",
    title: "דו״ח ביצועים חודשי",
    client: "חברת דלתא",
    assignee: "רון שמיר",
    status: "pending",
    dueDate: "עוד 3 ימים",
    priority: "low",
  },
];

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

export function TaskList() {
  return (
    <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold">משימות אחרונות</h2>
      </div>
      <div className="divide-y divide-border">
        {tasks.map((task, index) => {
          const status = statusConfig[task.status];
          const priority = priorityConfig[task.priority];
          const StatusIcon = status.icon;

          return (
            <div 
              key={task.id} 
              className="p-4 hover:bg-muted/30 transition-colors cursor-pointer opacity-0 animate-fade-in"
              style={{ animationDelay: `${0.4 + index * 0.1}s`, animationFillMode: "forwards" }}
            >
              <div className="flex items-start gap-4">
                <div className={cn("p-2 rounded-lg", status.bg)}>
                  <StatusIcon className={cn("w-5 h-5", status.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{task.title}</h3>
                    <span className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      priority.color
                    )} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{task.client}</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {task.assignee}
                    </span>
                    <span>{task.dueDate}</span>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  status.bg, status.color
                )}>
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
