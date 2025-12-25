import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  User,
  Building2,
  Filter,
  Plus,
  Calendar,
  Paperclip,
  MessageSquare,
  MoreVertical,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  client: string;
  assignee: string;
  department: "design" | "content" | "ads" | "strategy" | "development";
  status: "pending" | "in-progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: string;
  assets: number;
  comments: number;
}

const tasks: Task[] = [
  {
    id: "1",
    title: "עיצוב באנר לקמפיין קיץ",
    description: "עיצוב 5 גרסאות באנר בגדלים שונים לפייסבוק ואינסטגרם",
    client: "חברת אלפא",
    assignee: "יעל כהן",
    department: "design",
    status: "in-progress",
    priority: "high",
    dueDate: "היום",
    assets: 3,
    comments: 5,
  },
  {
    id: "2",
    title: "כתיבת תוכן לפוסט אינסטגרם",
    description: "סדרת 10 פוסטים לחודש יולי עם קריאה לפעולה",
    client: "סטארטאפ בטא",
    assignee: "דני לוי",
    department: "content",
    status: "pending",
    priority: "medium",
    dueDate: "מחר",
    assets: 0,
    comments: 2,
  },
  {
    id: "3",
    title: "אופטימיזציה לקמפיין גוגל",
    description: "שיפור CTR ו-Quality Score למילות מפתח עיקריות",
    client: "חברת גמא",
    assignee: "מיכל אברהם",
    department: "ads",
    status: "completed",
    priority: "high",
    dueDate: "אתמול",
    assets: 2,
    comments: 8,
  },
  {
    id: "4",
    title: "דו״ח ביצועים חודשי",
    description: "הכנת דו״ח מקיף עם ניתוח והמלצות לשיפור",
    client: "חברת דלתא",
    assignee: "רון שמיר",
    department: "strategy",
    status: "review",
    priority: "low",
    dueDate: "עוד 3 ימים",
    assets: 5,
    comments: 1,
  },
  {
    id: "5",
    title: "בניית דף נחיתה",
    description: "עיצוב ופיתוח דף נחיתה להשקת מוצר חדש",
    client: "חברת אלפא",
    assignee: "נועה גולן",
    department: "development",
    status: "in-progress",
    priority: "urgent",
    dueDate: "היום",
    assets: 7,
    comments: 12,
  },
  {
    id: "6",
    title: "סקריפט לסרטון תדמית",
    description: "כתיבת סקריפט לסרטון 2 דקות",
    client: "סטארטאפ בטא",
    assignee: "דני לוי",
    department: "content",
    status: "pending",
    priority: "medium",
    dueDate: "עוד 5 ימים",
    assets: 1,
    comments: 3,
  },
];

const statusConfig = {
  pending: { icon: Circle, color: "text-warning", bg: "bg-warning/10", label: "ממתין" },
  "in-progress": { icon: Clock, color: "text-info", bg: "bg-info/10", label: "בתהליך" },
  review: { icon: Clock, color: "text-purple-400", bg: "bg-purple-400/10", label: "בבדיקה" },
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "הושלם" },
};

const priorityConfig = {
  low: { color: "bg-muted", text: "text-muted-foreground", label: "נמוכה" },
  medium: { color: "bg-warning", text: "text-warning", label: "בינונית" },
  high: { color: "bg-destructive", text: "text-destructive", label: "גבוהה" },
  urgent: { color: "bg-destructive animate-pulse-glow", text: "text-destructive", label: "דחוף" },
};

const departmentConfig = {
  design: { color: "bg-pink-500/10 text-pink-400", label: "עיצוב" },
  content: { color: "bg-blue-500/10 text-blue-400", label: "תוכן" },
  ads: { color: "bg-green-500/10 text-green-400", label: "פרסום" },
  strategy: { color: "bg-purple-500/10 text-purple-400", label: "אסטרטגיה" },
  development: { color: "bg-orange-500/10 text-orange-400", label: "פיתוח" },
};

type FilterType = "all" | "client" | "assignee" | "department";

export default function Tasks() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedValue, setSelectedValue] = useState<string>("");

  const clients = [...new Set(tasks.map(t => t.client))];
  const assignees = [...new Set(tasks.map(t => t.assignee))];
  const departments = Object.keys(departmentConfig) as Array<keyof typeof departmentConfig>;

  const filteredTasks = tasks.filter(task => {
    if (filter === "all" || !selectedValue) return true;
    if (filter === "client") return task.client === selectedValue;
    if (filter === "assignee") return task.assignee === selectedValue;
    if (filter === "department") return task.department === selectedValue;
    return true;
  });

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <div>
            <h1 className="text-3xl font-bold mb-2">ניהול משימות</h1>
            <p className="text-muted-foreground">לפי עובד, לקוח ומחלקה</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors glow">
            <Plus className="w-4 h-4" />
            <span>משימה חדשה</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-8 opacity-0 animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
            <button
              onClick={() => { setFilter("all"); setSelectedValue(""); }}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                filter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              הכל
            </button>
            <button
              onClick={() => setFilter("client")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                filter === "client" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <Building2 className="w-4 h-4" />
              לקוח
            </button>
            <button
              onClick={() => setFilter("assignee")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                filter === "assignee" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <User className="w-4 h-4" />
              עובד
            </button>
            <button
              onClick={() => setFilter("department")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                filter === "department" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <Filter className="w-4 h-4" />
              מחלקה
            </button>
          </div>

          {filter !== "all" && (
            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              className="bg-secondary border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="">בחר {filter === "client" ? "לקוח" : filter === "assignee" ? "עובד" : "מחלקה"}</option>
              {filter === "client" && clients.map(c => <option key={c} value={c}>{c}</option>)}
              {filter === "assignee" && assignees.map(a => <option key={a} value={a}>{a}</option>)}
              {filter === "department" && departments.map(d => <option key={d} value={d}>{departmentConfig[d].label}</option>)}
            </select>
          )}
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task, index) => {
            const status = statusConfig[task.status];
            const priority = priorityConfig[task.priority];
            const department = departmentConfig[task.department];
            const StatusIcon = status.icon;

            return (
              <div 
                key={task.id}
                className="glass rounded-xl card-shadow opacity-0 animate-slide-up glass-hover group"
                style={{ animationDelay: `${0.15 + index * 0.05}s`, animationFillMode: "forwards" }}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", priority.color)} />
                      <span className={cn("px-2 py-0.5 rounded-full text-xs", department.color)}>
                        {department.label}
                      </span>
                    </div>
                    <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold mb-2 line-clamp-2">{task.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{task.description}</p>

                  {/* Client & Assignee */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {task.client}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {task.assignee}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1 text-xs">
                        <Paperclip className="w-3 h-3" />
                        {task.assets}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <MessageSquare className="w-3 h-3" />
                        {task.comments}
                      </span>
                      <span className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        {task.dueDate}
                      </span>
                    </div>
                    <span className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                      status.bg, status.color
                    )}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
