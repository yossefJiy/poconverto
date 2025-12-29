import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  corsHeaders, 
  successResponse, 
  errorResponse, 
  corsResponse,
  createLogger 
} from '../_shared/utils.ts';
import { SERVICE_VERSIONS } from '../_shared/constants.ts';

const logger = createLogger('health-check');
const startTime = Date.now();

interface ServiceHealth {
  name: string;
  displayName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  version?: string;
  message?: string;
  lastCheck: string;
}

interface AggregateHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: ServiceHealth[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

const SERVICES = [
  { name: 'shopify-api', displayName: 'Shopify API', action: { action: 'health' } },
  { name: 'google-ads', displayName: 'Google Ads', action: { action: 'health' } },
  { name: 'google-analytics', displayName: 'Google Analytics', action: { action: 'health' } },
  { name: 'woocommerce-api', displayName: 'WooCommerce API', action: { action: 'health' } },
  { name: 'send-2fa-code', displayName: '2FA Service', action: { action: 'health' } },
  { name: 'ai-marketing', displayName: 'AI Marketing', action: { type: 'health' } },
  { name: 'generate-report', displayName: 'Report Generator', action: { type: 'health' } },
];

const TIMEOUT_MS = 5000;

async function checkService(
  supabaseUrl: string,
  anonKey: string,
  service: typeof SERVICES[0]
): Promise<ServiceHealth> {
  const startMs = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/${service.name}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify(service.action),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startMs;

    if (!response.ok) {
      return {
        name: service.name,
        displayName: service.displayName,
        status: 'unhealthy',
        latencyMs,
        message: `HTTP ${response.status}`,
        lastCheck: new Date().toISOString(),
      };
    }

    const data = await response.json();
    
    return {
      name: service.name,
      displayName: service.displayName,
      status: data.status || 'healthy',
      latencyMs,
      version: data.version,
      message: data.status === 'healthy' ? undefined : data.message,
      lastCheck: new Date().toISOString(),
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startMs;
    
    const error = err as Error;
    const isTimeout = error.name === 'AbortError';
    
    return {
      name: service.name,
      displayName: service.displayName,
      status: 'unhealthy',
      latencyMs,
      message: isTimeout ? 'Timeout' : (error.message || 'Connection failed'),
      lastCheck: new Date().toISOString(),
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !anonKey) {
      logger.error('Missing Supabase configuration');
      return errorResponse('Service configuration error', 500);
    }

    logger.info('Starting aggregate health check');

    // Check all services in parallel
    const healthChecks = await Promise.all(
      SERVICES.map(service => checkService(supabaseUrl, anonKey, service))
    );

    // Calculate summary
    const summary = {
      total: healthChecks.length,
      healthy: healthChecks.filter(s => s.status === 'healthy').length,
      degraded: healthChecks.filter(s => s.status === 'degraded').length,
      unhealthy: healthChecks.filter(s => s.status === 'unhealthy').length,
    };

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (summary.unhealthy > 0) {
      overallStatus = summary.unhealthy === summary.total ? 'unhealthy' : 'degraded';
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded';
    }

    const response: AggregateHealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: healthChecks,
      summary,
    };

    logger.info(`Health check complete: ${overallStatus} (${summary.healthy}/${summary.total} healthy)`);

    return successResponse(response);
  } catch (error) {
    logger.error('Health check failed:', error);
    return errorResponse('Health check failed', 500);
  }
});
