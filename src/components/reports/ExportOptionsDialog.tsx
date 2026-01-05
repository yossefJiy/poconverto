import { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileSpreadsheet,
  Loader2,
  Check
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface ExportOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: any;
  clientName: string;
}

type ExportFormat = 'pdf' | 'excel' | 'csv';

interface ExportSection {
  id: string;
  label: string;
  enabled: boolean;
}

export function ExportOptionsDialog({
  open,
  onOpenChange,
  reportData,
  clientName,
}: ExportOptionsDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [sections, setSections] = useState<ExportSection[]>([
    { id: 'summary', label: 'סיכום כללי', enabled: true },
    { id: 'performance', label: 'ביצועים', enabled: true },
    { id: 'campaigns', label: 'קמפיינים', enabled: true },
    { id: 'tasks', label: 'משימות', enabled: true },
    { id: 'goals', label: 'יעדים', enabled: true },
  ]);
  const [isExporting, setIsExporting] = useState(false);

  const toggleSection = (id: string) => {
    setSections(sections.map((s) => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const exportPDF = () => {
    const enabledSections = sections.filter((s) => s.enabled).map((s) => s.id);
    
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <title>דוח ביצועים - ${clientName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; direction: rtl; }
          h1 { color: #1a1a2e; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
          h2 { color: #4f46e5; margin-top: 30px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
          .metric { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #1a1a2e; }
          .metric-label { font-size: 12px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; font-weight: 600; }
          .progress-bar { background: #e2e8f0; border-radius: 4px; height: 8px; }
          .progress-fill { background: #6366f1; height: 100%; border-radius: 4px; }
          .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>דוח ביצועים - ${clientName}</h1>
        <p>תקופה: ${new Date(reportData.period?.from).toLocaleDateString('he-IL')} - ${new Date(reportData.period?.to).toLocaleDateString('he-IL')}</p>
        
        ${enabledSections.includes('summary') ? `
        <h2>סיכום כללי</h2>
        <div class="summary-grid">
          <div class="metric">
            <div class="metric-value">${reportData.summary?.total_campaigns || 0}</div>
            <div class="metric-label">קמפיינים</div>
          </div>
          <div class="metric">
            <div class="metric-value">${(reportData.summary?.total_impressions || 0).toLocaleString()}</div>
            <div class="metric-label">חשיפות</div>
          </div>
          <div class="metric">
            <div class="metric-value">${(reportData.summary?.total_clicks || 0).toLocaleString()}</div>
            <div class="metric-label">קליקים</div>
          </div>
          <div class="metric">
            <div class="metric-value">${(reportData.summary?.total_conversions || 0).toLocaleString()}</div>
            <div class="metric-label">המרות</div>
          </div>
        </div>
        ` : ''}

        ${enabledSections.includes('performance') ? `
        <h2>ביצועים</h2>
        <div class="summary-grid">
          <div class="metric">
            <div class="metric-value">${reportData.performance?.ctr || 0}%</div>
            <div class="metric-label">CTR</div>
          </div>
          <div class="metric">
            <div class="metric-value">${reportData.performance?.conversion_rate || 0}%</div>
            <div class="metric-label">יחס המרה</div>
          </div>
          <div class="metric">
            <div class="metric-value">₪${reportData.performance?.cost_per_click || 0}</div>
            <div class="metric-label">עלות לקליק</div>
          </div>
          <div class="metric">
            <div class="metric-value">₪${reportData.performance?.cost_per_conversion || 0}</div>
            <div class="metric-label">עלות להמרה</div>
          </div>
        </div>
        ` : ''}

        ${enabledSections.includes('campaigns') && reportData.campaigns?.length ? `
        <h2>קמפיינים מובילים</h2>
        <table>
          <thead>
            <tr>
              <th>שם</th>
              <th>פלטפורמה</th>
              <th>חשיפות</th>
              <th>קליקים</th>
              <th>המרות</th>
              <th>הוצאה</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.campaigns.map((c: any) => `
              <tr>
                <td>${c.name}</td>
                <td>${c.platform}</td>
                <td>${(c.impressions || 0).toLocaleString()}</td>
                <td>${(c.clicks || 0).toLocaleString()}</td>
                <td>${(c.conversions || 0).toLocaleString()}</td>
                <td>₪${(c.spent || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        ${enabledSections.includes('goals') && reportData.goals?.length ? `
        <h2>התקדמות יעדים</h2>
        <table>
          <thead>
            <tr>
              <th>יעד</th>
              <th>נוכחי</th>
              <th>מטרה</th>
              <th>התקדמות</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.goals.map((g: any) => `
              <tr>
                <td>${g.name}</td>
                <td>${g.current}${g.unit || ''}</td>
                <td>${g.target}${g.unit || ''}</td>
                <td>${g.progress}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="footer">
          <p>דוח זה נוצר אוטומטית ב-${new Date().toLocaleString('he-IL')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportCSV = () => {
    const rows: string[][] = [];
    const enabledSections = sections.filter((s) => s.enabled).map((s) => s.id);

    // Summary
    if (enabledSections.includes('summary')) {
      rows.push(['סיכום כללי']);
      rows.push(['מדד', 'ערך']);
      rows.push(['קמפיינים', String(reportData.summary?.total_campaigns || 0)]);
      rows.push(['חשיפות', String(reportData.summary?.total_impressions || 0)]);
      rows.push(['קליקים', String(reportData.summary?.total_clicks || 0)]);
      rows.push(['המרות', String(reportData.summary?.total_conversions || 0)]);
      rows.push(['הוצאה', String(reportData.summary?.total_spent || 0)]);
      rows.push([]);
    }

    // Performance
    if (enabledSections.includes('performance')) {
      rows.push(['ביצועים']);
      rows.push(['מדד', 'ערך']);
      rows.push(['CTR', `${reportData.performance?.ctr || 0}%`]);
      rows.push(['יחס המרה', `${reportData.performance?.conversion_rate || 0}%`]);
      rows.push(['עלות לקליק', String(reportData.performance?.cost_per_click || 0)]);
      rows.push(['עלות להמרה', String(reportData.performance?.cost_per_conversion || 0)]);
      rows.push([]);
    }

    // Campaigns
    if (enabledSections.includes('campaigns') && reportData.campaigns?.length) {
      rows.push(['קמפיינים']);
      rows.push(['שם', 'פלטפורמה', 'חשיפות', 'קליקים', 'המרות', 'הוצאה']);
      reportData.campaigns.forEach((c: any) => {
        rows.push([
          c.name,
          c.platform,
          String(c.impressions || 0),
          String(c.clicks || 0),
          String(c.conversions || 0),
          String(c.spent || 0),
        ]);
      });
    }

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${clientName}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (format === 'pdf') {
        exportPDF();
      } else if (format === 'csv' || format === 'excel') {
        exportCSV();
      }
      toast.success('הדוח יוצא בהצלחה');
      onOpenChange(false);
    } catch (error) {
      toast.error('שגיאה בייצוא הדוח');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            ייצוא דוח
          </DialogTitle>
          <DialogDescription>
            בחר פורמט ותכנים לייצוא
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>פורמט</Label>
            <RadioGroup value={format} onValueChange={(v: ExportFormat) => setFormat(v)}>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="w-4 h-4" />
                  PDF
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel / CSV
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Section Selection */}
          <div className="space-y-3">
            <Label>תכנים לכלול</Label>
            <div className="space-y-2">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={section.id}
                    checked={section.enabled}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                  <Label htmlFor={section.id} className="cursor-pointer">
                    {section.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 ml-2" />
            )}
            ייצוא
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
