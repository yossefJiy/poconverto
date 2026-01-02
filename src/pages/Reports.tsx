import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useClient } from "@/hooks/useClient";
import { useReports } from "@/hooks/useReports";
import { 
  FileText, 
  Download, 
  Plus, 
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Reports() {
  const { selectedClient } = useClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<'monthly' | 'weekly' | 'campaign'>('monthly');
  const { isLoading, reportData, generateReport, downloadPDF } = useReports();

  const reportTypes = [
    { 
      id: "monthly" as const, 
      name: "דוח ביצועים חודשי", 
      description: "סיכום מקיף של כל מדדי הביצועים",
      icon: BarChart3,
      color: "text-blue-500"
    },
    { 
      id: "campaign" as const, 
      name: "דוח קמפיינים", 
      description: "ניתוח מעמיק של קמפיינים פעילים",
      icon: TrendingUp,
      color: "text-green-500"
    },
    { 
      id: "weekly" as const, 
      name: "דוח שבועי", 
      description: "עדכון שבועי מהיר",
      icon: Clock,
      color: "text-orange-500"
    },
  ];

  const handleCreateReport = async (type: 'monthly' | 'weekly' | 'campaign') => {
    if (!selectedClient) return;
    setReportType(type);
    setDialogOpen(true);
    await generateReport(selectedClient.id, type);
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">דוחות</h1>
            <p className="text-muted-foreground">
              צור וצפה בדוחות ביצועים עבור {selectedClient?.name || "הלקוחות שלך"}
            </p>
          </div>
        </div>

        {/* Report Templates */}
        <div className="grid gap-4 md:grid-cols-3">
          {reportTypes.map((type) => (
            <Card key={type.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${type.color}`}>
                    <type.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{type.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{type.description}</CardDescription>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 w-full"
                  onClick={() => handleCreateReport(type.id)}
                  disabled={!selectedClient || isLoading}
                >
                  {isLoading && reportType === type.id ? (
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

        {/* Empty State */}
        {!selectedClient && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">בחר לקוח</h3>
              <p className="text-sm text-muted-foreground">
                בחר לקוח מהתפריט העליון כדי ליצור דוחות
              </p>
            </CardContent>
          </Card>
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
                <Button onClick={() => downloadPDF(reportData)}>
                  <Download className="w-4 h-4 ml-2" />
                  הורד PDF
                </Button>
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
    </MainLayout>
  );
}
