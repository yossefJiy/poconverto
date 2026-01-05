import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportPlatformMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spent: number;
  ctr: number;
  cpc: number;
}

interface ReportCampaign {
  id?: string;
  name: string;
  platform: string;
  status?: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  spent?: number;
  budget?: number;
}

interface ReportGoal {
  name: string;
  target: number;
  current: number;
  progress: number;
  unit: string;
  period: string;
}

interface ReportData {
  generated_at: string;
  report_type: string;
  client: {
    name: string;
    industry: string;
    website: string;
  };
  period: {
    from: string;
    to: string;
  };
  summary: {
    total_campaigns: number;
    active_campaigns: number;
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
    total_spent: number;
    total_budget: number;
    budget_utilization: number;
  };
  performance: {
    ctr: number;
    conversion_rate: number;
    cost_per_click: number;
    cost_per_conversion: number;
    roi: number;
  };
  platforms: Record<string, ReportPlatformMetrics>;
  tasks: {
    completed: number;
    in_progress: number;
    pending: number;
    total: number;
    completion_rate: number;
  };
  goals: ReportGoal[];
  campaigns: ReportCampaign[];
}

export function useReports() {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const generateReport = async (
    clientId: string,
    reportType: 'monthly' | 'weekly' | 'campaign' = 'monthly',
    options?: { dateFrom?: string; dateTo?: string; campaignId?: string }
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          client_id: clientId,
          report_type: reportType,
          date_from: options?.dateFrom,
          date_to: options?.dateTo,
          campaign_id: options?.campaignId,
        }
      });

      if (error) throw error;
      setReportData(data);
      toast.success('הדוח נוצר בהצלחה');
      return data;
    } catch (err) {
      console.error('Report error:', err);
      toast.error('שגיאה ביצירת הדוח');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = (report: ReportData) => {
    // Create printable HTML
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <title>דוח ביצועים - ${report.client.name}</title>
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
        <h1>דוח ביצועים - ${report.client.name}</h1>
        <p>תקופה: ${new Date(report.period.from).toLocaleDateString('he-IL')} - ${new Date(report.period.to).toLocaleDateString('he-IL')}</p>
        
        <h2>סיכום כללי</h2>
        <div class="summary-grid">
          <div class="metric">
            <div class="metric-value">${report.summary.total_campaigns}</div>
            <div class="metric-label">קמפיינים</div>
          </div>
          <div class="metric">
            <div class="metric-value">${report.summary.total_impressions.toLocaleString()}</div>
            <div class="metric-label">חשיפות</div>
          </div>
          <div class="metric">
            <div class="metric-value">${report.summary.total_clicks.toLocaleString()}</div>
            <div class="metric-label">קליקים</div>
          </div>
          <div class="metric">
            <div class="metric-value">${report.summary.total_conversions.toLocaleString()}</div>
            <div class="metric-label">המרות</div>
          </div>
        </div>

        <h2>ביצועים</h2>
        <div class="summary-grid">
          <div class="metric">
            <div class="metric-value">${report.performance.ctr}%</div>
            <div class="metric-label">CTR</div>
          </div>
          <div class="metric">
            <div class="metric-value">${report.performance.conversion_rate}%</div>
            <div class="metric-label">יחס המרה</div>
          </div>
          <div class="metric">
            <div class="metric-value">₪${report.performance.cost_per_click}</div>
            <div class="metric-label">עלות לקליק</div>
          </div>
          <div class="metric">
            <div class="metric-value">₪${report.performance.cost_per_conversion}</div>
            <div class="metric-label">עלות להמרה</div>
          </div>
        </div>

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
            ${report.campaigns?.map(c => `
              <tr>
                <td>${c.name}</td>
                <td>${c.platform}</td>
                <td>${c.impressions?.toLocaleString() || 0}</td>
                <td>${c.clicks?.toLocaleString() || 0}</td>
                <td>${c.conversions?.toLocaleString() || 0}</td>
                <td>₪${c.spent?.toLocaleString() || 0}</td>
              </tr>
            `).join('') || '<tr><td colspan="6">אין נתונים</td></tr>'}
          </tbody>
        </table>

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
            ${report.goals?.map(g => `
              <tr>
                <td>${g.name}</td>
                <td>${g.current}${g.unit || ''}</td>
                <td>${g.target}${g.unit || ''}</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(g.progress, 100)}%"></div>
                  </div>
                  ${g.progress}%
                </td>
              </tr>
            `).join('') || '<tr><td colspan="4">אין יעדים</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <p>דוח זה נוצר אוטומטית ב-${new Date(report.generated_at).toLocaleString('he-IL')}</p>
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

  return {
    isLoading,
    reportData,
    generateReport,
    downloadPDF,
  };
}
