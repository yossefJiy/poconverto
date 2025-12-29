/**
 * Shared Constants for all Edge Functions
 * ========================================
 */

// ==================== Service Versions ====================

export const SERVICE_VERSIONS = {
  AUTH: '1.0.0',
  SHOPIFY_API: '1.2.0',
  GOOGLE_ADS: '1.1.0',
  GOOGLE_ANALYTICS: '1.0.0',
  WOOCOMMERCE_API: '1.0.0',
  SEND_2FA_CODE: '1.0.0',
  GENERATE_REPORT: '1.0.0',
  AI_MARKETING: '1.0.0',
  SYNC_INTEGRATIONS: '1.0.0',
  WEBHOOK_RECEIVER: '1.0.0',
  DATA_API: '1.0.0',
  MCP_SERVER: '1.0.0',
} as const;

// ==================== API Versions ====================

export const GOOGLE_ADS_API_VERSION = 'v22';
export const SHOPIFY_API_VERSION = '2024-01';

// ==================== Rate Limits ====================

export const RATE_LIMITS = {
  DEFAULT: { maxRequests: 100, windowMs: 60000 },
  AUTH: { maxRequests: 10, windowMs: 60000 },
  REPORTS: { maxRequests: 5, windowMs: 60000 },
  AI: { maxRequests: 20, windowMs: 60000 },
} as const;

// ==================== Timeouts ====================

export const TIMEOUTS = {
  DEFAULT: 30000,
  LONG_RUNNING: 60000,
  EXTERNAL_API: 15000,
} as const;

// ==================== Pagination ====================

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 250,
  DEFAULT_PAGE: 1,
} as const;

// ==================== Cache TTLs (seconds) ====================

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  DAY: 86400,
} as const;

// ==================== Error Messages ====================

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Invalid request data',
  INTEGRATION_ERROR: 'Integration service error',
  RATE_LIMITED: 'Too many requests',
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
} as const;

// ==================== HTTP Status Codes ====================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ==================== Required Env Vars ====================

export const REQUIRED_ENV_VARS = {
  CORE: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  AUTH: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  SHOPIFY: ['SHOPIFY_ACCESS_TOKEN', 'SHOPIFY_STORE_DOMAIN'],
  GOOGLE_ADS: ['GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_DEVELOPER_TOKEN'],
  GOOGLE_ANALYTICS: ['GOOGLE_ANALYTICS_READER'],
  RESEND: ['RESEND_API_KEY'],
} as const;

// ==================== Platforms ====================

export const PLATFORMS = {
  GOOGLE_ADS: 'google_ads',
  GOOGLE_ANALYTICS: 'google_analytics',
  SHOPIFY: 'shopify',
  WOOCOMMERCE: 'woocommerce',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
} as const;

// ==================== Date Formats ====================

export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  DATE_ONLY: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_TIME: 'DD/MM/YYYY HH:mm',
} as const;
