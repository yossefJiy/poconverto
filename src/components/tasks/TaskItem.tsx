import { useState, forwardRef } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  User,
  Calendar,
  Bell,
  Edit2,
  Plus,
  Briefcase,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

interface TeamMember {
  id: string;
  name: string;
  name_en: string | null;
  name_hi: string | null;
  departments: string[];
}

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
  subtasks?: Task[];
  assigned_member?: TeamMember | null;
}

interface TaskItemProps {
  task: Task;
  allTasks: Task[];
  teamMembers: TeamMember[];
  onEdit: (task: Task) => void;
  onAddSubtask: (parentId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  onDelete: (task: Task) => void;
  level?: number;
}

const statusConfig = {
  pending: { icon: Circle, color: 'text-warning', bg: 'bg-warning/10', labelKey: 'pending' },
  'in-progress': { icon: Clock, color: 'text-info', bg: 'bg-info/10', labelKey: 'in_progress' },
  completed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', labelKey: 'completed' },
};

const priorityConfig = {
  low: { color: 'bg-muted', labelKey: 'low' },
  medium: { color: 'bg-warning', labelKey: 'medium' },
  high: { color: 'bg-destructive', labelKey: 'high' },
};

export const TaskItem = forwardRef<HTMLDivElement, TaskItemProps>(function TaskItem({ 
  task, 
  allTasks, 
  teamMembers,
  onEdit, 
  onAddSubtask, 
  onStatusChange,
  onDelete,
  level = 0 
}, ref) {
  const { t, language } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const subtasks = allTasks.filter(t => t.parent_task_id === task.id);
  const hasSubtasks = subtasks.length > 0;
  
  const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.pending;
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const StatusIcon = status.icon;

  // Get member name based on language
  const getMemberName = (member: TeamMember | null | undefined) => {
    if (!member) return task.assignee || t('not_assigned', 'לא מוקצה');
    if (language === 'en' && member.name_en) return member.name_en;
    if (language === 'hi' && member.name_hi) return member.name_hi;
    return member.name;
  };

  // Check if parent task is completed (for subtask context)
  const parentTask = task.parent_task_id 
    ? allTasks.find(t => t.id === task.parent_task_id) 
    : null;

  // Get other subtasks status (siblings)
  const siblingTasks = task.parent_task_id 
    ? allTasks.filter(t => t.parent_task_id === task.parent_task_id && t.id !== task.id)
    : [];
  
  const completedSiblings = siblingTasks.filter(t => t.status === 'completed').length;
  const totalSiblings = siblingTasks.length;

  // Check if reminder is upcoming
  const hasUpcomingReminder = task.reminder_date && new Date(task.reminder_date) > new Date();
  const isReminderSoon = task.reminder_date && 
    new Date(task.reminder_date).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;

  // Calculate subtasks completion
  const completedSubtasks = subtasks.filter(st => st.status === 'completed').length;

  return (
    <div className={cn("border-b border-border last:border-b-0", level > 0 && "mr-6 border-r-2 border-primary/20")}>
      <div className={cn(
        "p-4 hover:bg-muted/30 transition-colors",
        level > 0 && "bg-muted/10"
      )}>
        <div className="flex items-start gap-3">
          {/* Expand/Collapse for subtasks */}
          <div className="w-6 flex-shrink-0">
            {hasSubtasks && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Status Icon */}
          <button
            onClick={() => {
              const nextStatus = task.status === 'pending' ? 'in-progress' 
                : task.status === 'in-progress' ? 'completed' 
                : 'pending';
              onStatusChange(task.id, nextStatus);
            }}
            className={cn("p-2 rounded-lg transition-colors hover:opacity-80", status.bg)}
          >
            <StatusIcon className={cn("w-5 h-5", status.color)} />
          </button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className={cn(
                "font-medium",
                task.status === 'completed' && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h3>
              
              {/* Priority Badge */}
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", priority.color)} 
                    title={t(priority.labelKey)} />
              
              {/* Reminder indicator */}
              {hasUpcomingReminder && (
                <Badge variant={isReminderSoon ? "destructive" : "outline"} className="text-xs">
                  <Bell className="w-3 h-3 mr-1" />
                  {new Date(task.reminder_date!).toLocaleDateString(
                    language === 'he' ? 'he-IL' : language === 'hi' ? 'hi-IN' : 'en-US'
                  )}
                </Badge>
              )}

              {/* Subtasks progress */}
              {hasSubtasks && (
                <Badge variant="secondary" className="text-xs">
                  {completedSubtasks}/{subtasks.length} {t('subtasks')}
                </Badge>
              )}
            </div>

            {/* Parent task info (for subtasks) */}
            {parentTask && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1">
                  {t('parent_task')}: {parentTask.title}
                  {parentTask.status === 'completed' && (
                    <CheckCircle2 className="w-3 h-3 text-success" />
                  )}
                </span>
                {totalSiblings > 0 && (
                  <span className="flex items-center gap-1">
                    | {t('other_completed')}: {completedSiblings}/{totalSiblings}
                  </span>
                )}
              </div>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {(task.assigned_member || task.assignee) && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {getMemberName(task.assigned_member)}
                </span>
              )}
              {task.department && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {task.department}
                </span>
              )}
              {task.due_date && (
                <span className={cn(
                  "flex items-center gap-1",
                  new Date(task.due_date) < new Date() && task.status !== 'completed' && "text-destructive"
                )}>
                  <Calendar className="w-3 h-3" />
                  {new Date(task.due_date).toLocaleDateString(
                    language === 'he' ? 'he-IL' : language === 'hi' ? 'hi-IN' : 'en-US'
                  )}
                  {new Date(task.due_date) < new Date() && task.status !== 'completed' && (
                    <AlertCircle className="w-3 h-3" />
                  )}
                </span>
              )}
              {task.estimated_hours && (
                <span className="text-xs">
                  {task.actual_hours ? `${task.actual_hours}/` : ''}{task.estimated_hours}h
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{task.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onAddSubtask(task.id)}
              title={t('add_subtask')}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(task)}
              title={t('edit')}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(task)}
              title={t('delete')}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Status Badge */}
          <Badge variant="outline" className={cn("whitespace-nowrap", status.bg, status.color)}>
            {t(status.labelKey)}
          </Badge>
        </div>
      </div>

      {/* Subtasks */}
      {hasSubtasks && isExpanded && (
        <div className="bg-muted/5">
          {subtasks.map(subtask => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              allTasks={allTasks}
              teamMembers={teamMembers}
              onEdit={onEdit}
              onAddSubtask={onAddSubtask}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});
