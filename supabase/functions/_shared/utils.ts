/**
 * Shared Utilities for all Edge Functions
 * ========================================
 */

import type { ApiResponse, HealthCheckResponse, HealthCheck, ErrorCode } from "./types.ts";

// ==================== CORS Headers ====================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==================== Response Helpers ====================

/**
 * Create a successful JSON response
 */
export function successResponse<T>(data: T, status = 200): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create an error JSON response
 */
export function errorResponse(
  message: string, 
  status = 500, 
  code?: ErrorCode
): Response {
  const body: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };
  
  console.error(`[Error] ${code || 'UNKNOWN'}: ${message}`);
  
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create a CORS preflight response
 */
export function corsResponse(): Response {
  return new Response(null, { headers: corsHeaders });
}

// ==================== Health Check ====================

const SERVICE_START_TIME = Date.now();

/**
 * Create a health check response
 */
export function healthCheckResponse(
  serviceName: string,
  version = '1.0.0',
  checks: HealthCheck[] = []
): Response {
  const failedChecks = checks.filter(c => c.status === 'fail');
  const warnChecks = checks.filter(c => c.status === 'warn');
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (failedChecks.length > 0) {
    status = 'unhealthy';
  } else if (warnChecks.length > 0) {
    status = 'degraded';
  }
  
  const body: HealthCheckResponse = {
    status,
    service: serviceName,
    version,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - SERVICE_START_TIME) / 1000),
    checks: checks.length > 0 ? checks : undefined,
  };
  
  const httpStatus = status === 'unhealthy' ? 503 : 200;
  
  return new Response(JSON.stringify(body), {
    status: httpStatus,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Check database connectivity
 */
export async function checkDatabase(supabase: any): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const { error } = await supabase.from('clients').select('id').limit(1);
    const latencyMs = Date.now() - start;
    
    if (error) {
      return {
        name: 'database',
        status: 'fail',
        message: error.message,
        latencyMs,
      };
    }
    
    return {
      name: 'database',
      status: latencyMs > 1000 ? 'warn' : 'pass',
      message: latencyMs > 1000 ? 'Slow response' : 'Connected',
      latencyMs,
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Check if required environment variables are set
 */
export function checkEnvVars(requiredVars: readonly string[] | string[]): HealthCheck {
  const missing = requiredVars.filter(v => !Deno.env.get(v));
  
  if (missing.length > 0) {
    return {
      name: 'environment',
      status: 'fail',
      message: `Missing: ${missing.join(', ')}`,
    };
  }
  
  return {
    name: 'environment',
    status: 'pass',
    message: 'All required variables set',
  };
}

// ==================== Date Helpers ====================

/**
 * Extract YYYY-MM-DD from various date formats
 */
export function extractDateOnly(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date range for last N days
 */
export function getLastNDays(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  
  return {
    from: extractDateOnly(from.toISOString()),
    to: extractDateOnly(to.toISOString()),
  };
}

/**
 * Parse date range from request or use defaults
 */
export function parseDateRange(
  dateFrom?: string,
  dateTo?: string,
  defaultDays = 30
): { from: string; to: string } {
  if (dateFrom && dateTo) {
    return {
      from: extractDateOnly(dateFrom),
      to: extractDateOnly(dateTo),
    };
  }
  return getLastNDays(defaultDays);
}

// ==================== Validation Helpers ====================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ==================== Logging Helpers ====================

/**
 * Create a prefixed logger for a service
 */
export function createLogger(serviceName: string) {
  const prefix = `[${serviceName}]`;
  
  return {
    info: (...args: unknown[]) => console.log(prefix, ...args),
    warn: (...args: unknown[]) => console.warn(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
    debug: (...args: unknown[]) => console.log(`${prefix}[DEBUG]`, ...args),
  };
}

// ==================== Rate Limiting ====================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter (per function instance)
 */
export function checkRateLimit(
  key: string,
  maxRequests = 100,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

// ==================== Retry Helper ====================

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// ==================== Currency Helpers ====================

/**
 * Format currency value
 */
export function formatCurrency(
  value: number,
  currency = 'ILS',
  locale = 'he-IL'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Convert micros to currency (Google Ads uses micros)
 */
export function microsToAmount(micros: number): number {
  return micros / 1_000_000;
}
