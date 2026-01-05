import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/hooks/useClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Send, 
  Calendar,
  BarChart3,
  CheckSquare,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const REPORT_SECTIONS = [
  { id: 'tasks', label: 'משימות', icon: CheckSquare },
  { id: 'analytics', label: 'אנליטיקס', icon: BarChart3 },
  { id: 'kpis', label: 'יעדים', icon: TrendingUp },
  { id: 'credits', label: 'קרדיטים', icon: FileText },
];

const PERIOD_OPTIONS = [
  { value: 'last_7_days', label: '7 ימים אחרונים' },
  { value: 'last_30_days', label: '30 ימים אחרונים' },
  { value: 'this_month', label: 'החודש הנוכחי' },
  { value: 'last_month', label: 'חודש קודם' },
  { value: 'custom', label: 'טווח מותאם' },
];

interface ReportData {
  tasks?: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    hoursLogged: number;
  };
  credits?: {
    total: number;
    used: number;
    remaining: number;
    percentUsed: number;
  };
  kpis?: {
    name: string;
    current: number;
    target: number;
    status: string;
  }[];
}

export function ClientReportGenerator() {
  const { selectedClient } = useClient();
  const [period, setPeriod] = useState('last_30_days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>(['tasks', 'credits']);
  const [isGenerating, setIsGenerating] = useState(false);

  const getDateRange = () => {
    const today = new Date();
    switch (period) {
      case 'last_7_days':
        return { start: subDays(today, 7), end: today };
      case 'last_30_days':
        return { start: subDays(today, 30), end: today };
      case 'this_month':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'last_month':
        const lastMonth = subMonths(today, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'custom':
        return { 
          start: startDate ? new Date(startDate) : subDays(today, 30), 
          end: endDate ? new Date(endDate) : today 
        };
      default:
        return { start: subDays(today, 30), end: today };
    }
  };

  // Fetch report data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['client-report', selectedClient?.id, period, startDate, endDate],
    queryFn: async (): Promise<ReportData> => {
      if (!selectedClient) return {};
      
      const { start, end } = getDateRange();
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      const result: ReportData = {};

      // Fetch tasks data
      if (selectedSections.includes('tasks')) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, status, duration_minutes, due_date')
          .eq('client_id', selectedClient.id)
          .gte('created_at', startStr)
          .lte('created_at', endStr);

        const tasksList = tasks || [];
        result.tasks = {
          total: tasksList.length,
          completed: tasksList.filter(t => t.status === 'completed').length,
          pending: tasksList.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
          overdue: tasksList.filter(t => 
            t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
          ).length,
          hoursLogged: Math.round(tasksList.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / 60),
        };
      }

      // Fetch credits data
      if (selectedSections.includes('credits')) {
        const { data: credits } = await supabase
          .from('client_credits')
          .select('total_credits, used_credits')
          .eq('client_id', selectedClient.id)
          .eq('is_active', true)
          .single();

        if (credits) {
          result.credits = {
            total: credits.total_credits,
            used: credits.used_credits,
            remaining: credits.total_credits - credits.used_credits,
            percentUsed: credits.total_credits > 0 
              ? Math.round((credits.used_credits / credits.total_credits) * 100)
              : 0,
          };
        }
      }

      // Fetch KPIs
      if (selectedSections.includes('kpis')) {
        const { data: kpis } = await supabase
          .from('brand_kpis')
          .select('name, current_value, target_value, status')
          .eq('client_id', selectedClient.id)
          .eq('is_active', true);

        result.kpis = (kpis || []).map(k => ({
          name: k.name,
          current: k.current_value || 0,
          target: k.target_value,
          status: k.status,
        }));
      }

      return result;
    },
    enabled: !!selectedClient,
  });

  const handleGenerateReport = async () => {
    if (!selectedClient) {
      toast.error('יש לבחור לקוח');
      return;
    }

    setIsGenerating(true);
    try {
      // In a real implementation, this would call an edge function to generate PDF
      const { start, end } = getDateRange();
      
      // For now, create a simple text report
      let reportContent = `דוח לקוח: ${selectedClient.name}\n`;
      reportContent += `תקופה: ${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}\n\n`;

      if (reportData?.tasks) {
        reportContent += `=== משימות ===\n`;
        reportContent += `סה"כ: ${reportData.tasks.total}\n`;
        reportContent += `הושלמו: ${reportData.tasks.completed}\n`;
        reportContent += `ממתינות: ${reportData.tasks.pending}\n`;
        reportContent += `באיחור: ${reportData.tasks.overdue}\n`;
        reportContent += `שעות שתועדו: ${reportData.tasks.hoursLogged}\n\n`;
      }

      if (reportData?.credits) {
        reportContent += `=== קרדיטים ===\n`;
        reportContent += `סה"כ: ${reportData.credits.total}\n`;
        reportContent += `נוצלו: ${reportData.credits.used}\n`;
        reportContent += `נותרו: ${reportData.credits.remaining}\n`;
        reportContent += `אחוז ניצול: ${reportData.credits.percentUsed}%\n\n`;
      }

      if (reportData?.kpis && reportData.kpis.length > 0) {
        reportContent += `=== יעדים ===\n`;
        reportData.kpis.forEach(kpi => {
          reportContent += `${kpi.name}: ${kpi.current}/${kpi.target} (${kpi.status})\n`;
        });
      }

      // Download as text file
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${selectedClient.name}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('הדוח נוצר והורד בהצלחה');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('שגיאה ביצירת הדוח');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  if (!selectedClient) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>יש לבחור לקוח ליצירת דוח</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          יצירת דוח לקוח
        </CardTitle>
        <CardDescription>
          צור דוח מותאם אישית ללקוח {selectedClient.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Period Selection */}
        <div className="space-y-2">
          <Label>תקופת הדוח</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>מתאריך</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>עד תאריך</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Section Selection */}
        <div className="space-y-3">
          <Label>סעיפים לכלול בדוח</Label>
          <div className="grid grid-cols-2 gap-3">
            {REPORT_SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <label
                  key={section.id}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedSections.includes(section.id)}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{section.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : reportData && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-4">
            <h4 className="font-medium">תצוגה מקדימה</h4>
            
            {reportData.tasks && (
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="bg-background rounded p-2">
                  <p className="text-lg font-bold">{reportData.tasks.total}</p>
                  <p className="text-xs text-muted-foreground">משימות</p>
                </div>
                <div className="bg-background rounded p-2">
                  <p className="text-lg font-bold text-success">{reportData.tasks.completed}</p>
                  <p className="text-xs text-muted-foreground">הושלמו</p>
                </div>
                <div className="bg-background rounded p-2">
                  <p className="text-lg font-bold text-warning">{reportData.tasks.pending}</p>
                  <p className="text-xs text-muted-foreground">ממתינות</p>
                </div>
                <div className="bg-background rounded p-2">
                  <p className="text-lg font-bold">{reportData.tasks.hoursLogged}</p>
                  <p className="text-xs text-muted-foreground">שעות</p>
                </div>
              </div>
            )}

            {reportData.credits && (
              <div className="flex items-center justify-between text-sm">
                <span>קרדיטים:</span>
                <span className="font-medium">
                  {reportData.credits.remaining} / {reportData.credits.total} 
                  ({reportData.credits.percentUsed}% נוצלו)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={handleGenerateReport} 
            disabled={isGenerating || selectedSections.length === 0}
            className="flex-1"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 ml-2" />
            )}
            הורד דוח
          </Button>
          <Button variant="outline" disabled>
            <Send className="h-4 w-4 ml-2" />
            שלח ללקוח
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
