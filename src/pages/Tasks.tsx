import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  User,
  Building2,
  Filter,
  Plus,
  Calendar,
  MoreVertical,
  Loader2,
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  pending: { icon: Circle, color: "text-warning", bg: "bg-warning/10", label: "ממתין" },
  "in-progress": { icon: Clock, color: "text-info", bg: "bg-info/10", label: "בתהליך" },
  review: { icon: Clock, color: "text-purple-400", bg: "bg-purple-400/10", label: "בבדיקה" },
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "הושלם" },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "bg-muted", label: "נמוכה" },
  medium: { color: "bg-warning", label: "בינונית" },
  high: { color: "bg-destructive", label: "גבוהה" },
  urgent: { color: "bg-destructive animate-pulse", label: "דחוף" },
};

export default function Tasks() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "assignee" | "department">("all");
  const [selectedValue, setSelectedValue] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    assignee: "",
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*, team_members(name)")
        .order("created_at", { ascending: false });
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (task: typeof newTask) => {
      const { error } = await supabase.from("tasks").insert({
        client_id: selectedClient?.id || null,
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignee: task.assignee,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("המשימה נוצרה בהצלחה");
      setShowDialog(false);
      setNewTask({ title: "", description: "", priority: "medium", assignee: "" });
    },
    onError: () => toast.error("שגיאה ביצירת משימה"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("הסטטוס עודכן");
    },
  });

  const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];
  const departments = [...new Set(tasks.map(t => t.department).filter(Boolean))];

  const filteredTasks = tasks.filter(task => {
    if (filter === "all" || !selectedValue) return true;
    if (filter === "assignee") return task.assignee === selectedValue;
    if (filter === "department") return task.department === selectedValue;
    return true;
  });

  return (
    <MainLayout>
      <div className="p-8">
        <PageHeader 
          title={selectedClient ? `משימות - ${selectedClient.name}` : "ניהול משימות"}
          description="לפי עובד, לקוח ומחלקה"
          actions={
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="glow">
                  <Plus className="w-4 h-4 ml-2" />
                  משימה חדשה
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>משימה חדשה</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="כותרת המשימה"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="תיאור"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                  <Select
                    value={newTask.priority}
                    onValueChange={(v) => setNewTask({ ...newTask, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="עדיפות" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={newTask.assignee}
                    onValueChange={(v) => setNewTask({ ...newTask, assignee: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="משויך ל..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.name}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    className="w-full" 
                    onClick={() => createMutation.mutate(newTask)}
                    disabled={!newTask.title || createMutation.isPending}
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "צור משימה"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

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
            <Select value={selectedValue} onValueChange={setSelectedValue}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={`בחר ${filter === "assignee" ? "עובד" : "מחלקה"}`} />
              </SelectTrigger>
              <SelectContent>
                {filter === "assignee" && assignees.map(a => <SelectItem key={a} value={a!}>{a}</SelectItem>)}
                {filter === "department" && departments.map(d => <SelectItem key={d} value={d!}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">אין משימות</h3>
            <p className="text-muted-foreground">צור משימה חדשה כדי להתחיל</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task, index) => {
              const status = statusConfig[task.status] || statusConfig.pending;
              const priority = priorityConfig[task.priority] || priorityConfig.medium;
              const StatusIcon = status.icon;

              return (
                <div 
                  key={task.id}
                  className="glass rounded-xl card-shadow opacity-0 animate-slide-up group"
                  style={{ animationDelay: `${0.15 + index * 0.05}s`, animationFillMode: "forwards" }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", priority.color)} />
                        <span className="text-xs text-muted-foreground">{priority.label}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {Object.entries(statusConfig).map(([key, { label }]) => (
                            <DropdownMenuItem 
                              key={key}
                              onClick={() => updateStatusMutation.mutate({ id: task.id, status: key })}
                            >
                              {label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-bold mb-2 line-clamp-2">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      {task.assignee && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {task.assignee}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.due_date).toLocaleDateString("he-IL")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
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
        )}
      </div>
    </MainLayout>
  );
}
