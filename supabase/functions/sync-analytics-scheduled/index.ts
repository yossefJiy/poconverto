import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncResult {
  clientId: string;
  clientName: string;
  platform: string;
  success: boolean;
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("[Sync Scheduled] Starting scheduled analytics sync...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all clients with active integrations
    const { data: integrations, error: integrationsError } = await supabase
      .from("integrations")
      .select(`
        id,
        client_id,
        platform,
        settings,
        clients!inner(id, name)
      `)
      .eq("is_connected", true)
      .in("platform", ["shopify", "google_analytics", "woocommerce", "google_ads"]);

    if (integrationsError) {
      throw new Error(`Failed to fetch integrations: ${integrationsError.message}`);
    }

    console.log(`[Sync Scheduled] Found ${integrations?.length || 0} active integrations`);

    const results: SyncResult[] = [];

    // Calculate date range (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Process each integration
    for (const integration of integrations || []) {
      const clientName = (integration.clients as any)?.name || "Unknown";
      console.log(`[Sync Scheduled] Processing ${integration.platform} for client: ${clientName}`);

      try {
        let data = null;

        switch (integration.platform) {
          case "shopify":
            data = await fetchShopifyData(supabaseUrl, supabaseServiceKey, integration.client_id, startDate, endDate);
            break;
          case "google_analytics":
            const propertyId = (integration.settings as any)?.property_id;
            if (propertyId) {
              data = await fetchGoogleAnalyticsData(supabaseUrl, supabaseServiceKey, propertyId, startDate, endDate);
            }
            break;
          case "woocommerce":
            data = await fetchWooCommerceData(supabaseUrl, supabaseServiceKey, integration.client_id, startDate, endDate);
            break;
          case "google_ads":
            data = await fetchGoogleAdsData(supabaseUrl, supabaseServiceKey, integration.client_id, startDate, endDate);
            break;
        }

        if (data) {
          // Save snapshot
          const snapshotDate = new Date().toISOString().split('T')[0];
          const { error: upsertError } = await supabase
            .from("analytics_snapshots")
            .upsert({
              client_id: integration.client_id,
              integration_id: integration.id,
              platform: integration.platform,
              snapshot_date: snapshotDate,
              data: data,
              metrics: extractMetrics(integration.platform, data),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "client_id,platform,snapshot_date",
            });

          if (upsertError) {
            throw new Error(`Failed to save snapshot: ${upsertError.message}`);
          }

          // Update last_sync_at on integration
          await supabase
            .from("integrations")
            .update({ last_sync_at: new Date().toISOString() })
            .eq("id", integration.id);

          results.push({
            clientId: integration.client_id,
            clientName,
            platform: integration.platform,
            success: true,
          });

          console.log(`[Sync Scheduled] ✓ Synced ${integration.platform} for ${clientName}`);
        }
      } catch (error: any) {
        console.error(`[Sync Scheduled] ✗ Failed ${integration.platform} for ${clientName}:`, error.message);
        results.push({
          clientId: integration.client_id,
          clientName,
          platform: integration.platform,
          success: false,
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`[Sync Scheduled] Completed in ${duration}ms - Success: ${successful}, Failed: ${failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        duration,
        summary: {
          total: results.length,
          successful,
          failed,
        },
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[Sync Scheduled] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

// Fetch data from Shopify API
async function fetchShopifyData(
  supabaseUrl: string,
  supabaseKey: string,
  clientId: string,
  startDate: string,
  endDate: string
): Promise<any> {
  const response = await fetch(`${supabaseUrl}/functions/v1/shopify-api`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      action: "getOrders",
      clientId,
      params: {
        created_at_min: startDate,
        created_at_max: endDate,
        status: "any",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status}`);
  }

  return response.json();
}

// Fetch data from Google Analytics
async function fetchGoogleAnalyticsData(
  supabaseUrl: string,
  supabaseKey: string,
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<any> {
  const response = await fetch(`${supabaseUrl}/functions/v1/google-analytics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      propertyId,
      startDate,
      endDate,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Analytics API error: ${response.status}`);
  }

  return response.json();
}

// Fetch data from WooCommerce
async function fetchWooCommerceData(
  supabaseUrl: string,
  supabaseKey: string,
  clientId: string,
  startDate: string,
  endDate: string
): Promise<any> {
  const response = await fetch(`${supabaseUrl}/functions/v1/woocommerce-api`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      action: "getOrders",
      clientId,
      params: {
        after: startDate,
        before: endDate,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`WooCommerce API error: ${response.status}`);
  }

  return response.json();
}

// Fetch data from Google Ads
async function fetchGoogleAdsData(
  supabaseUrl: string,
  supabaseKey: string,
  clientId: string,
  startDate: string,
  endDate: string
): Promise<any> {
  const response = await fetch(`${supabaseUrl}/functions/v1/google-ads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      action: "getCampaigns",
      clientId,
      startDate,
      endDate,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Ads API error: ${response.status}`);
  }

  return response.json();
}

// Extract key metrics from raw data
function extractMetrics(platform: string, data: any): Record<string, any> {
  switch (platform) {
    case "shopify":
      const orders = data?.orders || [];
      return {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || 0), 0),
        averageOrderValue: orders.length > 0 
          ? orders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || 0), 0) / orders.length 
          : 0,
      };

    case "google_analytics":
      return {
        sessions: data?.dailyMetrics?.rows?.reduce((sum: number, r: any) => 
          sum + parseInt(r.metricValues?.[1]?.value || 0), 0) || 0,
        users: data?.dailyMetrics?.rows?.reduce((sum: number, r: any) => 
          sum + parseInt(r.metricValues?.[0]?.value || 0), 0) || 0,
        pageviews: data?.dailyMetrics?.rows?.reduce((sum: number, r: any) => 
          sum + parseInt(r.metricValues?.[2]?.value || 0), 0) || 0,
      };

    case "woocommerce":
      const wooOrders = data?.orders || [];
      return {
        totalOrders: wooOrders.length,
        totalRevenue: wooOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0),
        averageOrderValue: wooOrders.length > 0 
          ? wooOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0) / wooOrders.length 
          : 0,
      };

    case "google_ads":
      const campaigns = data?.campaigns || [];
      return {
        totalSpend: campaigns.reduce((sum: number, c: any) => sum + (c.cost || 0), 0),
        totalClicks: campaigns.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0),
        totalImpressions: campaigns.reduce((sum: number, c: any) => sum + (c.impressions || 0), 0),
        totalConversions: campaigns.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0),
      };

    default:
      return {};
  }
}
