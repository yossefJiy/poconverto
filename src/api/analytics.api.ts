// Analytics API

import { BaseAPI } from './base';
import { DateRange } from '@/types/common';

// Use database types directly for better compatibility
export interface AnalyticsSnapshotRow {
  id: string;
  client_id: string;
  platform: string;
  metrics: Record<string, unknown>;
  snapshot_date: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  integration_id: string | null;
}

export class AnalyticsAPI extends BaseAPI {
  async getSnapshots(clientId: string, platform?: string) {
    return this.request<AnalyticsSnapshotRow[]>(async () => {
      let query = this.client
        .from('analytics_snapshots')
        .select('*')
        .eq('client_id', clientId)
        .order('snapshot_date', { ascending: false });
      
      if (platform) {
        query = query.eq('platform', platform);
      }
      
      return query;
    });
  }

  async getSnapshotsByDateRange(
    clientId: string, 
    dateRange: DateRange,
    platform?: string
  ) {
    return this.request<AnalyticsSnapshotRow[]>(async () => {
      let query = this.client
        .from('analytics_snapshots')
        .select('*')
        .eq('client_id', clientId)
        .gte('snapshot_date', dateRange.from.toISOString())
        .lte('snapshot_date', dateRange.to.toISOString())
        .order('snapshot_date', { ascending: true });
      
      if (platform) {
        query = query.eq('platform', platform);
      }
      
      return query;
    });
  }

  async getLatestSnapshot(clientId: string, platform: string) {
    return this.request<AnalyticsSnapshotRow>(async () => {
      return this.client
        .from('analytics_snapshots')
        .select('*')
        .eq('client_id', clientId)
        .eq('platform', platform)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();
    });
  }
}

export const analyticsAPI = new AnalyticsAPI();
