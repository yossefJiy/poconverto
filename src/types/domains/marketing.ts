// Marketing and AI types

export interface CampaignDataMetrics {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  spent?: number;
  budget?: number;
  ctr?: number;
  cpc?: number;
}

export interface CampaignData {
  id: string;
  name: string;
  platform: string;
  status: string;
  metrics?: CampaignDataMetrics;
}

export interface PersonaData {
  id?: string;
  name: string;
  description?: string;
  demographics?: Record<string, string | number>;
}

export interface CompetitorData {
  id?: string;
  name: string;
  website?: string;
  industry?: string;
  social_links?: Record<string, string>;
}

export interface BrandMessage {
  id?: string;
  message: string;
  type?: string;
}

export interface MarketingGoal {
  id?: string;
  name: string;
  target: number;
  current?: number;
  unit?: string;
}

export interface AIContext {
  client_name?: string;
  industry?: string;
  platform?: string;
  campaign_data?: CampaignData;
  personas?: PersonaData[];
  competitors?: CompetitorData[];
  brand_messages?: BrandMessage[];
  goals?: MarketingGoal[];
}
