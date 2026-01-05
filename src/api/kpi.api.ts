// KPI API

import { BaseAPI } from './base';

export interface BrandKPI {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  category: string;
  metric_type: string;
  target_value: number;
  current_value: number;
  previous_value: number | null;
  unit: string | null;
  period: string;
  period_start: string | null;
  period_end: string | null;
  status: string;
  threshold_warning: number;
  threshold_critical: number;
  data_source: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface KPIHistory {
  id: string;
  kpi_id: string;
  recorded_value: number;
  target_value: number;
  status: string;
  recorded_at: string;
  metadata: Record<string, unknown>;
}

export interface CreateKPIInput {
  client_id: string;
  name: string;
  description?: string;
  category?: string;
  metric_type?: string;
  target_value: number;
  current_value?: number;
  unit?: string;
  period?: string;
  period_start?: string;
  period_end?: string;
  data_source?: string;
}

export interface UpdateKPIInput {
  name?: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  threshold_warning?: number;
  threshold_critical?: number;
  is_active?: boolean;
}

export class KPIAPI extends BaseAPI {
  async list(clientId: string) {
    return this.request<BrandKPI[]>(async () => {
      return this.client
        .from('brand_kpis')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
    });
  }

  async getById(id: string) {
    return this.request<BrandKPI>(async () => {
      return this.client
        .from('brand_kpis')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async create(data: CreateKPIInput) {
    return this.request<BrandKPI>(async () => {
      return this.client
        .from('brand_kpis')
        .insert({
          client_id: data.client_id,
          name: data.name,
          description: data.description ?? null,
          category: data.category ?? 'custom',
          metric_type: data.metric_type ?? 'number',
          target_value: data.target_value,
          current_value: data.current_value ?? 0,
          unit: data.unit ?? null,
          period: data.period ?? 'monthly',
          period_start: data.period_start ?? null,
          period_end: data.period_end ?? null,
          data_source: data.data_source ?? 'manual',
        })
        .select()
        .single();
    });
  }

  async update(id: string, data: UpdateKPIInput) {
    return this.request<BrandKPI>(async () => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.target_value !== undefined) updateData.target_value = data.target_value;
      if (data.current_value !== undefined) updateData.current_value = data.current_value;
      if (data.threshold_warning !== undefined) updateData.threshold_warning = data.threshold_warning;
      if (data.threshold_critical !== undefined) updateData.threshold_critical = data.threshold_critical;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      
      return this.client
        .from('brand_kpis')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async delete(id: string) {
    return this.request<null>(async () => {
      return this.client
        .from('brand_kpis')
        .update({ is_active: false })
        .eq('id', id);
    });
  }

  async getHistory(kpiId: string, limit = 30) {
    return this.request<KPIHistory[]>(async () => {
      return this.client
        .from('kpi_history')
        .select('*')
        .eq('kpi_id', kpiId)
        .order('recorded_at', { ascending: false })
        .limit(limit);
    });
  }

  async getByCategory(clientId: string, category: string) {
    return this.request<BrandKPI[]>(async () => {
      return this.client
        .from('brand_kpis')
        .select('*')
        .eq('client_id', clientId)
        .eq('category', category)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
    });
  }

  async getByStatus(clientId: string, status: string) {
    return this.request<BrandKPI[]>(async () => {
      return this.client
        .from('brand_kpis')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', status)
        .eq('is_active', true);
    });
  }

  async updateValue(id: string, newValue: number) {
    return this.request<BrandKPI>(async () => {
      return this.client
        .from('brand_kpis')
        .update({ current_value: newValue })
        .eq('id', id)
        .select()
        .single();
    });
  }
}

export const kpiAPI = new KPIAPI();
