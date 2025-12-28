import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  client_id?: string; // Optional - if not provided, sync all clients
  platforms?: string[]; // Optional - if not provided, sync all platforms
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[Analytics Sync] Background sync started');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: SyncRequest = {};
    try {
      body = await req.json();
    } catch {
      // No body provided, sync all
    }

    const { client_id, platforms = ['shopify', 'google_ads', 'google_analytics'] } = body;

    // Get clients to sync
    let clientsQuery = supabase.from('clients').select('id, name, is_ecommerce');
    if (client_id) {
      clientsQuery = clientsQuery.eq('id', client_id);
    }
    
    const { data: clients, error: clientsError } = await clientsQuery;
    
    if (clientsError) {
      console.error('[Analytics Sync] Error fetching clients:', clientsError);
      throw new Error('Failed to fetch clients');
    }

    console.log(`[Analytics Sync] Syncing ${clients?.length || 0} clients`);

    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const syncResults: any[] = [];

    for (const client of clients || []) {
      console.log(`[Analytics Sync] Processing client: ${client.name}`);
      
      // Sync Shopify if client is ecommerce
      if (platforms.includes('shopify') && client.is_ecommerce) {
        try {
          const shopifyData = await fetchShopifyData(startOfMonth, today);
          if (shopifyData) {
            await saveSnapshot(supabase, client.id, 'shopify', shopifyData);
            syncResults.push({ client_id: client.id, platform: 'shopify', success: true });
          }
        } catch (err) {
          console.error(`[Analytics Sync] Shopify error for ${client.name}:`, err);
          syncResults.push({ client_id: client.id, platform: 'shopify', success: false, error: String(err) });
        }
      }

      // Sync Google Ads
      if (platforms.includes('google_ads')) {
        try {
          const googleAdsData = await fetchGoogleAdsData(startOfMonth, today);
          if (googleAdsData) {
            await saveSnapshot(supabase, client.id, 'google_ads', googleAdsData);
            syncResults.push({ client_id: client.id, platform: 'google_ads', success: true });
          }
        } catch (err) {
          console.error(`[Analytics Sync] Google Ads error for ${client.name}:`, err);
          syncResults.push({ client_id: client.id, platform: 'google_ads', success: false, error: String(err) });
        }
      }

      // Update last sync time
      await supabase
        .from('sync_schedules')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('client_id', client.id);
    }

    console.log('[Analytics Sync] Background sync completed', syncResults);

    return new Response(
      JSON.stringify({ 
        success: true, 
        synced_clients: clients?.length || 0,
        results: syncResults,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Analytics Sync] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

async function fetchShopifyData(startDate: string, endDate: string): Promise<any> {
  const shopifyDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');
  const shopifyToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN');
  
  if (!shopifyDomain || !shopifyToken) {
    console.log('[Analytics Sync] Shopify not configured');
    return null;
  }

  const apiVersion = '2024-01';
  const baseUrl = `https://${shopifyDomain}/admin/api/${apiVersion}`;

  // Fetch orders
  const ordersResponse = await fetch(
    `${baseUrl}/orders.json?created_at_min=${startDate}T00:00:00Z&created_at_max=${endDate}T23:59:59Z&status=any&limit=250`,
    {
      headers: {
        'X-Shopify-Access-Token': shopifyToken,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!ordersResponse.ok) {
    throw new Error(`Shopify API error: ${ordersResponse.status}`);
  }

  const { orders } = await ordersResponse.json();
  
  // Calculate metrics
  const activeOrders = orders.filter((o: any) => !o.cancelled_at);
  const totalRevenue = activeOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || 0), 0);
  const orderCount = activeOrders.length;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  // Try to get sessions via ShopifyQL
  let sessions = 0;
  let conversionRate = 0;
  
  try {
    const qlResponse = await fetch(`${baseUrl}/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': shopifyToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `{
          shopifyqlQuery(query: "FROM sessions SHOW sum(sessions) AS sessions SINCE ${startDate} UNTIL ${endDate}") {
            tableData { rowData }
          }
        }`
      }),
    });
    
    if (qlResponse.ok) {
      const qlData = await qlResponse.json();
      const rows = qlData?.data?.shopifyqlQuery?.tableData?.rowData;
      if (rows?.[0]) {
        sessions = parseInt(rows[0][0]) || 0;
        conversionRate = sessions > 0 ? (orderCount / sessions) * 100 : 0;
      }
    }
  } catch (err) {
    console.log('[Analytics Sync] ShopifyQL failed, using fallback');
  }

  return {
    orders: orderCount,
    revenue: totalRevenue,
    avgOrderValue,
    sessions,
    conversionRate,
    dateRange: { startDate, endDate },
    syncedAt: new Date().toISOString(),
  };
}

async function fetchGoogleAdsData(startDate: string, endDate: string): Promise<any> {
  const clientId = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN');
  const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
  const customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID');

  if (!clientId || !clientSecret || !refreshToken || !developerToken || !customerId) {
    console.log('[Analytics Sync] Google Ads not configured');
    return null;
  }

  // Get access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to get Google Ads access token');
  }

  const { access_token } = await tokenResponse.json();

  // Query Google Ads API
  const query = `
    SELECT
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM customer
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
  `;

  const apiUrl = `https://googleads.googleapis.com/v18/customers/${customerId.replace(/-/g, '')}/googleAds:searchStream`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Ads API error: ${errorText}`);
  }

  const results = await response.json();
  
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalCost = 0;
  let totalConversions = 0;
  let totalConversionValue = 0;

  for (const result of results || []) {
    for (const row of result.results || []) {
      const metrics = row.metrics || {};
      totalImpressions += parseInt(metrics.impressions || 0);
      totalClicks += parseInt(metrics.clicks || 0);
      totalCost += parseInt(metrics.costMicros || 0) / 1000000;
      totalConversions += parseFloat(metrics.conversions || 0);
      totalConversionValue += parseFloat(metrics.conversionsValue || 0);
    }
  }

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalCost / totalClicks : 0;

  return {
    impressions: totalImpressions,
    clicks: totalClicks,
    cost: totalCost,
    conversions: totalConversions,
    conversionValue: totalConversionValue,
    ctr,
    avgCpc,
    dateRange: { startDate, endDate },
    syncedAt: new Date().toISOString(),
  };
}

async function saveSnapshot(
  supabase: any, 
  clientId: string, 
  platform: string, 
  data: any
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  // Upsert snapshot for today
  const { error } = await supabase
    .from('analytics_snapshots')
    .upsert({
      client_id: clientId,
      platform,
      snapshot_date: today,
      data,
      metrics: {
        synced_at: new Date().toISOString(),
      },
    }, {
      onConflict: 'client_id,platform,snapshot_date',
    });

  if (error) {
    console.error(`[Analytics Sync] Error saving ${platform} snapshot:`, error);
    throw error;
  }

  console.log(`[Analytics Sync] Saved ${platform} snapshot for client ${clientId}`);
}

serve(handler);
