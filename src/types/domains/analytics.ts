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

// GA Response types for useAnalyticsData
export interface GAResponseRow {
  dimensionValues?: Array<{ value: string }>;
  metricValues?: Array<{ value: string }>;
}

export interface GAResponseData {
  dailyMetrics?: {
    rows?: GAResponseRow[];
  };
  trafficSources?: {
    rows?: GAResponseRow[];
  };
  topPages?: {
    rows?: GAResponseRow[];
  };
  devices?: {
    rows?: GAResponseRow[];
  };
  countries?: {
    rows?: GAResponseRow[];
  };
  ecommerce?: {
    totals?: {
      addToCarts?: number;
      checkouts?: number;
      purchases?: number;
      purchaseRevenue?: number;
      transactions?: number;
      sessions?: number;
    };
    conversionRates?: {
      addToCartRate?: string;
      checkoutRate?: string;
      purchaseRate?: string;
      overallConversionRate?: string;
    };
  };
  error?: string;
}

export interface IntegrationSettings {
  property_id?: string;
  account_id?: string;
  refresh_token?: string;
  access_token?: string;
  [key: string]: string | undefined;
}

export interface Integration {
  id: string;
  client_id: string;
  platform: string;
  is_connected: boolean;
  settings?: IntegrationSettings;
  created_at?: string;
  updated_at?: string;
}
