// Clients domain types

import { BaseEntity } from '../common';

export interface Client extends BaseEntity {
  name: string;
  description: string | null;
  industry: string | null;
  website: string | null;
  logo_url: string | null;
  is_active: boolean;
  is_master_account: boolean;
  modules_enabled: ClientModules | null;
  social_links: ClientSocialLinks;
  deleted_at: string | null;
}

export interface ClientModules {
  analytics: boolean;
  campaigns: boolean;
  tasks: boolean;
  ai: boolean;
  ecommerce: boolean;
  social: boolean;
  reports: boolean;
  content: boolean;
}

export interface ClientSocialLinks {
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  linkedin_url?: string | null;
  tiktok_url?: string | null;
}

export interface ClientKPI extends BaseEntity {
  client_id: string;
  name: string;
  target_value: number;
  current_value: number;
  unit: string;
  category: KPICategory;
  period: KPIPeriod;
  status: KPIStatus;
}

export type KPICategory = 'revenue' | 'traffic' | 'engagement' | 'conversion' | 'brand' | 'custom';
export type KPIPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type KPIStatus = 'on_track' | 'at_risk' | 'behind' | 'exceeded';

export interface ClientContact extends BaseEntity {
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_primary: boolean;
  has_portal_access: boolean;
  receive_task_updates: boolean;
}
