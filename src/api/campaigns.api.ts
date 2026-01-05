// Campaigns API

import { BaseAPI } from './base';

// Use database-compatible types
export interface CampaignRow {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  platform: string;
  status: string;
  budget: number | null;
  spent: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  start_date: string | null;
  end_date: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  client_id: string;
  name: string;
  description?: string;
  platform: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  status?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
}

export class CampaignsAPI extends BaseAPI {
  async list(clientId: string) {
    return this.request<CampaignRow[]>(async () => {
      return this.client
        .from('campaigns')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
    });
  }

  async getById(id: string) {
    return this.request<CampaignRow>(async () => {
      return this.client
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async create(data: CreateCampaignInput) {
    return this.request<CampaignRow>(async () => {
      return this.client
        .from('campaigns')
        .insert(data)
        .select()
        .single();
    });
  }

  async update(id: string, data: UpdateCampaignInput) {
    return this.request<CampaignRow>(async () => {
      return this.client
        .from('campaigns')
        .update(data)
        .eq('id', id)
        .select()
        .single();
    });
  }

  async delete(id: string) {
    return this.request<null>(async () => {
      return this.client
        .from('campaigns')
        .delete()
        .eq('id', id);
    });
  }

  async getByPlatform(clientId: string, platform: string) {
    return this.request<CampaignRow[]>(async () => {
      return this.client
        .from('campaigns')
        .select('*')
        .eq('client_id', clientId)
        .eq('platform', platform)
        .order('created_at', { ascending: false });
    });
  }
}

export const campaignsAPI = new CampaignsAPI();
