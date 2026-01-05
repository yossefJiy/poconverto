import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient } from "@/hooks/useClient";
import { useReports } from "@/hooks/useReports";
import { 
  FileText, 
  Download, 
  Plus, 
  BarChart3,
  TrendingUp,
  Clock,
  Loader2,
  Calendar,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ReportTemplateSelector,
  ScheduledReportsList,
  ReportHistoryList,
  CreateScheduledReportDialog,
  ExportOptionsDialog,
} from "@/components/reports";
import { ReportTemplate } from "@/api/reports.api";

export default function Reports() {
  const { selectedClient } = useClient();
  const [activeTab, setActiveTab] = useState("create");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const { isLoading, reportData, generateReport, downloadPDF } = useReports();

  const reportTypes = [
    { 
      id: "monthly" as const, 
      name: "דוח ביצועים חודשי", 
      description: "סיכום מקיף של כל מדדי הביצועים",
      icon: BarChart3,
    },
    { 
      id: "campaign" as const, 
      name: "דוח קמפיינים", 
      description: "ניתוח מעמיק של קמפיינים פעילים",
      icon: TrendingUp,
    },
    { 
      id: "weekly" as const, 
      name: "דוח שבועי", 
      description: "עדכון שבועי מהיר",
      icon: Clock,
    },
  ];

  const handleCreateReport = async (type: 'monthly' | 'weekly' | 'campaign') => {
    if (!selectedClient) return;
    setDialogOpen(true);
    await generateReport(selectedClient.id, type);
  };

  const handleTemplateSelect = (template: ReportTemplate) => {
    setSelectedTemplate(template);
  };

  return (
    <MainLayout>
      <DomainErrorBoundary domain="reports">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">דוחות</h1>
            <p className="text-muted-foreground">
              צור, תזמן וייצא דוחות ביצועים עבור {selectedClient?.name || "הלקוחות שלך"}
            </p>
          </div>
          {selectedClient && (
            <Button onClick={() => setScheduleDialogOpen(true)}>
              <Calendar className="w-4 h-4 ml-2" />
              תזמן דוח אוטומטי
            </Button>
          )}
        </div>

        {!selectedClient ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">בחר לקוח</h3>
              <p className="text-sm text-muted-foreground">
                בחר לקוח מהתפריט העליון כדי ליצור דוחות
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="create">
                <Plus className="w-4 h-4 ml-1" />
                יצירת דוח
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                <Calendar className="w-4 h-4 ml-1" />
                מתוזמנים
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="w-4 h-4 ml-1" />
                היסטוריה
              </TabsTrigger>
            </TabsList>

            {/* Create Report Tab */}
            <TabsContent value="create" className="space-y-6">
              {/* Template Selection */}
              <div>
                <h3 className="text-lg font-semibold mb-4">בחר תבנית דוח</h3>
                <ReportTemplateSelector
                  clientId={selectedClient.id}
                  selectedTemplateId={selectedTemplate?.id}
                  onSelect={handleTemplateSelect}
                />
              </div>

              {/* Quick Report Types */}
              <div>
                <h3 className="text-lg font-semibold mb-4">או צור דוח מהיר</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {reportTypes.map((type) => (
                    <Card key={type.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <type.icon className="w-5 h-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{type.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{type.description}</CardDescription>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4 w-full"
                          onClick={() => handleCreateReport(type.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 ml-2" />
                          )}
                          צור דוח
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Scheduled Reports Tab */}
            <TabsContent value="scheduled">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">דוחות מתוזמנים</h3>
                  <Button onClick={() => setScheduleDialogOpen(true)} size="sm">
                    <Plus className="w-4 h-4 ml-1" />
                    הוסף תזמון
                  </Button>
                </div>
                <ScheduledReportsList 
                  clientId={selectedClient.id}
                  onRefresh={() => {}}
                />
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">היסטוריית דוחות</h3>
                <ReportHistoryList 
                  clientId={selectedClient.id}
                  onView={(report) => {
                    // Could open a dialog to view the report
                    console.log('View report:', report);
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Report Preview Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              דוח ביצועים - {selectedClient?.name}
            </DialogTitle>
            <DialogDescription>
              תצוגה מקדימה של הדוח
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="mr-3">יוצר דוח...</span>
            </div>
          ) : reportData ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(reportData.period.from), "dd MMMM yyyy", { locale: he })} - 
                    {format(new Date(reportData.period.to), "dd MMMM yyyy", { locale: he })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
                    <Download className="w-4 h-4 ml-2" />
                    ייצוא
                  </Button>
                  <Button onClick={() => downloadPDF(reportData)}>
                    <FileText className="w-4 h-4 ml-2" />
                    PDF
                  </Button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-xl text-center">
                  <p className="text-2xl font-bold">{reportData.summary.total_campaigns}</p>
                  <p className="text-xs text-muted-foreground">קמפיינים</p>
                </div>
                <div className="p-4 bg-muted rounded-xl text-center">
                  <p className="text-2xl font-bold">{reportData.summary.total_clicks?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">קליקים</p>
                </div>
                <div className="p-4 bg-muted rounded-xl text-center">
                  <p className="text-2xl font-bold">{reportData.summary.total_conversions?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">המרות</p>
                </div>
                <div className="p-4 bg-muted rounded-xl text-center">
                  <p className="text-2xl font-bold">₪{reportData.summary.total_spent?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground">הוצאה</p>
                </div>
              </div>

              {/* Performance */}
              <div className="p-4 bg-muted rounded-xl">
                <h4 className="font-semibold mb-3">ביצועים</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">CTR</p>
                    <p className="font-medium">{reportData.performance.ctr}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">יחס המרה</p>
                    <p className="font-medium">{reportData.performance.conversion_rate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">עלות לקליק</p>
                    <p className="font-medium">₪{reportData.performance.cost_per_click}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">עלות להמרה</p>
                    <p className="font-medium">₪{reportData.performance.cost_per_conversion}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create Scheduled Report Dialog */}
      {selectedClient && (
        <CreateScheduledReportDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          clientId={selectedClient.id}
          onCreated={() => setActiveTab('scheduled')}
        />
      )}

      {/* Export Options Dialog */}
      {reportData && selectedClient && (
        <ExportOptionsDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          reportData={reportData}
          clientName={selectedClient.name}
        />
      )}
      </DomainErrorBoundary>
    </MainLayout>
  );
}
