import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Clock,
  Loader2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { reportsAPI, ReportHistoryItem } from '@/api/reports.api';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface ReportHistoryListProps {
  clientId: string;
  onView?: (report: ReportHistoryItem) => void;
}

const reportTypeLabels: Record<string, string> = {
  monthly: 'חודשי',
  weekly: 'שבועי',
  campaign: 'קמפיינים',
  performance: 'ביצועים',
  executive: 'מנהלים',
};

export const ReportHistoryList = React.forwardRef<HTMLDivElement, ReportHistoryListProps>(
  function ReportHistoryList({ clientId, onView }, ref) {
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await reportsAPI.listReportHistory(clientId);
        setHistory(data);
      } catch (error) {
        console.error('Failed to load report history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [clientId]);

  if (isLoading) {
    return (
      <div ref={ref} className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card ref={ref}>
        <CardContent className="text-center py-8">
          <Clock className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">אין היסטוריית דוחות</p>
          <p className="text-sm text-muted-foreground mt-1">
            דוחות שתיצור יופיעו כאן
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={ref} className="space-y-3">
      {history.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      דוח {reportTypeLabels[item.report_type] || item.report_type}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(item.period_start), 'dd/MM', { locale: he })} -{' '}
                      {format(new Date(item.period_end), 'dd/MM', { locale: he })}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    נוצר ב-{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView?.(item)}
                >
                  <Eye className="w-4 h-4 ml-1" />
                  צפה
                </Button>
                {item.file_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(item.file_url!, '_blank')}
                  >
                    <Download className="w-4 h-4 ml-1" />
                    הורד
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
