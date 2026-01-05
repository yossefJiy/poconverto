import { BaseAPI } from './base';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  template_type: string;
  sections: Array<{ id: string; title: string; enabled: boolean }>;
  styling: Record<string, any>;
  is_default: boolean;
  is_global: boolean;
  client_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledReport {
  id: string;
  client_id: string;
  template_id: string | null;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week: number | null;
  day_of_month: number | null;
  time_of_day: string;
  recipients: string[];
  is_active: boolean;
  last_sent_at: string | null;
  next_run_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportHistoryItem {
  id: string;
  client_id: string;
  template_id: string | null;
  scheduled_report_id: string | null;
  report_type: string;
  report_data: Record<string, any>;
  period_start: string;
  period_end: string;
  file_url: string | null;
  file_format: string;
  generated_by: string | null;
  sent_to: string[];
  created_at: string;
}

export interface CreateScheduledReportInput {
  client_id: string;
  template_id?: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week?: number;
  day_of_month?: number;
  time_of_day?: string;
  recipients: string[];
}

class ReportsAPI extends BaseAPI {
  // Templates
  async listTemplates(clientId?: string): Promise<ReportTemplate[]> {
    let query = this.client
      .from('report_templates')
      .select('*')
      .order('is_default', { ascending: false });
    
    if (clientId) {
      query = query.or(`is_global.eq.true,client_id.eq.${clientId}`);
    } else {
      query = query.eq('is_global', true);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ReportTemplate[];
  }

  async createTemplate(template: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const { data, error } = await this.client
      .from('report_templates')
      .insert(template as any)
      .select()
      .single();
    if (error) throw error;
    return data as ReportTemplate;
  }

  async updateTemplate(id: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const { data, error } = await this.client
      .from('report_templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ReportTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await this.client
      .from('report_templates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  // Scheduled Reports
  async listScheduledReports(clientId: string): Promise<ScheduledReport[]> {
    const { data, error } = await this.client
      .from('scheduled_reports')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ScheduledReport[];
  }

  async createScheduledReport(input: CreateScheduledReportInput): Promise<ScheduledReport> {
    const nextRun = this.calculateNextRun(input.frequency, input.day_of_week, input.day_of_month, input.time_of_day);
    
    const { data, error } = await this.client
      .from('scheduled_reports')
      .insert({
        ...input,
        next_run_at: nextRun.toISOString(),
      } as any)
      .select()
      .single();
    if (error) throw error;
    return data as ScheduledReport;
  }

  async updateScheduledReport(id: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport> {
    const { data, error } = await this.client
      .from('scheduled_reports')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as ScheduledReport;
  }

  async deleteScheduledReport(id: string): Promise<void> {
    const { error } = await this.client
      .from('scheduled_reports')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async toggleScheduledReport(id: string, isActive: boolean): Promise<void> {
    const { error } = await this.client
      .from('scheduled_reports')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }

  // Report History
  async listReportHistory(clientId: string, limit = 20): Promise<ReportHistoryItem[]> {
    const { data, error } = await this.client
      .from('report_history')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as ReportHistoryItem[];
  }

  async saveReportToHistory(
    clientId: string,
    reportType: string,
    reportData: Record<string, any>,
    periodStart: string,
    periodEnd: string,
    templateId?: string
  ): Promise<ReportHistoryItem> {
    const { data, error } = await this.client
      .from('report_history')
      .insert({
        client_id: clientId,
        template_id: templateId,
        report_type: reportType,
        report_data: reportData,
        period_start: periodStart,
        period_end: periodEnd,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return data as ReportHistoryItem;
  }

  private calculateNextRun(
    frequency: string,
    dayOfWeek?: number,
    dayOfMonth?: number,
    timeOfDay?: string
  ): Date {
    const now = new Date();
    const [hours, minutes] = (timeOfDay || '09:00').split(':').map(Number);
    
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    
    if (frequency === 'daily') {
      if (next <= now) next.setDate(next.getDate() + 1);
    } else if (frequency === 'weekly' && dayOfWeek !== undefined) {
      const currentDay = now.getDay();
      let daysUntil = dayOfWeek - currentDay;
      if (daysUntil <= 0 || (daysUntil === 0 && next <= now)) {
        daysUntil += 7;
      }
      next.setDate(next.getDate() + daysUntil);
    } else if (frequency === 'monthly' && dayOfMonth !== undefined) {
      next.setDate(dayOfMonth);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
    }
    
    return next;
  }
}

export const reportsAPI = new ReportsAPI();
