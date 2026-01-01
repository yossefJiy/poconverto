import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
  action?: 'health' | 'campaigns' | 'insights' | 'check_permissions';
  adAccountId?: string;
  accessToken?: string; // For permission checking before saving
  startDate?: string;
  endDate?: string;
  clientId?: string;
}

// Known Facebook API error codes
const FB_ERROR_CODES = {
  OAUTH_ERROR: 190, // Invalid or expired token
  PERMISSIONS_ERROR: 200, // Missing permissions
  API_TOO_MANY_CALLS: 4, // Rate limit
  API_USER_TOO_MANY_CALLS: 17, // User rate limit
} as const;

// Helper function to get access token
async function getAccessToken(): Promise<string> {
  const accessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
  if (!accessToken) {
    throw new Error('FACEBOOK_ACCESS_TOKEN is not configured');
  }
  return accessToken;
}

// Parse Facebook API error for user-friendly message
function parseFacebookError(error: any): { message: string; code: number; type: string } {
  const code = error?.code || 0;
  const type = error?.type || 'UnknownError';
  let message = error?.message || 'Unknown Facebook API error';

  // Provide clearer Hebrew messages for known errors
  if (code === FB_ERROR_CODES.OAUTH_ERROR) {
    message = 'טוקן הגישה לא תקין או שפג תוקפו. יש ליצור טוקן חדש.';
  } else if (code === FB_ERROR_CODES.PERMISSIONS_ERROR) {
    message = 'חסרות הרשאות נדרשות (ads_read / ads_management). יש לוודא שהאפליקציה מורשית לגשת לנתוני פרסום.';
  } else if (code === FB_ERROR_CODES.API_TOO_MANY_CALLS || code === FB_ERROR_CODES.API_USER_TOO_MANY_CALLS) {
    message = 'חריגה ממכסת הבקשות ל-API. יש לנסות שוב מאוחר יותר.';
  }

  return { message, code, type };
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
    const parsedError = parseFacebookError(data.error);
    log.error('Facebook API error:', JSON.stringify({ ...parsedError, raw: data.error }));
    throw new Error(parsedError.message);
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
    const parsedError = parseFacebookError(data.error);
    log.error('Facebook API error (insights):', JSON.stringify({ ...parsedError, raw: data.error }));
    throw new Error(parsedError.message);
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
    const parsedError = parseFacebookError(data.error);
    log.error('Facebook API error (daily):', JSON.stringify({ ...parsedError, raw: data.error }));
    throw new Error(parsedError.message);
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

// Check token permissions and validity
async function checkTokenPermissions(accessToken: string): Promise<{
  valid: boolean;
  permissions: Record<string, 'granted' | 'declined' | 'expired'>;
  adAccounts: Array<{ id: string; name: string; currency: string }>;
  tokenInfo: { appId: string; userId: string; expiresAt: string | null; isExpired: boolean };
  error?: string;
}> {
  const requiredPermissions = ['ads_read', 'ads_management', 'business_management'];
  
  try {
    // Check token debug info
    const debugUrl = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/debug_token`;
    const debugParams = new URLSearchParams({
      input_token: accessToken,
      access_token: accessToken,
    });
    
    log.info('Checking token validity...');
    const debugResponse = await fetch(`${debugUrl}?${debugParams}`);
    const debugData = await debugResponse.json();
    
    if (debugData.error) {
      const parsedError = parseFacebookError(debugData.error);
      log.error('Token debug error:', JSON.stringify(parsedError));
      return {
        valid: false,
        permissions: {},
        adAccounts: [],
        tokenInfo: { appId: '', userId: '', expiresAt: null, isExpired: true },
        error: parsedError.message,
      };
    }
    
    const tokenData = debugData.data || {};
    const isExpired = tokenData.expires_at ? tokenData.expires_at * 1000 < Date.now() : false;
    const isValid = tokenData.is_valid && !isExpired;
    
    if (!isValid) {
      return {
        valid: false,
        permissions: {},
        adAccounts: [],
        tokenInfo: {
          appId: tokenData.app_id || '',
          userId: tokenData.user_id || '',
          expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at * 1000).toISOString() : null,
          isExpired,
        },
        error: isExpired ? 'הטוקן פג תוקף. יש ליצור טוקן חדש.' : 'הטוקן לא תקין.',
      };
    }
    
    // Fetch permissions
    log.info('Fetching token permissions...');
    const permissionsUrl = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/me/permissions`;
    const permissionsParams = new URLSearchParams({ access_token: accessToken });
    const permissionsResponse = await fetch(`${permissionsUrl}?${permissionsParams}`);
    const permissionsData = await permissionsResponse.json();
    
    const permissions: Record<string, 'granted' | 'declined' | 'expired'> = {};
    
    if (permissionsData.data) {
      for (const perm of permissionsData.data) {
        permissions[perm.permission] = perm.status as 'granted' | 'declined' | 'expired';
      }
    }
    
    // Check which required permissions are missing
    for (const required of requiredPermissions) {
      if (!permissions[required]) {
        permissions[required] = 'declined'; // Not requested = effectively declined
      }
    }
    
    // Fetch accessible ad accounts
    log.info('Fetching accessible ad accounts...');
    const adAccountsUrl = `https://graph.facebook.com/${FACEBOOK_API_VERSION}/me/adaccounts`;
    const adAccountsParams = new URLSearchParams({
      access_token: accessToken,
      fields: 'id,name,currency,account_status',
      limit: '50',
    });
    const adAccountsResponse = await fetch(`${adAccountsUrl}?${adAccountsParams}`);
    const adAccountsData = await adAccountsResponse.json();
    
    const adAccounts = (adAccountsData.data || []).map((acc: any) => ({
      id: acc.id,
      name: acc.name || acc.id,
      currency: acc.currency || 'USD',
    }));
    
    log.info(`Found ${adAccounts.length} ad accounts, permissions: ${JSON.stringify(permissions)}`);
    
    return {
      valid: true,
      permissions,
      adAccounts,
      tokenInfo: {
        appId: tokenData.app_id || '',
        userId: tokenData.user_id || '',
        expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at * 1000).toISOString() : null,
        isExpired: false,
      },
    };
  } catch (error) {
    log.error('Error checking permissions:', error);
    return {
      valid: false,
      permissions: {},
      adAccounts: [],
      tokenInfo: { appId: '', userId: '', expiresAt: null, isExpired: true },
      error: error instanceof Error ? error.message : 'שגיאה בבדיקת הרשאות',
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: FacebookAdsRequest = await req.json();
    const { action, adAccountId, startDate, endDate, clientId } = body;
    
    // Health check endpoint - no auth required
    if (action === 'health') {
      const envCheck = checkEnvVars(REQUIRED_ENV_VARS.FACEBOOK_ADS || ['FACEBOOK_ACCESS_TOKEN']);
      return healthCheckResponse('facebook-ads', SERVICE_VERSIONS.FACEBOOK_ADS || '1.0.0', [envCheck]);
    }
    
    // Check permissions action - can use provided token for validation
    if (action === 'check_permissions') {
      const tokenToCheck = body.accessToken;
      if (!tokenToCheck) {
        return new Response(JSON.stringify({ error: 'Access token is required for permission check' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      log.info('Checking permissions for provided token...');
      const result = await checkTokenPermissions(tokenToCheck);
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Validate user authentication for all other actions
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      log.error('Auth failed:', auth.error);
      return unauthorizedResponse(auth.error);
    }
    log.info('Authenticated user:', auth.user.id);
    
    if (!adAccountId) {
      return new Response(JSON.stringify({ error: 'Ad Account ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = await getAccessToken();
    
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
