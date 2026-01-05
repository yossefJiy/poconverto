// Competitor API

import { BaseAPI } from './base';

export interface Competitor {
  id: string;
  client_id: string;
  name: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  logo_url: string | null;
  social_links: Record<string, string>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetitorMetric {
  id: string;
  competitor_id: string;
  metric_name: string;
  metric_value: number | null;
  metric_unit: string | null;
  source: string | null;
  recorded_at: string;
  metadata: Record<string, unknown>;
}

export interface CreateCompetitorInput {
  client_id: string;
  name: string;
  website?: string;
  industry?: string;
  description?: string;
  social_links?: Record<string, string>;
}

export interface CreateMetricInput {
  competitor_id: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  source?: string;
}

export class CompetitorAPI extends BaseAPI {
  async list(clientId: string) {
    return this.request<Competitor[]>(async () => {
      return this.client
        .from('competitor_tracking')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('name');
    });
  }

  async getById(id: string) {
    return this.request<Competitor>(async () => {
      return this.client
        .from('competitor_tracking')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async create(data: CreateCompetitorInput) {
    return this.request<Competitor>(async () => {
      return this.client
        .from('competitor_tracking')
        .insert({
          client_id: data.client_id,
          name: data.name,
          website: data.website ?? null,
          industry: data.industry ?? null,
          description: data.description ?? null,
          social_links: data.social_links ?? {},
        })
        .select()
        .single();
    });
  }

  async update(id: string, data: Partial<Competitor>) {
    return this.request<Competitor>(async () => {
      return this.client
        .from('competitor_tracking')
        .update(data as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async delete(id: string) {
    return this.request<null>(async () => {
      return this.client
        .from('competitor_tracking')
        .update({ is_active: false })
        .eq('id', id);
    });
  }

  async getMetrics(competitorId: string, limit = 50) {
    return this.request<CompetitorMetric[]>(async () => {
      return this.client
        .from('competitor_metrics')
        .select('*')
        .eq('competitor_id', competitorId)
        .order('recorded_at', { ascending: false })
        .limit(limit);
    });
  }

  async addMetric(data: CreateMetricInput) {
    return this.request<CompetitorMetric>(async () => {
      return this.client
        .from('competitor_metrics')
        .insert({
          competitor_id: data.competitor_id,
          metric_name: data.metric_name,
          metric_value: data.metric_value,
          metric_unit: data.metric_unit ?? null,
          source: data.source ?? 'manual',
        })
        .select()
        .single();
    });
  }

  async getLatestMetrics(competitorId: string) {
    // Get latest metric for each metric_name
    const { data, error } = await this.client
      .from('competitor_metrics')
      .select('*')
      .eq('competitor_id', competitorId)
      .order('recorded_at', { ascending: false });
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }

    // Deduplicate by metric_name, keeping latest
    const latestByName = new Map<string, CompetitorMetric>();
    for (const metric of (data || []) as CompetitorMetric[]) {
      if (!latestByName.has(metric.metric_name)) {
        latestByName.set(metric.metric_name, metric);
      }
    }

    return { 
      data: Array.from(latestByName.values()), 
      error: null, 
      success: true 
    };
  }
}

export const competitorAPI = new CompetitorAPI();
