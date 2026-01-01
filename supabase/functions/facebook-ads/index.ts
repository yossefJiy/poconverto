import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAuth, unauthorizedResponse } from "../_shared/auth.ts";
import { healthCheckResponse, checkEnvVars, createLogger } from "../_shared/utils.ts";
import { SERVICE_VERSIONS, REQUIRED_ENV_VARS } from "../_shared/constants.ts";

const log = createLogger('Facebook Ads');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FACEBOOK_API_VERSION = 'v18.0';

interface FacebookAdsRequest {
  action?: 'health' | 'campaigns' | 'insights';
  adAccountId?: string;
  startDate?: string;
  endDate?: string;
  clientId: string;
}

// Helper function to get access token from client's encrypted credentials
async function getClientAccessToken(clientId: string): Promise<{ accessToken: string; adAccountId: string }> {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Get the Facebook Ads integration for this client
  const { data: integration, error: fetchError } = await supabaseClient
    .from('integrations')
    .select('id, encrypted_credentials, settings, external_account_id')
    .eq('client_id', clientId)
    .eq('platform', 'facebook_ads')
    .eq('is_connected', true)
    .single();
  
  if (fetchError || !integration) {
    log.error('No Facebook Ads integration found for client:', clientId);
    throw new Error('לא נמצא חיבור Facebook Ads עבור לקוח זה');
  }
  
  if (!integration.encrypted_credentials) {
    log.error('No encrypted credentials found for integration:', integration.id);
    throw new Error('לא נמצאו פרטי התחברות לחשבון Facebook Ads');
  }
  
  // Decrypt the credentials
  const { data: decryptedData, error: decryptError } = await supabaseClient
    .rpc('decrypt_integration_credentials', { encrypted_data: integration.encrypted_credentials });
  
  if (decryptError || !decryptedData) {
    log.error('Failed to decrypt credentials:', decryptError);
    throw new Error('שגיאה בפענוח פרטי ההתחברות');
  }
  
  const credentials = decryptedData as { access_token?: string };
  
  if (!credentials.access_token) {
    throw new Error('Access Token לא נמצא בפרטי ההתחברות');
  }
  
  // Get ad account ID from settings or external_account_id
  const settings = integration.settings as { ad_account_id?: string } | null;
  const adAccountId = settings?.ad_account_id || integration.external_account_id || '';
  
  if (!adAccountId) {
    throw new Error('מספר חשבון מודעות לא נמצא');
  }
  
  return { 
    accessToken: credentials.access_token,
    adAccountId: adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`
  };
}

// Fetch campaigns from Facebook Ads API
async function fetchCampaigns(accessToken: string, adAccountId: string): Promise<any> {
  const cleanAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  
  const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${cleanAccountId}/campaigns`;
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: 'id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time',
    limit: '100',
  });

  log.info(`Fetching campaigns for account: ${cleanAccountId}`);

  const response = await fetch(`${url}?${params}`);
  const data = await response.json();

  if (data.error) {
    log.error('Facebook API error:', data.error);
    throw new Error(data.error.message || 'Facebook API error');
  }

  return data.data || [];
}

// Fetch insights (metrics) for campaigns
async function fetchInsights(
  accessToken: string, 
  adAccountId: string, 
  startDate: string, 
  endDate: string
): Promise<any> {
  const cleanAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  
  const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${cleanAccountId}/insights`;
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: 'campaign_name,campaign_id,impressions,clicks,spend,reach,actions,action_values,ctr,cpc,cpp,cpm',
    time_range: JSON.stringify({ since: startDate, until: endDate }),
    level: 'campaign',
    limit: '100',
  });

  log.info(`Fetching insights for account: ${cleanAccountId}, range: ${startDate} to ${endDate}`);

  const response = await fetch(`${url}?${params}`);
  const data = await response.json();

  if (data.error) {
    log.error('Facebook API error:', data.error);
    throw new Error(data.error.message || 'Facebook API error');
  }

  return data.data || [];
}

// Fetch daily breakdown of performance
async function fetchDailyInsights(
  accessToken: string,
  adAccountId: string,
  startDate: string,
  endDate: string
): Promise<any> {
  const cleanAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  
  const url = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/${cleanAccountId}/insights`;
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: 'impressions,clicks,spend,reach,actions,ctr,cpc',
    time_range: JSON.stringify({ since: startDate, until: endDate }),
    time_increment: '1', // Daily breakdown
    level: 'account',
    limit: '100',
  });

  log.info(`Fetching daily insights for account: ${cleanAccountId}`);

  const response = await fetch(`${url}?${params}`);
  const data = await response.json();

  if (data.error) {
    log.error('Facebook API error:', data.error);
    throw new Error(data.error.message || 'Facebook API error');
  }

  return data.data || [];
}

