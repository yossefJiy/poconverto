import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Mail, 
  MoreVertical, 
  Pause, 
  Play, 
  Trash2,
  Edit,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { reportsAPI, ScheduledReport } from '@/api/reports.api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface ScheduledReportsListProps {
  clientId: string;
  onEdit?: (report: ScheduledReport) => void;
  onRefresh?: () => void;
}

const frequencyLabels: Record<string, string> = {
  daily: 'יומי',
  weekly: 'שבועי',
  monthly: 'חודשי',
};

const dayLabels = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const ScheduledReportsList = React.forwardRef<HTMLDivElement, ScheduledReportsListProps>(
  function ScheduledReportsList({ clientId, onEdit, onRefresh }, ref) {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async () => {
    try {
      const data = await reportsAPI.listScheduledReports(clientId);
      setReports(data);
    } catch (error) {
      console.error('Failed to load scheduled reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [clientId]);

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await reportsAPI.toggleScheduledReport(id, isActive);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: isActive } : r))
      );
      toast.success(isActive ? 'הדוח הופעל' : 'הדוח הושהה');
    } catch (error) {
      toast.error('שגיאה בעדכון הדוח');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await reportsAPI.deleteScheduledReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success('הדוח נמחק');
      onRefresh?.();
    } catch (error) {
      toast.error('שגיאה במחיקת הדוח');
    }
  };

  const getScheduleDescription = (report: ScheduledReport) => {
    if (report.frequency === 'daily') {
      return `כל יום בשעה ${report.time_of_day}`;
    }
    if (report.frequency === 'weekly' && report.day_of_week !== null) {
      return `כל יום ${dayLabels[report.day_of_week]} בשעה ${report.time_of_day}`;
    }
    if (report.frequency === 'monthly' && report.day_of_month !== null) {
      return `בתאריך ${report.day_of_month} לכל חודש בשעה ${report.time_of_day}`;
    }
    return report.frequency;
  };

  if (isLoading) {
    return (
      <div ref={ref} className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card ref={ref}>
        <CardContent className="text-center py-8">
          <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">אין דוחות מתוזמנים</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={ref} className="space-y-3">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Switch
                  checked={report.is_active}
                  onCheckedChange={(checked) => handleToggle(report.id, checked)}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{report.name}</h4>
                    <Badge variant={report.is_active ? 'default' : 'secondary'}>
                      {report.is_active ? 'פעיל' : 'מושהה'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {getScheduleDescription(report)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {report.recipients.length} נמענים
                    </span>
                  </div>
                  {report.next_run_at && report.is_active && (
                    <p className="text-xs text-muted-foreground mt-1">
                      הרצה הבאה: {format(new Date(report.next_run_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </p>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(report)}>
                    <Edit className="w-4 h-4 ml-2" />
                    ערוך
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleToggle(report.id, !report.is_active)}
                  >
                    {report.is_active ? (
                      <>
                        <Pause className="w-4 h-4 ml-2" />
                        השהה
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 ml-2" />
                        הפעל
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(report.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    מחק
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
