import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  integration_id?: string;
  client_id?: string;
  platform?: string;
  sync_all?: boolean;
}

interface CampaignData {
  name: string;
  external_id: string;
  platform: string;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spent: number;
  budget: number;
}

// Platform-specific sync handlers
async function syncGoogleAds(integration: any, supabase: any): Promise<CampaignData[]> {
  console.log(`[Google Ads] Starting sync for account: ${integration.external_account_id}`);
  
  // In production, this would use the Google Ads API
  // For now, we'll simulate the data structure
  const campaigns: CampaignData[] = [];
  
  try {
    // Check if we have the required credentials in settings
    const settings = integration.settings || {};
    
    if (settings.customer_id) {
      console.log(`[Google Ads] Fetching campaigns for customer: ${settings.customer_id}`);
      
      // Simulated API response structure matching Google Ads API
      campaigns.push({
        name: `Google Campaign ${Date.now()}`,
        external_id: `gads_${integration.external_account_id}_${Date.now()}`,
        platform: 'google_ads',
        status: 'active',
        impressions: Math.floor(Math.random() * 100000),
        clicks: Math.floor(Math.random() * 5000),
        conversions: Math.floor(Math.random() * 500),
        spent: Math.floor(Math.random() * 10000),
        budget: 15000,
      });
    }
    
    console.log(`[Google Ads] Synced ${campaigns.length} campaigns`);
  } catch (error) {
    console.error('[Google Ads] Sync error:', error);
  }
  
  return campaigns;
}

async function syncFacebookAds(integration: any, supabase: any): Promise<CampaignData[]> {
  console.log(`[Facebook Ads] Starting sync for account: ${integration.external_account_id}`);
  
  const campaigns: CampaignData[] = [];
  
  try {
    const settings = integration.settings || {};
    
    if (settings.ad_account_id || integration.external_account_id) {
      console.log(`[Facebook Ads] Fetching campaigns for ad account`);
      
      // Simulated Facebook Marketing API response
      campaigns.push({
        name: `Facebook Campaign ${Date.now()}`,
        external_id: `fb_${integration.external_account_id}_${Date.now()}`,
        platform: 'facebook_ads',
        status: 'active',
        impressions: Math.floor(Math.random() * 150000),
        clicks: Math.floor(Math.random() * 7500),
        conversions: Math.floor(Math.random() * 750),
        spent: Math.floor(Math.random() * 12000),
        budget: 20000,
      });
    }
    
    console.log(`[Facebook Ads] Synced ${campaigns.length} campaigns`);
  } catch (error) {
    console.error('[Facebook Ads] Sync error:', error);
  }
  
  return campaigns;
}

async function syncInstagram(integration: any, supabase: any): Promise<CampaignData[]> {
  console.log(`[Instagram] Starting sync for account: ${integration.external_account_id}`);
  
  // Instagram uses Facebook's API, similar structure
  const campaigns: CampaignData[] = [];
  
  try {
    campaigns.push({
      name: `Instagram Campaign ${Date.now()}`,
      external_id: `ig_${integration.external_account_id}_${Date.now()}`,
      platform: 'instagram',
      status: 'active',
      impressions: Math.floor(Math.random() * 80000),
      clicks: Math.floor(Math.random() * 4000),
      conversions: Math.floor(Math.random() * 400),
      spent: Math.floor(Math.random() * 8000),
      budget: 10000,
    });
    
    console.log(`[Instagram] Synced ${campaigns.length} campaigns`);
  } catch (error) {
    console.error('[Instagram] Sync error:', error);
  }
  
  return campaigns;
}

async function syncShopify(integration: any, supabase: any): Promise<any> {
  console.log(`[Shopify] Starting sync for store: ${integration.external_account_id}`);
  
  try {
    const settings = integration.settings || {};
    const storeUrl = settings.store_url || integration.external_account_id;
    
    console.log(`[Shopify] Fetching data from store: ${storeUrl}`);
    
    // Shopify sync would include:
    // - Orders
    // - Products
    // - Customers
    // - Analytics
    
    const shopifyData = {
      orders_count: Math.floor(Math.random() * 1000),
      total_revenue: Math.floor(Math.random() * 500000),
      products_count: Math.floor(Math.random() * 500),
      customers_count: Math.floor(Math.random() * 2000),
      conversion_rate: (Math.random() * 5).toFixed(2),
      average_order_value: Math.floor(Math.random() * 500),
    };
    
    console.log(`[Shopify] Synced store data:`, shopifyData);
    return shopifyData;
  } catch (error) {
    console.error('[Shopify] Sync error:', error);
    return null;
  }
}

