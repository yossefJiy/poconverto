// Analytics domain types

import { DateRange, BaseEntity } from '../common';

export interface AnalyticsMetrics {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
  roas: number;
}

export interface AnalyticsData extends AnalyticsMetrics {
  dateRange: DateRange;
  platform: AnalyticsPlatform;
}

export type AnalyticsPlatform = 
  | 'google_ads' 
  | 'facebook_ads' 
  | 'google_analytics' 
  | 'shopify' 
  | 'woocommerce';

export interface AnalyticsSnapshot extends BaseEntity {
  client_id: string;
  platform: AnalyticsPlatform;
  metrics: AnalyticsMetrics;
  snapshot_date: string;
  data: Record<string, unknown>;
}

export interface PlatformConnection extends BaseEntity {
  client_id: string;
  platform: AnalyticsPlatform;
  is_connected: boolean;
  last_sync: string | null;
  error_message: string | null;
}