// Parse conversions from actions array
function parseConversions(actions: any[]): { conversions: number; conversionValue: number } {
  if (!actions || !Array.isArray(actions)) {
    return { conversions: 0, conversionValue: 0 };
  }

  let conversions = 0;
  let conversionValue = 0;

  for (const action of actions) {
    // Count purchase actions as conversions
    if (action.action_type === 'purchase' || action.action_type === 'omni_purchase') {
      conversions += parseInt(action.value || '0');
    }
  }

  return { conversions, conversionValue };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: FacebookAdsRequest = await req.json();
    const { action, adAccountId: requestAdAccountId, startDate, endDate, clientId } = body;
    
    // Health check endpoint - no auth required
    if (action === 'health') {
      const envCheck = { name: 'Client Credentials', status: 'pass' as const, message: 'Uses per-client tokens' };
      return healthCheckResponse('facebook-ads', SERVICE_VERSIONS.FACEBOOK_ADS || '1.0.0', [envCheck]);
    }
    
    // Validate user authentication for all other actions
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      log.error('Auth failed:', auth.error);
      return unauthorizedResponse(auth.error);
    }
    log.info('Authenticated user:', auth.user.id);
    
    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Client ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get access token and ad account ID from client's integration
    const { accessToken, adAccountId } = await getClientAccessToken(clientId);
    log.info(`Using client-specific credentials for account: ${adAccountId}`);
    
    // Default date range: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const requestStartDate = startDate || thirtyDaysAgo.toISOString().split('T')[0];
    const requestEndDate = endDate || today.toISOString().split('T')[0];

    // Fetch data based on action
    if (action === 'campaigns') {
      const campaigns = await fetchCampaigns(accessToken, adAccountId);
      return new Response(JSON.stringify({ campaigns }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default: fetch all data
    log.info(`Fetching all Facebook Ads data for ${adAccountId}`);

    const [campaigns, insights, dailyInsights] = await Promise.all([
      fetchCampaigns(accessToken, adAccountId),
      fetchInsights(accessToken, adAccountId, requestStartDate, requestEndDate),
      fetchDailyInsights(accessToken, adAccountId, requestStartDate, requestEndDate),
    ]);

    // Process campaign data with insights
    const processedCampaigns = campaigns.map((campaign: any) => {
      const campaignInsight = insights.find((i: any) => i.campaign_id === campaign.id) || {};
      const { conversions, conversionValue } = parseConversions(campaignInsight.actions);
      
      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        budget: parseFloat(campaign.daily_budget || campaign.lifetime_budget || '0') / 100, // Facebook uses cents
        impressions: parseInt(campaignInsight.impressions || '0'),
        clicks: parseInt(campaignInsight.clicks || '0'),
        cost: parseFloat(campaignInsight.spend || '0'),
        reach: parseInt(campaignInsight.reach || '0'),
        conversions,
        conversionValue,
        ctr: parseFloat(campaignInsight.ctr || '0'),
        cpc: parseFloat(campaignInsight.cpc || '0'),
      };
    });

    // Process daily data
    const processedDaily = dailyInsights.map((day: any) => {
      const { conversions } = parseConversions(day.actions);
      return {
        date: day.date_start,
        impressions: parseInt(day.impressions || '0'),
        clicks: parseInt(day.clicks || '0'),
        cost: parseFloat(day.spend || '0'),
        reach: parseInt(day.reach || '0'),
        conversions,
        ctr: parseFloat(day.ctr || '0'),
      };
    });

    // Calculate totals
    const totals = {
      impressions: processedCampaigns.reduce((sum: number, c: any) => sum + c.impressions, 0),
      clicks: processedCampaigns.reduce((sum: number, c: any) => sum + c.clicks, 0),
      cost: processedCampaigns.reduce((sum: number, c: any) => sum + c.cost, 0),
      reach: processedCampaigns.reduce((sum: number, c: any) => sum + c.reach, 0),
      conversions: processedCampaigns.reduce((sum: number, c: any) => sum + c.conversions, 0),
      conversionValue: processedCampaigns.reduce((sum: number, c: any) => sum + c.conversionValue, 0),
    };

    const response = {
      campaigns: processedCampaigns,
      daily: processedDaily,
      totals,
      dateRange: {
        startDate: requestStartDate,
        endDate: requestEndDate,
      },
    };

    log.info(`Facebook Ads data fetched successfully: ${processedCampaigns.length} campaigns`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.error('Error in facebook-ads function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
