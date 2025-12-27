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
  Trash2
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
import { TaskEditDialog } from "@/components/tasks/TaskEditDialog";
import { TaskItem } from "@/components/tasks/TaskItem";
import { useTranslation } from "@/hooks/useTranslation";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assignee: string | null;
  department: string | null;
  parent_task_id: string | null;
  assigned_member_id: string | null;
  reminder_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  completion_notes: string | null;
  completed_at: string | null;
  client_id: string | null;
}

export default function Tasks() {
  const { t } = useTranslation();
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  
  const [filter, setFilter] = useState<"all" | "assignee" | "department">("all");
  const [selectedValue, setSelectedValue] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Fetch tasks with team member relations
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select("*, team_members(id, name, name_en, name_hi, departments)")
        .order("created_at", { ascending: false });
      
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Map the team_members relation to assigned_member
      return data.map((task: any) => ({
        ...task,
        assigned_member: task.team_members,
      }));
    },
  });

  // Fetch active team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { error } = await supabase.from("tasks").insert({
        client_id: selectedClient?.id || null,
        title: task.title!,
        description: task.description,
        priority: task.priority || "medium",
        status: task.status || "pending",
        assignee: task.assignee,
        assigned_member_id: task.assigned_member_id,
        department: task.department,
        due_date: task.due_date,
        reminder_date: task.reminder_date,
        estimated_hours: task.estimated_hours,
        parent_task_id: task.parent_task_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(t("task_created"));
      setEditDialogOpen(false);
      setSelectedTask(null);
      setParentTaskId(null);
    },
    onError: () => toast.error(t("error_creating_task")),
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async (task: Partial<Task> & { id: string }) => {
      const updateData: any = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        assignee: task.assignee,
        assigned_member_id: task.assigned_member_id,
        department: task.department,
        due_date: task.due_date,
        reminder_date: task.reminder_date,
        estimated_hours: task.estimated_hours,
        actual_hours: task.actual_hours,
        completion_notes: task.completion_notes,
      };
      
      // Set completed_at when status changes to completed
      if (task.status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
      
      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(t("task_updated"));
      setEditDialogOpen(false);
      setSelectedTask(null);
    },
    onError: () => toast.error(t("error_updating_task")),
  });

  // Update status mutation (quick toggle)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
      
      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(t("status_updated"));
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // First delete all subtasks
      const subtaskIds = tasks
        .filter(t => t.parent_task_id === taskId)
        .map(t => t.id);
      
      if (subtaskIds.length > 0) {
        const { error: subtaskError } = await supabase
          .from("tasks")
          .delete()
          .in("id", subtaskIds);
        if (subtaskError) throw subtaskError;
      }
      
      // Then delete the main task
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(t("task_deleted"));
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: () => toast.error(t("error_deleting_task")),
  });

  // Handle save (create or update)
  const handleSave = (taskData: Partial<Task>) => {
    if (selectedTask?.id) {
      updateMutation.mutate({ ...taskData, id: selectedTask.id });
    } else {
      createMutation.mutate(taskData);
    }
  };

  // Open edit dialog for new task
  const handleNewTask = () => {
    setSelectedTask(null);
    setParentTaskId(null);
    setEditDialogOpen(true);
  };

  // Open edit dialog for existing task
  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setParentTaskId(null);
    setEditDialogOpen(true);
  };

  // Open edit dialog for new subtask
  const handleAddSubtask = (parentId: string) => {
    setSelectedTask(null);
    setParentTaskId(parentId);
    setEditDialogOpen(true);
  };

  // Open delete confirmation
  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  // Filter logic
  const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];
  const departments = [...new Set(tasks.map(t => t.department).filter(Boolean))];

  const filteredTasks = tasks.filter(task => {
    if (filter === "all" || !selectedValue) return true;
    if (filter === "assignee") return task.assignee === selectedValue;
    if (filter === "department") return task.department === selectedValue;
    return true;
  });

  // Get only root tasks (no parent) for list view
  const rootTasks = filteredTasks.filter(t => !t.parent_task_id);

  return (
    <MainLayout>
      <div className="p-8">
        <PageHeader 
          title={selectedClient ? `${t("tasks")} - ${selectedClient.name}` : t("task_management")}
          description={t("by_employee_client_department")}
          actions={
            <Button className="glow" onClick={handleNewTask}>
              <Plus className="w-4 h-4 ml-2" />
              {t("new_task")}
            </Button>
          }
        />

        {/* Filters & View Toggle */}
        <div className="flex items-center justify-between gap-4 mb-8 opacity-0 animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
              <button
                onClick={() => { setFilter("all"); setSelectedValue(""); }}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  filter === "all" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {t("all")}
              </button>
              <button
                onClick={() => setFilter("assignee")}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                  filter === "assignee" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <User className="w-4 h-4" />
                {t("employee")}
              </button>
              <button
                onClick={() => setFilter("department")}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                  filter === "department" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <Building2 className="w-4 h-4" />
                {t("department")}
              </button>
            </div>

            {filter !== "all" && (
              <Select value={selectedValue} onValueChange={setSelectedValue}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={`${t("select")} ${filter === "assignee" ? t("employee") : t("department")}`} />
                </SelectTrigger>
                <SelectContent>
                  {filter === "assignee" && assignees.map(a => <SelectItem key={a} value={a!}>{a}</SelectItem>)}
                  {filter === "department" && departments.map(d => <SelectItem key={d} value={d!}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
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
          <div className="glass rounded-xl p-12 text-center">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t("no_tasks")}</h3>
            <p className="text-muted-foreground">{t("create_first_task")}</p>
          </div>
        ) : viewMode === "list" ? (
          /* List View with Hierarchy */
          <div className="glass rounded-xl overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
            {rootTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                allTasks={filteredTasks}
                teamMembers={teamMembers}
                onEdit={handleEditTask}
                onAddSubtask={handleAddSubtask}
                onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task, index) => (
              <TaskGridCard
                key={task.id}
                task={task}
                index={index}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <TaskEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={selectedTask}
        parentTaskId={parentTaskId}
        teamMembers={teamMembers}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_task")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_task_confirm")} "{taskToDelete?.title}"?
              {tasks.some(t => t.parent_task_id === taskToDelete?.id) && (
                <span className="block mt-2 text-destructive">
                  {t("subtasks_will_be_deleted")}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => taskToDelete && deleteMutation.mutate(taskToDelete.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

// Grid Card Component
function TaskGridCard({ 
  task, 
  index, 
  onEdit, 
  onDelete,
  onStatusChange 
}: { 
  task: Task; 
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const { t } = useTranslation();
  
  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    pending: { color: "text-warning", bg: "bg-warning/10", label: t("pending") },
    "in-progress": { color: "text-info", bg: "bg-info/10", label: t("in_progress") },
    review: { color: "text-purple-400", bg: "bg-purple-400/10", label: t("review") },
    completed: { color: "text-success", bg: "bg-success/10", label: t("completed") },
  };
  
  const priorityConfig: Record<string, { color: string; label: string }> = {
    low: { color: "bg-muted", label: t("low") },
    medium: { color: "bg-warning", label: t("medium") },
    high: { color: "bg-destructive", label: t("high") },
    urgent: { color: "bg-destructive animate-pulse", label: t("urgent") },
  };

  const status = statusConfig[task.status] || statusConfig.pending;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;

  return (
    <div 
      className="glass rounded-xl card-shadow opacity-0 animate-slide-up group"
      style={{ animationDelay: `${0.15 + index * 0.05}s`, animationFillMode: "forwards" }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", priority.color)} />
            <span className="text-xs text-muted-foreground">{priority.label}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => onEdit(task)}
            >
              <Filter className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-destructive"
              onClick={() => onDelete(task)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <h3 className={cn(
          "font-bold mb-2 line-clamp-2",
          task.status === "completed" && "line-through text-muted-foreground"
        )}>
          {task.title}
        </h3>
        
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
            <span className={cn(
              "flex items-center gap-1",
              new Date(task.due_date) < new Date() && task.status !== "completed" && "text-destructive"
            )}>
              {new Date(task.due_date).toLocaleDateString("he-IL")}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            onClick={() => {
              const nextStatus = task.status === "pending" ? "in-progress" 
                : task.status === "in-progress" ? "completed" 
                : "pending";
              onStatusChange(task.id, nextStatus);
            }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80",
              status.bg, status.color
            )}
          >
            {status.label}
          </button>
          {task.parent_task_id && (
            <span className="text-xs text-muted-foreground">{t("subtask")}</span>
          )}
        </div>
      </div>
    </div>
  );
}