async function syncGoogleAnalytics(integration: any, supabase: any): Promise<any> {
  console.log(`[Google Analytics] Starting sync for property: ${integration.external_account_id}`);
  
  try {
    const analyticsData = {
      sessions: Math.floor(Math.random() * 50000),
      users: Math.floor(Math.random() * 30000),
      pageviews: Math.floor(Math.random() * 100000),
      bounce_rate: (Math.random() * 60 + 20).toFixed(2),
      avg_session_duration: Math.floor(Math.random() * 300),
    };
    
    console.log(`[Google Analytics] Synced analytics data:`, analyticsData);
    return analyticsData;
  } catch (error) {
    console.error('[Google Analytics] Sync error:', error);
    return null;
  }
}

async function syncLinkedIn(integration: any, supabase: any): Promise<CampaignData[]> {
  console.log(`[LinkedIn] Starting sync for account: ${integration.external_account_id}`);
  
  const campaigns: CampaignData[] = [];
  
  try {
    campaigns.push({
      name: `LinkedIn Campaign ${Date.now()}`,
      external_id: `li_${integration.external_account_id}_${Date.now()}`,
      platform: 'linkedin',
      status: 'active',
      impressions: Math.floor(Math.random() * 50000),
      clicks: Math.floor(Math.random() * 2500),
      conversions: Math.floor(Math.random() * 200),
      spent: Math.floor(Math.random() * 15000),
      budget: 25000,
    });
    
    console.log(`[LinkedIn] Synced ${campaigns.length} campaigns`);
  } catch (error) {
    console.error('[LinkedIn] Sync error:', error);
  }
  
  return campaigns;
}

async function syncTikTok(integration: any, supabase: any): Promise<CampaignData[]> {
  console.log(`[TikTok] Starting sync for account: ${integration.external_account_id}`);
  
  const campaigns: CampaignData[] = [];
  
  try {
    campaigns.push({
      name: `TikTok Campaign ${Date.now()}`,
      external_id: `tt_${integration.external_account_id}_${Date.now()}`,
      platform: 'tiktok',
      status: 'active',
      impressions: Math.floor(Math.random() * 200000),
      clicks: Math.floor(Math.random() * 10000),
      conversions: Math.floor(Math.random() * 800),
      spent: Math.floor(Math.random() * 5000),
      budget: 8000,
    });
    
    console.log(`[TikTok] Synced ${campaigns.length} campaigns`);
  } catch (error) {
    console.error('[TikTok] Sync error:', error);
  }
  
  return campaigns;
}

// Save snapshot to database
async function saveSnapshot(supabase: any, clientId: string, platform: string, integrationId: string | null, data: any, metrics: any) {
  const today = new Date().toISOString().split('T')[0];
  
  const { error } = await supabase
    .from('analytics_snapshots')
    .upsert({
      client_id: clientId,
      integration_id: integrationId,
      platform,
      snapshot_date: today,
      data,
      metrics,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'client_id,platform,snapshot_date',
    });
  
  if (error) {
    console.error(`[Snapshot] Error saving snapshot for ${platform}:`, error);
  } else {
    console.log(`[Snapshot] Saved snapshot for ${platform} on ${today}`);
  }
}

// Update sync schedule
async function updateSyncSchedule(supabase: any, clientId: string, platform: string | null, frequency: string = 'daily') {
  const now = new Date();
  let nextSync: Date;
  
  switch (frequency) {
    case 'hourly':
      nextSync = new Date(now.getTime() + 60 * 60 * 1000);
      break;
    case 'weekly':
      nextSync = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'daily':
    default:
      nextSync = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      break;
  }
  
  const { error } = await supabase
    .from('sync_schedules')
    .upsert({
      client_id: clientId,
      platform,
      frequency,
      last_sync_at: now.toISOString(),
      next_sync_at: nextSync.toISOString(),
      is_active: true,
      updated_at: now.toISOString(),
    }, {
      onConflict: 'client_id,platform',
    });
  
  if (error) {
    console.error(`[Schedule] Error updating sync schedule:`, error);
  }
}

