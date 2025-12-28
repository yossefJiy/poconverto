import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  User,
  Building2,
  Filter,
  Plus,
  Loader2,
  CheckSquare,
  List,
  LayoutGrid,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assignee: string | null;
  department: string | null;
  client_id: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  departments: string[];
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

export default function Tasks() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  
  const [filter, setFilter] = useState<"all" | "assignee" | "department">("all");
  const [selectedValue, setSelectedValue] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("pending");
  const [formPriority, setFormPriority] = useState("medium");
  const [formDueDate, setFormDueDate] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formDepartment, setFormDepartment] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (task: Partial<Task> & { id?: string }) => {
      if (task.id) {
        const { error } = await supabase
          .from("tasks")
          .update({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            due_date: task.due_date || null,
            assignee: task.assignee,
            department: task.department,
          })
          .eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").insert({
          client_id: selectedClient?.id || null,
          title: task.title!,
          description: task.description,
          priority: task.priority || "medium",
          status: task.status || "pending",
          assignee: task.assignee,
          department: task.department,
          due_date: task.due_date || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("המשימה נשמרה");
      closeDialog();
    },
    onError: () => toast.error("שגיאה בשמירת משימה"),
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

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("המשימה נמחקה");
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: () => toast.error("שגיאה במחיקת משימה"),
  });

  const openDialog = (task?: Task) => {
    setSelectedTask(task || null);
    setFormTitle(task?.title || "");
    setFormDescription(task?.description || "");
    setFormStatus(task?.status || "pending");
    setFormPriority(task?.priority || "medium");
    setFormDueDate(task?.due_date || "");
    setFormAssignee(task?.assignee || "");
    setFormDepartment(task?.department || "");
    setEditDialogOpen(true);
  };

  const closeDialog = () => {
    setEditDialogOpen(false);
    setSelectedTask(null);
    setFormTitle("");
    setFormDescription("");
    setFormStatus("pending");
    setFormPriority("medium");
    setFormDueDate("");
    setFormAssignee("");
    setFormDepartment("");
  };

  const handleSave = () => {
    if (!formTitle.trim()) {
      toast.error("נא להזין כותרת");
      return;
    }
    saveMutation.mutate({
      id: selectedTask?.id,
      title: formTitle,
      description: formDescription,
      status: formStatus,
      priority: formPriority,
      due_date: formDueDate || null,
      assignee: formAssignee || null,
      department: formDepartment || null,
    });
  };

  // Get unique values for filters
  const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];
  const departments = [...new Set([
    ...tasks.map(t => t.department).filter(Boolean),
    ...teamMembers.flatMap(m => m.departments)
  ])];

  const filteredTasks = tasks.filter(task => {
    if (filter === "all" || !selectedValue) return true;
    if (filter === "assignee") return task.assignee === selectedValue;
    if (filter === "department") return task.department === selectedValue;
    return true;
  });

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <PageHeader 
          title={selectedClient ? `משימות - ${selectedClient.name}` : "ניהול משימות"}
          description="לפי עובד, לקוח ומחלקה"
          actions={
            <Button className="glow" onClick={() => openDialog()}>
              <Plus className="w-4 h-4 ml-2" />
              משימה חדשה
            </Button>
          }
        />

        {/* Filters & View Toggle */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              <button
                onClick={() => { setFilter("all"); setSelectedValue(""); }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  filter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                הכל
              </button>
              <button
                onClick={() => setFilter("assignee")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                  filter === "assignee" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <User className="w-3 h-3" />
                עובד
              </button>
              <button
                onClick={() => setFilter("department")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1",
                  filter === "department" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <Building2 className="w-3 h-3" />
                מחלקה
              </button>
            </div>

            {filter !== "all" && (
              <Select value={selectedValue} onValueChange={setSelectedValue}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={filter === "assignee" ? "בחר עובד" : "בחר מחלקה"} />
                </SelectTrigger>
                <SelectContent>
                  {filter === "assignee" && assignees.map(a => <SelectItem key={a} value={a!}>{a}</SelectItem>)}
                  {filter === "department" && departments.map(d => <SelectItem key={d} value={d!}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-2 rounded-md transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-2 rounded-md transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tasks Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass rounded-xl p-8 md:p-12 text-center">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">אין משימות</h3>
            <p className="text-muted-foreground mb-4">צור את המשימה הראשונה</p>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 ml-2" />
              משימה חדשה
            </Button>
          </div>
        ) : viewMode === "list" ? (
          <div className="glass rounded-xl overflow-hidden">
            {filteredTasks.map((task) => {
              const status = statusConfig[task.status] || statusConfig.pending;
              const priority = priorityConfig[task.priority] || priorityConfig.medium;
              const StatusIcon = status.icon;
              
              return (
                <div key={task.id} className="p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => {
                        const nextStatus = task.status === "pending" ? "in-progress" : task.status === "in-progress" ? "completed" : "pending";
                        updateStatusMutation.mutate({ id: task.id, status: nextStatus });
                      }}
                      className={cn("p-2 rounded-lg transition-colors hover:opacity-80 flex-shrink-0", status.bg)}
                    >
                      <StatusIcon className={cn("w-5 h-5", status.color)} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={cn("font-medium", task.status === "completed" && "line-through text-muted-foreground")}>
                          {task.title}
                        </h3>
                        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priority.color)} title={priority.label} />
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        {task.assignee && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.assignee}
                          </span>
                        )}
                        {task.department && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {task.department}
                          </span>
                        )}
                        {task.due_date && (
                          <span className={cn(
                            "flex items-center gap-1",
                            new Date(task.due_date) < new Date() && task.status !== "completed" && "text-destructive"
                          )}>
                            <Calendar className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString("he-IL")}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{task.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(task)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setTaskToDelete(task); setDeleteDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <Badge variant="outline" className={cn("whitespace-nowrap flex-shrink-0", status.bg, status.color)}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task, index) => {
              const status = statusConfig[task.status] || statusConfig.pending;
              const priority = priorityConfig[task.priority] || priorityConfig.medium;
              
              return (
                <div 
                  key={task.id}
                  className="glass rounded-xl card-shadow opacity-0 animate-slide-up group"
                  style={{ animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: "forwards" }}
                >
                  <div className="p-4 md:p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", priority.color)} />
                        <span className="text-xs text-muted-foreground">{priority.label}</span>
                      </div>
                      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog(task)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setTaskToDelete(task); setDeleteDialogOpen(true); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <h3 className={cn("font-medium mb-2", task.status === "completed" && "line-through text-muted-foreground")}>
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {task.assignee && <span>{task.assignee}</span>}
                        {task.due_date && (
                          <span className={cn(new Date(task.due_date) < new Date() && task.status !== "completed" && "text-destructive")}>
                            {new Date(task.due_date).toLocaleDateString("he-IL")}
                          </span>
                        )}
                      </div>
                      <Badge variant="outline" className={cn("text-xs", status.bg, status.color)}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTask ? "עריכת משימה" : "משימה חדשה"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="כותרת המשימה" />
            </div>
            <div className="space-y-2">
              <Label>תיאור</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="תיאור המשימה" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>סטטוס</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">ממתין</SelectItem>
                    <SelectItem value="in-progress">בתהליך</SelectItem>
                    <SelectItem value="completed">הושלם</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>עדיפות</Label>
                <Select value={formPriority} onValueChange={setFormPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">נמוכה</SelectItem>
                    <SelectItem value="medium">בינונית</SelectItem>
                    <SelectItem value="high">גבוהה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>אחראי</Label>
                <Select value={formAssignee || "none"} onValueChange={(v) => setFormAssignee(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="בחר אחראי" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {teamMembers.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>מחלקה</Label>
                <Select value={formDepartment || "none"} onValueChange={(v) => setFormDepartment(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="בחר מחלקה" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {departments.map((d) => <SelectItem key={d} value={d!}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>תאריך יעד</Label>
              <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeDialog}>ביטול</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                שמור
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת משימה</AlertDialogTitle>
            <AlertDialogDescription>האם למחוק את "{taskToDelete?.title}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={() => taskToDelete && deleteMutation.mutate(taskToDelete.id)} className="bg-destructive hover:bg-destructive/90">
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
