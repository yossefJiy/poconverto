import { useState } from "react";
import { 
  FileBarChart, 
  Loader2, 
  Download,
  Calendar,
  TrendingUp,
  Target,
  Users,
  DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useReports } from "@/hooks/useReports";
import { cn } from "@/lib/utils";

interface ReportDialogProps {
  clientId: string;
  clientName: string;
}

export function ReportDialog({ clientId, clientName }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<'monthly' | 'weekly'>('monthly');
  const { isLoading, reportData, generateReport, downloadPDF } = useReports();

  const handleGenerate = async () => {
    await generateReport(clientId, reportType);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileBarChart className="w-4 h-4 ml-2" />
          דוחות
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-primary" />
            דוח ביצועים - {clientName}
          </DialogTitle>
          <DialogDescription>
            צור דוח מפורט לשיתוף עם לקוחות
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {!reportData && (
            <div className="flex items-center gap-4">
              <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">חודשי</SelectItem>
                  <SelectItem value="weekly">שבועי</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    יוצר דוח...
                  </>
                ) : (
                  <>
                    <FileBarChart className="w-4 h-4 ml-2" />
                    צור דוח
                  </>
                )}
              </Button>
            </div>
          )}

          {reportData && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">{reportData.client.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(reportData.period.from).toLocaleDateString('he-IL')} - 
                    {new Date(reportData.period.to).toLocaleDateString('he-IL')}
                  </p>
                </div>
                <Button onClick={() => downloadPDF(reportData)}>
                  <Download className="w-4 h-4 ml-2" />
                  הורד PDF
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-xl text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{reportData.summary.total_campaigns}</p>
                  <p className="text-xs text-muted-foreground">קמפיינים</p>
                </div>
                <div className="p-4 bg-muted rounded-xl text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-success" />
                  <p className="text-2xl font-bold">{reportData.summary.total_clicks.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">קליקים</p>
                </div>
                <div className="p-4 bg-muted rounded-xl text-center">
                  <Target className="w-6 h-6 mx-auto mb-2 text-warning" />
                  <p className="text-2xl font-bold">{reportData.summary.total_conversions.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">המרות</p>
                </div>
                <div className="p-4 bg-muted rounded-xl text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-info" />
                  <p className="text-2xl font-bold">₪{reportData.summary.total_spent.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">הוצאה</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 glass rounded-xl">
                  <h4 className="font-semibold mb-3">ביצועים</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CTR</span>
                      <span className="font-medium">{reportData.performance.ctr}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">יחס המרה</span>
                      <span className="font-medium">{reportData.performance.conversion_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">עלות לקליק</span>
                      <span className="font-medium">₪{reportData.performance.cost_per_click}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">עלות להמרה</span>
                      <span className="font-medium">₪{reportData.performance.cost_per_conversion}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 glass rounded-xl">
                  <h4 className="font-semibold mb-3">משימות</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">הושלמו</span>
                      <span className="font-medium text-success">{reportData.tasks.completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">בתהליך</span>
                      <span className="font-medium text-warning">{reportData.tasks.in_progress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ממתינות</span>
                      <span className="font-medium">{reportData.tasks.pending}</span>
                    </div>
                    <div className="mt-2">
                      <Progress value={reportData.tasks.completion_rate} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{reportData.tasks.completion_rate}% הושלמו</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Goals Progress */}
              {reportData.goals && reportData.goals.length > 0 && (
                <div className="p-4 glass rounded-xl">
                  <h4 className="font-semibold mb-3">התקדמות יעדים</h4>
                  <div className="space-y-3">
                    {reportData.goals.map((goal, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{goal.name}</span>
                          <span>{goal.current}/{goal.target}{goal.unit}</span>
                        </div>
                        <Progress 
                          value={goal.progress} 
                          className={cn(
                            "h-2",
                            goal.progress >= 100 && "bg-success"
                          )} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset */}
              <Button variant="outline" onClick={() => generateReport(clientId, reportType)}>
                צור דוח חדש
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