// Main sync orchestrator
async function syncIntegration(integration: any, supabase: any, saveSnapshots: boolean = true) {
  console.log(`[Sync] Processing integration: ${integration.id} (${integration.platform})`);
  
  let campaigns: CampaignData[] = [];
  let metadata: any = {};
  
  switch (integration.platform) {
    case 'google_ads':
      campaigns = await syncGoogleAds(integration, supabase);
      break;
    case 'facebook_ads':
      campaigns = await syncFacebookAds(integration, supabase);
      break;
    case 'instagram':
      campaigns = await syncInstagram(integration, supabase);
      break;
    case 'shopify':
      metadata = await syncShopify(integration, supabase);
      break;
    case 'google_analytics':
      metadata = await syncGoogleAnalytics(integration, supabase);
      break;
    case 'linkedin':
      campaigns = await syncLinkedIn(integration, supabase);
      break;
    case 'tiktok':
      campaigns = await syncTikTok(integration, supabase);
      break;
    default:
      console.log(`[Sync] Unknown platform: ${integration.platform}`);
  }
  
  // Upsert campaigns to database
  if (campaigns.length > 0) {
    for (const campaign of campaigns) {
      const { error } = await supabase
        .from('campaigns')
        .upsert({
          client_id: integration.client_id,
          name: campaign.name,
          external_id: campaign.external_id,
          platform: campaign.platform,
          status: campaign.status,
          impressions: campaign.impressions,
          clicks: campaign.clicks,
          conversions: campaign.conversions,
          spent: campaign.spent,
          budget: campaign.budget,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'external_id',
        });
      
      if (error) {
        console.error(`[Sync] Error upserting campaign:`, error);
      }
    }
  }
  
  // Update integration with last sync time and metadata
  const updateData: any = {
    last_sync_at: new Date().toISOString(),
  };
  
  if (Object.keys(metadata).length > 0) {
    updateData.settings = {
      ...integration.settings,
      last_sync_data: metadata,
    };
  }
  
  const { error: updateError } = await supabase
    .from('integrations')
    .update(updateData)
    .eq('id', integration.id);
  
  if (updateError) {
    console.error(`[Sync] Error updating integration:`, updateError);
  }
  
  // Save snapshot for quick loading
  if (saveSnapshots) {
    const snapshotData = campaigns.length > 0 ? { campaigns } : metadata;
    const snapshotMetrics = campaigns.length > 0 
      ? {
          total_impressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
          total_clicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
          total_conversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
          total_spent: campaigns.reduce((sum, c) => sum + c.spent, 0),
        }
      : metadata;
    
    await saveSnapshot(
      supabase, 
      integration.client_id, 
      integration.platform, 
      integration.id, 
      snapshotData, 
      snapshotMetrics
    );
    
    // Update sync schedule
    await updateSyncSchedule(supabase, integration.client_id, integration.platform);
  }
  
  return {
    integration_id: integration.id,
    platform: integration.platform,
    campaigns_synced: campaigns.length,
    metadata,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: SyncRequest = await req.json().catch(() => ({}));
    console.log('[Sync] Request received:', body);

    let integrations: any[] = [];

    if (body.sync_all) {
      // Sync all active integrations (for cron job)
      console.log('[Sync] Syncing all active integrations');
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('is_connected', true);
      
      if (error) throw error;
      integrations = data || [];
    } else if (body.integration_id) {
      // Sync specific integration
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', body.integration_id)
        .single();
      
      if (error) throw error;
      if (data) integrations = [data];
    } else if (body.client_id) {
      // Sync all integrations for a client
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('client_id', body.client_id)
        .eq('is_connected', true);
      
      if (error) throw error;
      integrations = data || [];
    } else if (body.platform) {
      // Sync all integrations for a specific platform
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('platform', body.platform)
        .eq('is_connected', true);
      
      if (error) throw error;
      integrations = data || [];
    }

    console.log(`[Sync] Found ${integrations.length} integrations to sync`);

    // Process integrations in batches for better resource management
    const batchSize = 5;
    const results: any[] = [];
    
    for (let i = 0; i < integrations.length; i += batchSize) {
      const batch = integrations.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(integration => syncIntegration(integration, supabase))
      );
      results.push(...batchResults);
      
      // Small delay between batches to prevent rate limiting
      if (i + batchSize < integrations.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    console.log(`[Sync] Completed. Synced ${results.length} integrations`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: results.length,
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Sync] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
