import { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Mail, 
  Plus,
  X,
  Loader2 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ReportTemplateSelector } from './ReportTemplateSelector';
import { reportsAPI, ReportTemplate, CreateScheduledReportInput } from '@/api/reports.api';
import { toast } from 'sonner';

interface CreateScheduledReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onCreated?: () => void;
}

const dayLabels = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export function CreateScheduledReportDialog({
  open,
  onOpenChange,
  clientId,
  onCreated,
}: CreateScheduledReportDialogProps) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddEmail = () => {
    if (newEmail && !recipients.includes(newEmail)) {
      setRecipients([...recipients, newEmail]);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setRecipients(recipients.filter((e) => e !== email));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('יש להזין שם לדוח');
      return;
    }
    if (recipients.length === 0) {
      toast.error('יש להוסיף לפחות נמען אחד');
      return;
    }

    setIsLoading(true);
    try {
      const input: CreateScheduledReportInput = {
        client_id: clientId,
        template_id: selectedTemplate?.id,
        name: name.trim(),
        frequency,
        day_of_week: frequency === 'weekly' ? dayOfWeek : undefined,
        day_of_month: frequency === 'monthly' ? dayOfMonth : undefined,
        time_of_day: timeOfDay,
        recipients,
      };

      await reportsAPI.createScheduledReport(input);
      toast.success('הדוח המתוזמן נוצר בהצלחה');
      onOpenChange(false);
      onCreated?.();
      
      // Reset form
      setName('');
      setFrequency('weekly');
      setDayOfWeek(0);
      setDayOfMonth(1);
      setTimeOfDay('09:00');
      setRecipients([]);
      setSelectedTemplate(null);
    } catch (error) {
      toast.error('שגיאה ביצירת הדוח המתוזמן');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            יצירת דוח מתוזמן
          </DialogTitle>
          <DialogDescription>
            הגדר דוח אוטומטי שיישלח לנמענים בזמנים קבועים
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">שם הדוח</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="דוח ביצועים שבועי"
            />
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>תבנית דוח</Label>
            <ReportTemplateSelector
              clientId={clientId}
              selectedTemplateId={selectedTemplate?.id}
              onSelect={setSelectedTemplate}
            />
          </div>

          {/* Frequency */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>תדירות</Label>
              <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">יומי</SelectItem>
                  <SelectItem value="weekly">שבועי</SelectItem>
                  <SelectItem value="monthly">חודשי</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>יום בשבוע</Label>
                <Select 
                  value={String(dayOfWeek)} 
                  onValueChange={(v) => setDayOfWeek(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayLabels.map((day, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {frequency === 'monthly' && (
              <div className="space-y-2">
                <Label>יום בחודש</Label>
                <Select 
                  value={String(dayOfMonth)} 
                  onValueChange={(v) => setDayOfMonth(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Time */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              שעת שליחה
            </Label>
            <Input
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
            />
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              נמענים
            </Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
              />
              <Button onClick={handleAddEmail} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recipients.map((email) => (
                  <Badge key={email} variant="secondary">
                    {email}
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="mr-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 ml-2" />
            )}
            צור דוח מתוזמן
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
