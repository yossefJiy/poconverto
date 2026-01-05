// Campaigns domain types

import { BaseEntity, Status } from '../common';

export interface Campaign extends BaseEntity {
  client_id: string;
  name: string;
  description: string | null;
  platform: CampaignPlatform;
  status: CampaignStatus;
  budget: number | null;
  spent: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  start_date: string | null;
  end_date: string | null;
  external_id: string | null;
}

export type CampaignPlatform = 'google_ads' | 'facebook_ads' | 'instagram' | 'tiktok' | 'linkedin';

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export interface CampaignAsset extends BaseEntity {
  campaign_id: string;
  asset_type: AssetType;
  name: string;
  url: string | null;
  content: string | null;
  platform_specs: Record<string, unknown>;
  status: Status;
}

export type AssetType = 'image' | 'video' | 'copy' | 'headline' | 'description' | 'cta';

export interface CreateCampaignDTO {
  client_id: string;
  name: string;
  description?: string;
  platform: CampaignPlatform;
  budget?: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdateCampaignDTO {
  name?: string;
  description?: string;
  status?: CampaignStatus;
  budget?: number;
  start_date?: string;
  end_date?: string;
}
