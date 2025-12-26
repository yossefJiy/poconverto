import { MainLayout } from "@/components/layout/MainLayout";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Briefcase,
  Globe,
  FileText,
  BarChart3,
  Users,
  ChevronLeft,
  Plus,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TaskItem } from "@/components/tasks/TaskItem";
import { TaskEditDialog } from "@/components/tasks/TaskEditDialog";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { LanguageSwitcher, useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";

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

interface TeamMember {
  id: string;
  name: string;
  name_en: string | null;
  name_hi: string | null;
  departments: string[];
  email: string | null;
  is_active: boolean;
}

export default function ClientProfile() {
  const { clientId } = useParams<{ clientId: string }>();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parentTaskIdForNew, setParentTaskIdForNew] = useState<string | null>(null);

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
      return data as Task[];
    },
    enabled: !!clientId,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as TeamMember[];
    },
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

  const updateTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<Task> & { id?: string }) => {
      const { id, ...rest } = taskData;
      if (id) {
        const { error } = await supabase
          .from("tasks")
          .update(rest)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tasks")
          .insert([{ 
            title: rest.title || 'משימה חדשה',
            client_id: clientId,
            ...rest 
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-tasks", clientId] });
      toast.success(t('save'));
      setIsDialogOpen(false);
      setEditingTask(null);
      setParentTaskIdForNew(null);
    },
    onError: (error) => {
      toast.error("שגיאה בשמירה");
      console.error(error);
    },
  });

  const updateTeamMemberMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TeamMember> }) => {
      const { error } = await supabase
        .from("team_members")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success(t('save'));
    },
  });

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setParentTaskIdForNew(null);
    setIsDialogOpen(true);
  };

  const handleAddSubtask = (parentId: string) => {
    setEditingTask(null);
    setParentTaskIdForNew(parentId);
    setIsDialogOpen(true);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setParentTaskIdForNew(null);
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (taskId: string, status: string) => {
    const updates: Partial<Task> = { 
      status,
      completed_at: status === 'completed' ? new Date().toISOString() : null
    };
    
    await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId);
    
    queryClient.invalidateQueries({ queryKey: ["client-tasks", clientId] });
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    updateTaskMutation.mutate({
      ...taskData,
      id: editingTask?.id,
    });
  };

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

  // Only root tasks (no parent)
  const rootTasks = tasks.filter(t => !t.parent_task_id);
  
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Group tasks by assignee
  const tasksByAssignee = rootTasks.reduce((acc, task) => {
    const assignee = task.assignee || t('not_assigned', 'לא מוקצה');
    if (!acc[assignee]) acc[assignee] = [];
    acc[assignee].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  // Group tasks by department
  const tasksByDepartment = rootTasks.reduce((acc, task) => {
    const dept = task.department || "כללי";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <MainLayout>
      <div className="p-8">
        {/* Language Switcher */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            to="/clients" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {language === 'en' ? 'Back to Clients' : language === 'hi' ? 'ग्राहकों पर वापस जाएं' : 'חזרה ללקוחות'}
          </Link>
          <LanguageSwitcher />
        </div>

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
                    {language === 'en' ? 'Website' : language === 'hi' ? 'वेबसाइट' : 'אתר'}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(client.created_at).toLocaleDateString(
                    language === 'he' ? 'he-IL' : language === 'hi' ? 'hi-IN' : 'en-US'
                  )}
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
              {language === 'en' ? 'Description' : language === 'hi' ? 'विवरण' : 'תיאור'}
            </h3>
            <p className="text-muted-foreground">{client.description}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-6 opacity-0 animate-slide-up" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <span className="text-muted-foreground text-sm">{t('tasks')}</span>
            </div>
            <p className="text-3xl font-bold">{totalTasks}</p>
          </div>

          <div className="glass rounded-xl p-6 opacity-0 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <span className="text-muted-foreground text-sm">{t('completed')}</span>
            </div>
            <p className="text-3xl font-bold text-success">{completedTasks}</p>
          </div>

          <div className="glass rounded-xl p-6 opacity-0 animate-slide-up" style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Clock className="w-5 h-5 text-info" />
              </div>
              <span className="text-muted-foreground text-sm">{t('in_progress')}</span>
            </div>
            <p className="text-3xl font-bold text-info">{inProgressTasks}</p>
          </div>

          <div className="glass rounded-xl p-6 opacity-0 animate-slide-up" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Circle className="w-5 h-5 text-warning" />
              </div>
              <span className="text-muted-foreground text-sm">{t('pending')}</span>
            </div>
            <p className="text-3xl font-bold text-warning">{pendingTasks}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="glass rounded-xl p-6 mb-8 opacity-0 animate-slide-up" style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              {language === 'en' ? 'Overall Progress' : language === 'hi' ? 'समग्र प्रगति' : 'התקדמות כללית'}
            </h3>
            <span className="text-lg font-bold">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="opacity-0 animate-slide-up" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
          <TabsList className="mb-6">
            <TabsTrigger value="tasks">{t('tasks')} ({totalTasks})</TabsTrigger>
            <TabsTrigger value="by-assignee">{language === 'en' ? 'By Assignee' : language === 'hi' ? 'सौंपे गए द्वारा' : 'לפי עובד'}</TabsTrigger>
            <TabsTrigger value="by-department">{t('department')}</TabsTrigger>
            <TabsTrigger value="team">{t('team_members')}</TabsTrigger>
            <TabsTrigger value="campaigns">{language === 'en' ? 'Campaigns' : language === 'hi' ? 'अभियान' : 'קמפיינים'} ({campaigns.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <div className="mb-4">
              <Button onClick={handleAddTask}>
                <Plus className="w-4 h-4 mr-2" />
                {t('add_task')}
              </Button>
            </div>
            <div className="glass rounded-xl overflow-hidden">
              {tasksLoading ? (
                <div className="p-6">
                  <Skeleton className="h-20" />
                </div>
              ) : rootTasks.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  {language === 'en' ? 'No tasks for this client' : language === 'hi' ? 'इस ग्राहक के लिए कोई कार्य नहीं' : 'אין משימות ללקוח זה'}
                </div>
              ) : (
                rootTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    allTasks={tasks}
                    teamMembers={teamMembers}
                    onEdit={handleEditTask}
                    onAddSubtask={handleAddSubtask}
                    onStatusChange={handleStatusChange}
                  />
                ))
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
                        <User className="w-4 h-4" />
                        {assignee}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {assigneeTasks.filter(t => t.status === "completed").length}/{assigneeTasks.length} {t('completed')}
                      </span>
                    </div>
                  </div>
                  {assigneeTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      allTasks={tasks}
                      teamMembers={teamMembers}
                      onEdit={handleEditTask}
                      onAddSubtask={handleAddSubtask}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
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
                        {deptTasks.filter(t => t.status === "completed").length}/{deptTasks.length} {t('completed')}
                      </span>
                    </div>
                  </div>
                  {deptTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      allTasks={tasks}
                      teamMembers={teamMembers}
                      onEdit={handleEditTask}
                      onAddSubtask={handleAddSubtask}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="team">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  onUpdate={(id, updates) => updateTeamMemberMutation.mutate({ id, updates })}
                  isLoading={updateTeamMemberMutation.isPending}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="campaigns">
            {campaigns.length === 0 ? (
              <div className="glass rounded-xl p-6 text-center text-muted-foreground">
                {language === 'en' ? 'No campaigns for this client' : language === 'hi' ? 'इस ग्राहक के लिए कोई अभियान नहीं' : 'אין קמפיינים ללקוח זה'}
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
                        {campaign.status === "active" ? (language === 'en' ? 'Active' : language === 'hi' ? 'सक्रिय' : 'פעיל') : campaign.status}
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

        {/* Task Edit Dialog */}
        <TaskEditDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          task={editingTask}
          parentTaskId={parentTaskIdForNew}
          teamMembers={teamMembers}
          onSave={handleSaveTask}
          isLoading={updateTaskMutation.isPending}
        />
      </div>
    </MainLayout>
  );
}
