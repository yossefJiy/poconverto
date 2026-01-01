import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsRequest {
  action: 'overview' | 'platform' | 'sync' | 'health';
  clientId?: string;
  platform?: 'google_ads' | 'facebook_ads' | 'shopify' | 'google_analytics' | 'woocommerce';
  startDate?: string;
  endDate?: string;
  forceRefresh?: boolean;
}

interface PlatformMetrics {
  platform: string;
  connected: boolean;
  lastSync: string | null;
  metrics: {
    revenue?: number;
    cost?: number;
    orders?: number;
    conversions?: number;
    impressions?: number;
    clicks?: number;
    sessions?: number;
    conversionRate?: number;
  };
  trend?: {
    revenue?: number;
    cost?: number;
    orders?: number;
    conversions?: number;
  };
}

interface OverviewResponse {
  summary: {
    totalRevenue: number;
    totalAdSpend: number;
    totalOrders: number;
    totalConversions: number;
    roi: number;
    roasBreakdown: {
      googleAds: number;
      facebookAds: number;
    };
  };
  platforms: PlatformMetrics[];
  lastUpdated: string;
  cacheAge: number; // minutes
}

// Cache duration in minutes
const CACHE_DURATION_MINUTES = 15;

// Create Supabase admin client
function createAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

// Validate authentication
async function validateAuth(req: Request): Promise<{ authenticated: boolean; user?: any; error?: string }> {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'Missing or invalid Authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      return { authenticated: false, error: error?.message || 'Invalid token' };
    }

    return { authenticated: true, user };
  } catch (error) {
    return { authenticated: false, error: 'Authentication failed' };
  }
}

// Get cached overview from analytics_snapshots
async function getCachedOverview(supabase: any, clientId: string): Promise<{ data: OverviewResponse | null; cacheAge: number }> {
  const { data: snapshots, error } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .eq('client_id', clientId)
    .order('updated_at', { ascending: false });

  if (error || !snapshots || snapshots.length === 0) {
    return { data: null, cacheAge: Infinity };
  }

  // Find the most recent snapshot
  const latestSnapshot = snapshots[0];
  const cacheAge = (Date.now() - new Date(latestSnapshot.updated_at).getTime()) / (1000 * 60);

  // If cache is still valid, build overview from snapshots
  if (cacheAge < CACHE_DURATION_MINUTES) {
    const overview = buildOverviewFromSnapshots(snapshots);
    return { data: { ...overview, cacheAge: Math.round(cacheAge) }, cacheAge };
  }

  return { data: null, cacheAge };
}

// Build overview response from snapshots
function buildOverviewFromSnapshots(snapshots: any[]): OverviewResponse {
  const platforms: PlatformMetrics[] = [];
  let totalRevenue = 0;
  let totalAdSpend = 0;
  let totalOrders = 0;
  let totalConversions = 0;
  let googleAdsSpend = 0;
  let googleAdsRevenue = 0;
  let facebookAdsSpend = 0;
  let facebookAdsRevenue = 0;

  for (const snapshot of snapshots) {
    const metrics = snapshot.metrics as any || {};
    const data = snapshot.data as any || {};

    const platformMetric: PlatformMetrics = {
      platform: snapshot.platform,
      connected: true,
      lastSync: snapshot.updated_at,
      metrics: {},
    };

    switch (snapshot.platform) {
      case 'shopify':
        platformMetric.metrics = {
          revenue: data.summary?.totalRevenue || 0,
          orders: data.summary?.totalOrders || 0,
          conversionRate: data.summary?.conversionRate || 0,
          sessions: data.summary?.sessions || 0,
        };
        totalRevenue += platformMetric.metrics.revenue || 0;
        totalOrders += platformMetric.metrics.orders || 0;
        break;

      case 'google_ads':
        platformMetric.metrics = {
          cost: data.account?.totalCost || 0,
          conversions: data.account?.totalConversions || 0,
          impressions: data.account?.totalImpressions || 0,
          clicks: data.account?.totalClicks || 0,
        };
        googleAdsSpend = platformMetric.metrics.cost || 0;
        googleAdsRevenue = data.account?.totalConversionValue || 0;
        totalAdSpend += platformMetric.metrics.cost || 0;
        totalConversions += platformMetric.metrics.conversions || 0;
        break;

      case 'facebook_ads':
        platformMetric.metrics = {
          cost: data.totals?.cost || 0,
          conversions: data.totals?.conversions || 0,
          impressions: data.totals?.impressions || 0,
          clicks: data.totals?.clicks || 0,
        };
        facebookAdsSpend = platformMetric.metrics.cost || 0;
        facebookAdsRevenue = data.totals?.conversionValue || 0;
        totalAdSpend += platformMetric.metrics.cost || 0;
        totalConversions += platformMetric.metrics.conversions || 0;
        break;

      case 'google_analytics':
        platformMetric.metrics = {
          sessions: metrics.sessions || data.sessions || 0,
          conversionRate: metrics.conversionRate || 0,
        };
        break;

      case 'woocommerce':
        platformMetric.metrics = {
          revenue: data.summary?.totalRevenue || 0,
          orders: data.summary?.totalOrders || 0,
        };
        totalRevenue += platformMetric.metrics.revenue || 0;
        totalOrders += platformMetric.metrics.orders || 0;
        break;
    }

    platforms.push(platformMetric);
  }

  const roi = totalAdSpend > 0 ? ((totalRevenue - totalAdSpend) / totalAdSpend) * 100 : 0;

  return {
    summary: {
      totalRevenue,
      totalAdSpend,
      totalOrders,
      totalConversions,
      roi,
      roasBreakdown: {
        googleAds: googleAdsSpend > 0 ? googleAdsRevenue / googleAdsSpend : 0,
        facebookAds: facebookAdsSpend > 0 ? facebookAdsRevenue / facebookAdsSpend : 0,
      },
    },
    platforms,
    lastUpdated: snapshots[0]?.updated_at || new Date().toISOString(),
    cacheAge: 0,
  };
}

