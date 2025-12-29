/**
 * Shared Types for all Edge Functions
 * =====================================
 */

// ==================== API Response Types ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  timestamp: string;
  uptime?: number;
  checks?: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  latencyMs?: number;
}

// ==================== Auth Types ====================

export interface AuthResult {
  authenticated: boolean;
  user: User | null;
  error?: string;
}

export interface User {
  id: string;
  email?: string;
  role?: AppRole;
  [key: string]: unknown;
}

export type AppRole = 
  | 'admin' 
  | 'manager' 
  | 'department_head' 
  | 'team_lead' 
  | 'team_member' 
  | 'client' 
  | 'demo';

// ==================== Client Types ====================

export interface Client {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  logo_url?: string;
  modules_enabled?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

// ==================== Integration Types ====================

export interface Integration {
  id: string;
  client_id: string;
  platform: Platform;
  is_connected: boolean;
  last_sync_at?: string;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type Platform = 
  | 'google_ads' 
  | 'google_analytics' 
  | 'shopify' 
  | 'woocommerce' 
  | 'facebook' 
  | 'instagram';

export interface IntegrationCredentials {
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  api_key?: string;
  api_secret?: string;
  store_domain?: string;
  customer_id?: string;
}

// ==================== Analytics Types ====================

export interface AnalyticsSnapshot {
  id: string;
  client_id: string;
  platform: Platform;
  integration_id?: string;
  snapshot_date: string;
  metrics: AnalyticsMetrics;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsMetrics {
  revenue?: number;
  orders?: number;
  sessions?: number;
  visitors?: number;
  conversionRate?: number;
  impressions?: number;
  clicks?: number;
  cost?: number;
  ctr?: number;
  cpc?: number;
  conversions?: number;
  roas?: number;
}

export interface DateRange {
  from: string;
  to: string;
}

// ==================== Campaign Types ====================

export interface Campaign {
  id: string;
  client_id: string;
  name: string;
  platform: string;
  status: CampaignStatus;
  budget?: number;
  spent?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';

// ==================== Task Types ====================

export interface Task {
  id: string;
  client_id?: string;
  campaign_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// ==================== Report Types ====================

export interface ReportRequest {
  client_id: string;
  type: ReportType;
  date_from: string;
  date_to: string;
  platforms?: Platform[];
  format?: 'pdf' | 'json';
}

export type ReportType = 'performance' | 'revenue' | 'campaigns' | 'full';

// ==================== Webhook Types ====================

export interface WebhookPayload {
  source: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  signature?: string;
}

// ==================== Request Types ====================

export interface ShopifyRequest {
  action: 'get_products' | 'get_product' | 'get_orders' | 'get_inventory' | 'test_connection' | 'get_shop' | 'get_analytics' | 'health';
  product_id?: string;
  limit?: number;
  page_info?: string;
  date_from?: string;
  date_to?: string;
}

export interface GoogleAdsRequest {
  action: 'get_campaigns' | 'get_metrics' | 'get_keywords' | 'health';
  client_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface TwoFactorRequest {
  email: string;
  action: 'send' | 'verify';
  code?: string;
}

// ==================== Error Types ====================

export interface ServiceError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export type ErrorCode = 
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INTEGRATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';
