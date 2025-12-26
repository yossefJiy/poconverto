import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { he, enUS, hi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
}

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  parentTaskId?: string | null;
  teamMembers: TeamMember[];
  onSave: (task: Partial<Task>) => void;
  isLoading?: boolean;
}

export function TaskEditDialog({
  open,
  onOpenChange,
  task,
  parentTaskId,
  teamMembers,
  onSave,
  isLoading,
}: TaskEditDialogProps) {
  const { t, language } = useTranslation();
  const isNew = !task?.id;

  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: null,
    assigned_member_id: null,
    department: null,
    reminder_date: null,
    estimated_hours: null,
    actual_hours: null,
    completion_notes: null,
    parent_task_id: parentTaskId || null,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        ...task,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: null,
        assigned_member_id: null,
        department: null,
        reminder_date: null,
        estimated_hours: null,
        actual_hours: null,
        completion_notes: null,
        parent_task_id: parentTaskId || null,
      });
    }
  }, [task, parentTaskId]);

  const getLocale = () => {
    switch (language) {
      case 'he': return he;
      case 'hi': return hi;
      default: return enUS;
    }
  };

  const getMemberName = (member: TeamMember) => {
    if (language === 'en' && member.name_en) return member.name_en;
    if (language === 'hi' && member.name_hi) return member.name_hi;
    return member.name;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the selected member to update assignee field
    const selectedMember = teamMembers.find(m => m.id === formData.assigned_member_id);
    
    onSave({
      ...formData,
      assignee: selectedMember?.name || formData.assignee,
    });
  };

  // Get unique departments from team members
  const allDepartments = [...new Set(teamMembers.flatMap(m => m.departments))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? (parentTaskId ? t('add_subtask') : t('add_task')) : t('edit')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>{t('tasks')}</Label>
            <Input
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('tasks')}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{t('notes')}</Label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={t('notes')}
              rows={3}
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>סטטוס</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="in-progress">{t('in_progress')}</SelectItem>
                  <SelectItem value="completed">{t('completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('priority')}</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('low')}</SelectItem>
                  <SelectItem value="medium">{t('medium')}</SelectItem>
                  <SelectItem value="high">{t('high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee & Department */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('assignee')}</Label>
              <Select
                value={formData.assigned_member_id || 'none'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  assigned_member_id: value === 'none' ? null : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('assignee')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {getMemberName(member)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('department')}</Label>
              <Select
                value={formData.department || 'none'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  department: value === 'none' ? null : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('department')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {allDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date & Reminder */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('due_date')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !formData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.due_date
                      ? format(new Date(formData.due_date), 'PPP', { locale: getLocale() })
                      : t('due_date')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date ? new Date(formData.due_date) : undefined}
                    onSelect={(date) => setFormData(prev => ({ 
                      ...prev, 
                      due_date: date ? date.toISOString().split('T')[0] : null 
                    }))}
                    locale={getLocale()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>{t('reminder')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !formData.reminder_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {formData.reminder_date
                      ? format(new Date(formData.reminder_date), 'PPP', { locale: getLocale() })
                      : t('reminder')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.reminder_date ? new Date(formData.reminder_date) : undefined}
                    onSelect={(date) => setFormData(prev => ({ 
                      ...prev, 
                      reminder_date: date ? date.toISOString() : null 
                    }))}
                    locale={getLocale()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('estimated_hours')}</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimated_hours || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  estimated_hours: e.target.value ? parseFloat(e.target.value) : null 
                }))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('actual_hours')}</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={formData.actual_hours || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  actual_hours: e.target.value ? parseFloat(e.target.value) : null 
                }))}
                placeholder="0"
              />
            </div>
          </div>

          {/* Completion Notes (only for completed) */}
          {formData.status === 'completed' && (
            <div className="space-y-2">
              <Label>הערות סיום</Label>
              <Textarea
                value={formData.completion_notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, completion_notes: e.target.value }))}
                placeholder="הערות לסיום המשימה"
                rows={2}
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
