import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  User,
  Building2,
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
  Edit2,
  Bell,
  Mail,
  Phone,
  ChevronDown,
  ChevronLeft,
  ListTree,
  Copy,
  Upload,
  LayoutDashboard
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
import { Switch } from "@/components/ui/switch";
import { TeamDashboard } from "@/components/tasks/TeamDashboard";

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
  client_id: string | null;
  category: string | null;
  reminder_at: string | null;
  notification_email: boolean;
  notification_sms: boolean;
  notification_phone: string | null;
  notification_email_address: string | null;
  reminder_sent: boolean;
  parent_id: string | null;
  order_index: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
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

const categoryOptions = [
  "אסטרטגיה ותכנון",
  "קריאייטיב ועיצוב",
  "קמפיינים ופרסום",
  "ניתוח נתונים",
  "תפעול וניהול",
  "פיתוח ומערכות",
  "תוכן ו-SEO",
  "לקוחות ומכירות",
  "מנהל מוצר",
];

// Time options for scheduler
const timeOptions = Array.from({ length: 24 }, (_, h) => 
  ["00", "30"].map(m => `${h.toString().padStart(2, "0")}:${m}`)
).flat();

export default function Tasks() {
  const { selectedClient } = useClient();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [showDashboard, setShowDashboard] = useState(false);
  const [filter, setFilter] = useState<"all" | "assignee" | "department">("all");
  const [selectedValue, setSelectedValue] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState("pending");
  const [formPriority, setFormPriority] = useState("medium");
  const [formDueDate, setFormDueDate] = useState("");
  const [formScheduledTime, setFormScheduledTime] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formReminderAt, setFormReminderAt] = useState("");
  const [formNotificationEmail, setFormNotificationEmail] = useState(false);
  const [formNotificationSms, setFormNotificationSms] = useState(false);
  const [formNotificationPhone, setFormNotificationPhone] = useState("");
  const [formNotificationEmailAddress, setFormNotificationEmailAddress] = useState("");
  const [formParentId, setFormParentId] = useState<string | null>(null);

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
      // Map database results to include new fields with defaults
      return (data || []).map(task => ({
        ...task,
        scheduled_time: (task as any).scheduled_time || null,
        parent_id: (task as any).parent_id || null,
        order_index: (task as any).order_index || 0,
      })) as Task[];
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

  // Organize tasks into parent-child structure
  const { parentTasks, childTasksMap } = useMemo(() => {
    const parents = tasks.filter(t => !t.parent_id);
    const childMap = new Map<string, Task[]>();
    
    tasks.filter(t => t.parent_id).forEach(task => {
      const existing = childMap.get(task.parent_id!) || [];
      childMap.set(task.parent_id!, [...existing, task]);
    });
    
    return { parentTasks: parents, childTasksMap: childMap };
  }, [tasks]);

  // Smart auto-assignment based on category and department
  const getSmartAssignee = (category: string, department: string): string => {
    if (!category && !department) return "";
    
    // Find team members that match the department
    const matchingMembers = teamMembers.filter(m => 
      m.departments.includes(department) || 
      (category && m.departments.some(d => d.toLowerCase().includes(category.toLowerCase())))
    );
    
    if (matchingMembers.length > 0) {
      // Return the first matching member (could be enhanced with load balancing)
      return matchingMembers[0].name;
    }
    
    return "";
  };

  // Auto-fill email when assignee changes
  const handleAssigneeChange = (name: string) => {
    setFormAssignee(name);
    const member = teamMembers.find(m => m.name === name);
    if (member?.email && !formNotificationEmailAddress) {
      setFormNotificationEmailAddress(member.email);
    }
    // Also set department from member's primary department
    if (member?.departments?.[0] && !formDepartment) {
      setFormDepartment(member.departments[0]);
    }
  };

  // Auto-suggest assignee when category/department changes
  const handleCategoryChange = (category: string) => {
    setFormCategory(category);
    if (!formAssignee && category) {
      const suggested = getSmartAssignee(category, formDepartment);
      if (suggested) {
        handleAssigneeChange(suggested);
        toast.info(`שויך אוטומטית ל: ${suggested}`);
      }
    }
  };

  const handleDepartmentChange = (department: string) => {
    setFormDepartment(department);
    if (!formAssignee && department) {
      const suggested = getSmartAssignee(formCategory, department);
      if (suggested) {
        handleAssigneeChange(suggested);
        toast.info(`שויך אוטומטית ל: ${suggested}`);
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (task: Partial<Task> & { id?: string }) => {
      const taskData = {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date || null,
        scheduled_time: task.scheduled_time || null,
        assignee: task.assignee,
        department: task.department,
        category: task.category || null,
        reminder_at: task.reminder_at || null,
        notification_email: task.notification_email || false,
        notification_sms: task.notification_sms || false,
        notification_phone: task.notification_phone || null,
        notification_email_address: task.notification_email_address || null,
        reminder_sent: false,
        parent_id: task.parent_id || null,
        order_index: task.order_index || 0,
      };

      if (task.id) {
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").insert({
          ...taskData,
          client_id: selectedClient?.id || null,
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

  const bulkImportMutation = useMutation({
    mutationFn: async (tasksText: string) => {
      const lines = tasksText.split("\n").filter(line => line.trim());
      const tasksToCreate = lines.map((line, index) => ({
        title: line.trim(),
        status: "pending",
        priority: "medium",
        client_id: selectedClient?.id || null,
        order_index: index,
      }));

      const { error } = await supabase.from("tasks").insert(tasksToCreate);
      if (error) throw error;
      return tasksToCreate.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`${count} משימות נוספו בהצלחה`);
      setBulkImportDialogOpen(false);
      setBulkImportText("");
    },
    onError: () => toast.error("שגיאה בייבוא משימות"),
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

  const duplicateMutation = useMutation({
    mutationFn: async (task: Task) => {
      const { id, ...taskData } = task;
      const { error } = await supabase.from("tasks").insert({
        ...taskData,
        title: `${task.title} (העתק)`,
        status: "pending",
        reminder_sent: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("המשימה שוכפלה");
    },
  });

  const openDialog = (task?: Task, parentId?: string) => {
    setSelectedTask(task || null);
    setFormTitle(task?.title || "");
    setFormDescription(task?.description || "");
    setFormStatus(task?.status || "pending");
    setFormPriority(task?.priority || "medium");
    setFormDueDate(task?.due_date || "");
    setFormScheduledTime(task?.scheduled_time?.slice(0, 5) || "");
    setFormAssignee(task?.assignee || "");
    setFormDepartment(task?.department || "");
    setFormCategory(task?.category || "");
    setFormReminderAt(task?.reminder_at ? task.reminder_at.slice(0, 16) : "");
    setFormNotificationEmail(task?.notification_email || false);
    setFormNotificationSms(task?.notification_sms || false);
    setFormNotificationPhone(task?.notification_phone || "");
    setFormNotificationEmailAddress(task?.notification_email_address || "");
    setFormParentId(parentId || task?.parent_id || null);
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
    setFormScheduledTime("");
    setFormAssignee("");
    setFormDepartment("");
    setFormCategory("");
    setFormReminderAt("");
    setFormNotificationEmail(false);
    setFormNotificationSms(false);
    setFormNotificationPhone("");
    setFormNotificationEmailAddress("");
    setFormParentId(null);
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
      scheduled_time: formScheduledTime ? `${formScheduledTime}:00` : null,
      assignee: formAssignee || null,
      department: formDepartment || null,
      category: formCategory || null,
      reminder_at: formReminderAt ? new Date(formReminderAt).toISOString() : null,
      notification_email: formNotificationEmail,
      notification_sms: formNotificationSms,
      notification_phone: formNotificationPhone || null,
      notification_email_address: formNotificationEmailAddress || null,
      reminder_sent: false,
      parent_id: formParentId,
      order_index: selectedTask?.order_index || 0,
    });
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Get unique values for filters
  const assignees = [...new Set(tasks.map(t => t.assignee).filter(Boolean))];
  const departments = [...new Set([
    ...tasks.map(t => t.department).filter(Boolean),
    ...teamMembers.flatMap(m => m.departments)
  ])];

  const filteredTasks = parentTasks.filter(task => {
    if (filter === "all" || !selectedValue) return true;
    if (filter === "assignee") return task.assignee === selectedValue;
    if (filter === "department") return task.department === selectedValue;
    return true;
  });

  // Format time for display
  const formatTime = (time: string | null) => {
    if (!time) return null;
    return time.slice(0, 5);
  };

  // Render task row (used for both parent and child tasks)
  const renderTaskRow = (task: Task, isSubtask = false) => {
    const status = statusConfig[task.status] || statusConfig.pending;
    const priority = priorityConfig[task.priority] || priorityConfig.medium;
    const StatusIcon = status.icon;
    const childTasks = childTasksMap.get(task.id) || [];
    const hasChildren = childTasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    
    return (
      <div key={task.id}>
        <div className={cn(
          "p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group",
          isSubtask && "bg-muted/20 pr-12"
        )}>
          <div className="flex items-start gap-3">
            {!isSubtask && hasChildren ? (
              <button
                onClick={() => toggleExpanded(task.id)}
                className="p-2 rounded-lg transition-colors hover:bg-muted flex-shrink-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  const nextStatus = task.status === "pending" ? "in-progress" : task.status === "in-progress" ? "completed" : "pending";
                  updateStatusMutation.mutate({ id: task.id, status: nextStatus });
                }}
                className={cn("p-2 rounded-lg transition-colors hover:opacity-80 flex-shrink-0", status.bg)}
              >
                <StatusIcon className={cn("w-5 h-5", status.color)} />
              </button>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {isSubtask && <ListTree className="w-4 h-4 text-muted-foreground" />}
                <h3 className={cn("font-medium", task.status === "completed" && "line-through text-muted-foreground")}>
                  {task.title}
                </h3>
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priority.color)} title={priority.label} />
                {hasChildren && (
                  <Badge variant="secondary" className="text-xs">
                    {childTasks.length} תתי-משימות
                  </Badge>
                )}
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
                    {task.scheduled_time && (
                      <span className="mr-1">
                        <Clock className="w-3 h-3 inline ml-1" />
                        {formatTime(task.scheduled_time)}
                      </span>
                    )}
                  </span>
                )}
              </div>

              {task.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-1">{task.description}</p>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {!isSubtask && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(undefined, task.id)} title="הוסף תת-משימה">
                  <Plus className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateMutation.mutate(task)} title="שכפל">
                <Copy className="w-4 h-4" />
              </Button>
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
        
        {/* Render child tasks */}
        {hasChildren && isExpanded && (
          <div className="border-r-2 border-primary/20 mr-6">
            {childTasks.map(child => renderTaskRow(child, true))}
          </div>
        )}
      </div>
    );
  };

  // Show dashboard view
  if (showDashboard) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8">
          <PageHeader 
            title="הדשבורד שלי"
            description="משימות להיום ולקראת"
            actions={
              <Button variant="outline" onClick={() => setShowDashboard(false)}>
                <List className="w-4 h-4 ml-2" />
                תצוגה מלאה
              </Button>
            }
          />
          <TeamDashboard />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <PageHeader 
          title={selectedClient ? `משימות - ${selectedClient.name}` : "ניהול משימות"}
          description="לפי עובד, לקוח ומחלקה"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowDashboard(true)}>
                <LayoutDashboard className="w-4 h-4 ml-2" />
                הדשבורד שלי
              </Button>
              <Button variant="outline" onClick={() => setBulkImportDialogOpen(true)}>
                <Upload className="w-4 h-4 ml-2" />
                ייבוא בכמות
              </Button>
              <Button className="glow" onClick={() => openDialog()}>
                <Plus className="w-4 h-4 ml-2" />
                משימה חדשה
              </Button>
            </div>
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
            {filteredTasks.map((task) => renderTaskRow(task))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task, index) => {
              const status = statusConfig[task.status] || statusConfig.pending;
              const priority = priorityConfig[task.priority] || priorityConfig.medium;
              const childTasks = childTasksMap.get(task.id) || [];
              
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
                        {childTasks.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {childTasks.length} תתי-משימות
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog(undefined, task.id)}>
                          <Plus className="w-3 h-3" />
                        </Button>
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
                            {task.scheduled_time && ` ${formatTime(task.scheduled_time)}`}
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
            <DialogTitle>
              {selectedTask ? "עריכת משימה" : formParentId ? "תת-משימה חדשה" : "משימה חדשה"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {formParentId && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm text-muted-foreground">
                <ListTree className="w-4 h-4" />
                <span>תת-משימה של: {tasks.find(t => t.id === formParentId)?.title}</span>
              </div>
            )}
            
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
                <Select value={formAssignee || "none"} onValueChange={(v) => handleAssigneeChange(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="בחר אחראי" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {teamMembers.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>מחלקה</Label>
                <Select value={formDepartment || "none"} onValueChange={(v) => handleDepartmentChange(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="בחר מחלקה" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {departments.map((d) => <SelectItem key={d} value={d!}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>תאריך יעד</Label>
                <Input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>שעה מתוכננת</Label>
                <Select value={formScheduledTime || "none"} onValueChange={(v) => setFormScheduledTime(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="בחר שעה" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    {timeOptions.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <Select value={formCategory || "none"} onValueChange={(v) => handleCategoryChange(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Reminder Section */}
            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <Label className="font-medium">תזכורת והתראות</Label>
              </div>
              
              <div className="space-y-2">
                <Label>שעת תזכורת</Label>
                <Input 
                  type="datetime-local" 
                  value={formReminderAt} 
                  onChange={(e) => setFormReminderAt(e.target.value)} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Label>שלח מייל</Label>
                </div>
                <Switch 
                  checked={formNotificationEmail} 
                  onCheckedChange={setFormNotificationEmail} 
                />
              </div>

              {formNotificationEmail && (
                <Input 
                  type="email" 
                  placeholder="כתובת מייל" 
                  value={formNotificationEmailAddress} 
                  onChange={(e) => setFormNotificationEmailAddress(e.target.value)} 
                />
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <Label>שלח SMS</Label>
                </div>
                <Switch 
                  checked={formNotificationSms} 
                  onCheckedChange={setFormNotificationSms} 
                />
              </div>

              {formNotificationSms && (
                <Input 
                  type="tel" 
                  placeholder="מספר טלפון" 
                  value={formNotificationPhone} 
                  onChange={(e) => setFormNotificationPhone(e.target.value)} 
                />
              )}
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

      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportDialogOpen} onOpenChange={setBulkImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ייבוא משימות בכמות</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>הזן משימות (כל שורה = משימה אחת)</Label>
              <Textarea 
                value={bulkImportText} 
                onChange={(e) => setBulkImportText(e.target.value)} 
                placeholder={`לדוגמה:\nעיצוב באנר לקמפיין\nכתיבת תוכן לפוסט\nאופטימיזציה לקמפיין גוגל`}
                rows={8}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {bulkImportText.split("\n").filter(l => l.trim()).length} משימות יתווספו
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setBulkImportDialogOpen(false)}>ביטול</Button>
              <Button 
                onClick={() => bulkImportMutation.mutate(bulkImportText)} 
                disabled={bulkImportMutation.isPending || !bulkImportText.trim()}
              >
                {bulkImportMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                ייבא משימות
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
            <AlertDialogDescription>
              האם למחוק את "{taskToDelete?.title}"?
              {childTasksMap.get(taskToDelete?.id || "")?.length ? (
                <span className="block mt-2 text-destructive">
                  שים לב: {childTasksMap.get(taskToDelete?.id || "")?.length} תתי-משימות ימחקו גם כן!
                </span>
              ) : null}
            </AlertDialogDescription>
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
