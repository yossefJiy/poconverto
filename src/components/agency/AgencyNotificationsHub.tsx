import { Bell, AlertTriangle, Users, CheckSquare, Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

interface AgencyNotificationsHubProps {
  pendingRequests: number;
  urgentTasks: number;
}

interface Notification {
  id: string;
  type: "request" | "urgent" | "overdue" | "approval";
  title: string;
  description: string;
  time: string;
  link: string;
}

export function AgencyNotificationsHub({ pendingRequests, urgentTasks }: AgencyNotificationsHubProps) {
  // Fetch recent task requests
  const { data: recentRequests = [] } = useQuery({
    queryKey: ["recent-task-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("task_requests")
        .select("id, title, created_at, clients:clients!task_requests_client_id_fkey(name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Fetch overdue tasks
  const { data: overdueTasks = [] } = useQuery({
    queryKey: ["overdue-tasks-hub"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("tasks")
        .select("id, title, due_date, clients:clients!tasks_client_id_fkey(name)")
        .neq("status", "completed")
        .lt("due_date", today)
        .order("due_date", { ascending: true })
        .limit(5);
      return data || [];
    },
  });

  // Build notifications list
  const notifications: Notification[] = [
    ...recentRequests.map((req: any) => ({
      id: `req-${req.id}`,
      type: "request" as const,
      title: "בקשת משימה חדשה",
      description: `${req.title} - ${req.clients?.name || "לקוח לא ידוע"}`,
      time: formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: he }),
      link: "/tasks?tab=requests",
    })),
    ...overdueTasks.map((task: any) => ({
      id: `overdue-${task.id}`,
      type: "overdue" as const,
      title: "משימה באיחור",
      description: `${task.title} - ${task.clients?.name || "פנימי"}`,
      time: `יעד: ${new Date(task.due_date).toLocaleDateString("he-IL")}`,
      link: "/tasks",
    })),
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request":
        return <Users className="w-4 h-4 text-info" />;
      case "urgent":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "overdue":
        return <Clock className="w-4 h-4 text-destructive" />;
      case "approval":
        return <CheckSquare className="w-4 h-4 text-success" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="w-5 h-5" />
          התראות
          {(pendingRequests > 0 || urgentTasks > 0) && (
            <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
              {pendingRequests + urgentTasks}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Link 
            to="/tasks?tab=requests"
            className="p-3 rounded-lg bg-info/10 hover:bg-info/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <Users className="w-4 h-4 text-info" />
              <span className="text-lg font-bold">{pendingRequests}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">בקשות ממתינות</p>
          </Link>
          <Link 
            to="/tasks?priority=urgent"
            className="p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-lg font-bold">{urgentTasks}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">משימות דחופות</p>
          </Link>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">אין התראות חדשות</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {notifications.slice(0, 8).map((notification) => (
              <Link
                key={notification.id}
                to={notification.link}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{notification.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{notification.description}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{notification.time}</p>
                </div>
                <ArrowLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
              </Link>
            ))}
          </div>
        )}

        {notifications.length > 8 && (
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link to="/tasks">צפה בכל ההתראות</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}