// Fetch fresh data from platform APIs
async function fetchPlatformData(
  supabase: any, 
  clientId: string, 
  platform: string, 
  startDate: string, 
  endDate: string
): Promise<any> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  let functionName: string;
  let body: any = { clientId, startDate, endDate };

  switch (platform) {
    case 'google_ads':
      functionName = 'google-ads';
      break;
    case 'facebook_ads':
      functionName = 'facebook-ads';
      break;
    case 'shopify':
      functionName = 'shopify-api';
      body = { action: 'analytics', startDate, endDate };
      break;
    case 'google_analytics':
      functionName = 'google-analytics';
      break;
    case 'woocommerce':
      functionName = 'woocommerce-api';
      body = { action: 'analytics', startDate, endDate };
      break;
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }

  console.log(`[Analytics API] Fetching ${platform} data...`);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Analytics API] ${platform} fetch failed:`, errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`[Analytics API] ${platform} fetch error:`, error);
    return null;
  }
}

// Save data to analytics_snapshots
async function saveSnapshot(
  supabase: any,
  clientId: string,
  platform: string,
  data: any
): Promise<void> {
  const metrics = extractMetrics(platform, data);

  // Check if snapshot exists
  const { data: existing } = await supabase
    .from('analytics_snapshots')
    .select('id')
    .eq('client_id', clientId)
    .eq('platform', platform)
    .single();

  if (existing) {
    // Update existing
    await supabase
      .from('analytics_snapshots')
      .update({
        data,
        metrics,
        updated_at: new Date().toISOString(),
        snapshot_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', existing.id);
  } else {
    // Insert new
    await supabase
      .from('analytics_snapshots')
      .insert({
        client_id: clientId,
        platform,
        data,
        metrics,
        snapshot_date: new Date().toISOString().split('T')[0],
      });
  }

  console.log(`[Analytics API] Saved ${platform} snapshot for client ${clientId}`);
}

// Extract key metrics from platform data
function extractMetrics(platform: string, data: any): any {
  if (!data) return {};

  switch (platform) {
    case 'shopify':
      return {
        totalRevenue: data.summary?.totalRevenue || 0,
        totalOrders: data.summary?.totalOrders || 0,
        avgOrderValue: data.summary?.avgOrderValue || 0,
        conversionRate: data.summary?.conversionRate || 0,
      };
    case 'google_ads':
      return {
        totalCost: data.account?.totalCost || 0,
        totalConversions: data.account?.totalConversions || 0,
        totalImpressions: data.account?.totalImpressions || 0,
        totalClicks: data.account?.totalClicks || 0,
      };
    case 'facebook_ads':
      return {
        totalCost: data.totals?.cost || 0,
        totalConversions: data.totals?.conversions || 0,
        totalImpressions: data.totals?.impressions || 0,
        totalClicks: data.totals?.clicks || 0,
      };
    case 'google_analytics':
      return {
        sessions: data.sessions || 0,
        users: data.users || 0,
        pageviews: data.pageviews || 0,
        bounceRate: data.bounceRate || 0,
      };
    case 'woocommerce':
      return {
        totalRevenue: data.summary?.totalRevenue || 0,
        totalOrders: data.summary?.totalOrders || 0,
        avgOrderValue: data.summary?.avgOrderValue || 0,
      };
    default:
      return {};
  }
}

// Get connected integrations for a client
async function getConnectedIntegrations(supabase: any, clientId: string): Promise<string[]> {
  const { data: integrations, error } = await supabase
    .from('integrations')
    .select('platform')
    .eq('client_id', clientId)
    .eq('is_connected', true);

  if (error || !integrations) {
    return [];
  }

  return integrations.map((i: any) => i.platform);
}

// Handle overview request
async function handleOverview(
  supabase: any, 
  clientId: string, 
  startDate: string, 
  endDate: string,
  forceRefresh: boolean
): Promise<OverviewResponse> {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const { data: cached, cacheAge } = await getCachedOverview(supabase, clientId);
    if (cached && cacheAge < CACHE_DURATION_MINUTES) {
      console.log(`[Analytics API] Returning cached overview (${cacheAge} min old)`);
      return cached;
    }
  }

  // Get connected integrations
  const connectedPlatforms = await getConnectedIntegrations(supabase, clientId);
  console.log(`[Analytics API] Connected platforms:`, connectedPlatforms);

  // Fetch fresh data from all connected platforms in parallel
  const fetchPromises = connectedPlatforms.map(async (platform) => {
    const data = await fetchPlatformData(supabase, clientId, platform, startDate, endDate);
    if (data && !data.error) {
      await saveSnapshot(supabase, clientId, platform, data);
    }
    return { platform, data };
  });

  await Promise.all(fetchPromises);

  // Get updated snapshots
  const { data: snapshots } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .eq('client_id', clientId);

  if (!snapshots || snapshots.length === 0) {
    return {
      summary: {
        totalRevenue: 0,
        totalAdSpend: 0,
        totalOrders: 0,
        totalConversions: 0,
        roi: 0,
        roasBreakdown: { googleAds: 0, facebookAds: 0 },
      },
      platforms: connectedPlatforms.map(p => ({
        platform: p,
        connected: true,
        lastSync: null,
        metrics: {},
      })),
      lastUpdated: new Date().toISOString(),
      cacheAge: 0,
    };
  }

  return { ...buildOverviewFromSnapshots(snapshots), cacheAge: 0 };
}

// Handle platform-specific request
async function handlePlatform(
  supabase: any,
  clientId: string,
  platform: string,
  startDate: string,
  endDate: string,
  forceRefresh: boolean
): Promise<any> {
  // Check cache first
  if (!forceRefresh) {
    const { data: snapshot } = await supabase
      .from('analytics_snapshots')
      .select('*')
      .eq('client_id', clientId)
      .eq('platform', platform)
      .single();

    if (snapshot) {
      const cacheAge = (Date.now() - new Date(snapshot.updated_at).getTime()) / (1000 * 60);
      if (cacheAge < CACHE_DURATION_MINUTES) {
        console.log(`[Analytics API] Returning cached ${platform} data (${cacheAge.toFixed(1)} min old)`);
        return {
          ...snapshot.data,
          cached: true,
          cacheAge: Math.round(cacheAge),
          lastUpdated: snapshot.updated_at,
        };
      }
    }
  }

  // Fetch fresh data
  const data = await fetchPlatformData(supabase, clientId, platform, startDate, endDate);
  
  if (data && !data.error) {
    await saveSnapshot(supabase, clientId, platform, data);
  }

  return {
    ...data,
    cached: false,
    cacheAge: 0,
    lastUpdated: new Date().toISOString(),
  };
}

// Handle sync request
async function handleSync(supabase: any, clientId: string, startDate: string, endDate: string): Promise<any> {
  const connectedPlatforms = await getConnectedIntegrations(supabase, clientId);
  
  const results = await Promise.all(
    connectedPlatforms.map(async (platform) => {
      try {
        const data = await fetchPlatformData(supabase, clientId, platform, startDate, endDate);
        if (data && !data.error) {
          await saveSnapshot(supabase, clientId, platform, data);
          return { platform, status: 'success' };
        }
        return { platform, status: 'error', error: data?.error || 'Unknown error' };
      } catch (error) {
        return { platform, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
      }
    })
  );

  return {
    synced: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    results,
    timestamp: new Date().toISOString(),
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AnalyticsRequest = await req.json();
    const { action, clientId, platform, startDate, endDate, forceRefresh } = body;

    // Health check - no auth required
    if (action === 'health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'analytics-api',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        features: ['overview', 'platform', 'sync', 'caching'],
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate authentication for all other actions
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      console.error('[Analytics API] Auth failed:', auth.error);
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Client ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default date range: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const effectiveStartDate = startDate || thirtyDaysAgo.toISOString().split('T')[0];
    const effectiveEndDate = endDate || today.toISOString().split('T')[0];

    const supabase = createAdminClient();
    let response: any;

    switch (action) {
      case 'overview':
        console.log(`[Analytics API] Overview request for client ${clientId}`);
        response = await handleOverview(supabase, clientId, effectiveStartDate, effectiveEndDate, forceRefresh || false);
        break;

      case 'platform':
        if (!platform) {
          return new Response(JSON.stringify({ error: 'Platform is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.log(`[Analytics API] Platform request for ${platform}, client ${clientId}`);
        response = await handlePlatform(supabase, clientId, platform, effectiveStartDate, effectiveEndDate, forceRefresh || false);
        break;

      case 'sync':
        console.log(`[Analytics API] Sync request for client ${clientId}`);
        response = await handleSync(supabase, clientId, effectiveStartDate, effectiveEndDate);
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Analytics API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});