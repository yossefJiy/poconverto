import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAuth, unauthorizedResponse } from "../_shared/auth.ts";
import { healthCheckResponse, checkEnvVars, createLogger } from "../_shared/utils.ts";
import { SERVICE_VERSIONS, REQUIRED_ENV_VARS } from "../_shared/constants.ts";
import { validateDateRange, validationErrorResponse } from "../_shared/validation.ts";

const log = createLogger('Google Ads');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Ads API base URL
const GOOGLE_ADS_API_VERSION = 'v22';
const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

// Global credentials (fallback)
const GLOBAL_CLIENT_ID = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
const GLOBAL_CLIENT_SECRET = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');
const GLOBAL_DEVELOPER_TOKEN = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');

interface ClientCredentials {
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  customer_id?: string;
}

// Generate access token using OAuth2 Refresh Token flow
async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  console.log('[Google Ads] Exchanging refresh token for access token...');
  
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  const tokenData = await tokenResponse.json();
  
  if (tokenData.error) {
    console.error('[Google Ads] Token exchange error:', tokenData);
    throw new Error(`OAuth token error: ${tokenData.error_description || tokenData.error}`);
  }
  
  if (!tokenData.access_token) {
    console.error('[Google Ads] No access token in response:', tokenData);
    throw new Error('Failed to obtain access token');
  }
  
  console.log('[Google Ads] Access token obtained successfully');
  return tokenData.access_token;
}

// Execute Google Ads Query Language (GAQL) query
async function executeGoogleAdsQuery(
  accessToken: string,
  developerToken: string,
  customerId: string,
  query: string
): Promise<any> {
  const url = `${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:searchStream`;
  
  console.log(`[Google Ads] Executing query for customer ${customerId}`);
  console.log(`[Google Ads] Query: ${query}`);
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Google Ads] API error: ${response.status}`, errorText);
    throw new Error(`Google Ads API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
}

// Get credentials for a specific client from database
async function getClientCredentials(
  supabaseClient: any, 
  clientId: string
): Promise<{ credentials: ClientCredentials; integrationId: string } | null> {
  console.log('[Google Ads] Fetching credentials for client:', clientId);
  
  const { data: integration, error } = await supabaseClient
    .from('integrations')
    .select('id, encrypted_credentials, settings, external_account_id')
    .eq('client_id', clientId)
    .eq('platform', 'google_ads')
    .eq('is_connected', true)
    .single();

  if (error || !integration) {
    console.log('[Google Ads] No integration found for client:', clientId);
    return null;
  }

  if (!integration.encrypted_credentials) {
    console.log('[Google Ads] No encrypted credentials for client:', clientId);
    return null;
  }

  // Decrypt credentials
  const { data: decryptedData, error: decryptError } = await supabaseClient
    .rpc('decrypt_integration_credentials', { encrypted_data: integration.encrypted_credentials });

  if (decryptError || !decryptedData) {
    console.error('[Google Ads] Decryption error:', decryptError);
    return null;
  }

  const credentials = decryptedData as ClientCredentials;
  
  // Add customer_id from settings or external_account_id
  if (integration.settings?.customer_id) {
    credentials.customer_id = integration.settings.customer_id;
  } else if (integration.external_account_id) {
    credentials.customer_id = integration.external_account_id;
  }

  return { credentials, integrationId: integration.id };
}

// Update stored access token after refresh
async function updateStoredTokens(
  supabaseClient: any,
  integrationId: string,
  credentials: ClientCredentials,
  newAccessToken: string
): Promise<void> {
  const updatedCredentials = {
    ...credentials,
    access_token: newAccessToken,
    token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
  };

  const { data: encryptedData, error: encryptError } = await supabaseClient
    .rpc('encrypt_integration_credentials', { credentials: updatedCredentials });

  if (encryptError) {
    console.warn('[Google Ads] Failed to update stored tokens:', encryptError);
    return;
  }

  await supabaseClient
    .from('integrations')
    .update({
      encrypted_credentials: encryptedData,
      last_sync_at: new Date().toISOString(),
    })
    .eq('id', integrationId);

  console.log('[Google Ads] Updated stored tokens for integration:', integrationId);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body first to check for health action
    const body = await req.json();
    const { startDate, endDate, clientId, action } = body;

    // Health check endpoint - no auth required
    if (action === 'health') {
      const envCheck = checkEnvVars(REQUIRED_ENV_VARS.GOOGLE_ADS);
      return healthCheckResponse('google-ads', SERVICE_VERSIONS.GOOGLE_ADS, [envCheck]);
    }

    // Validate user authentication
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      log.error('Auth failed:', auth.error);
      return unauthorizedResponse(auth.error);
    }
    log.info('Authenticated user:', auth.user.id);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let accessToken: string | undefined;
    let customerId: string | undefined;
    let integrationId: string | null = null;
    let clientCredentials: ClientCredentials | null = null;

    // Try to get per-client credentials first
    if (clientId) {
      const clientData = await getClientCredentials(supabaseClient, clientId);
      
      if (clientData && clientData.credentials.refresh_token) {
        console.log('[Google Ads] Using per-client OAuth credentials');
        clientCredentials = clientData.credentials;
        integrationId = clientData.integrationId;

        const refreshToken = clientCredentials.refresh_token!;

        // Check if we have a valid access token
        const tokenExpiry = clientCredentials.token_expires_at 
          ? new Date(clientCredentials.token_expires_at) 
          : new Date(0);
        
        if (clientCredentials.access_token && tokenExpiry > new Date()) {
          accessToken = clientCredentials.access_token;
          console.log('[Google Ads] Using cached access token');
        } else {
          // Refresh the access token
          accessToken = await getAccessToken(
            GLOBAL_CLIENT_ID!,
            GLOBAL_CLIENT_SECRET!,
            refreshToken
          );
          
          // Update stored tokens in background
          if (integrationId) {
            updateStoredTokens(supabaseClient, integrationId, clientCredentials, accessToken);
          }
        }

        customerId = clientCredentials.customer_id || '';
        if (!customerId) {
          throw new Error('Customer ID not configured for this client');
        }
      } else {
        // No per-client credentials found - require explicit configuration
        console.log('[Google Ads] No per-client credentials found for client:', clientId);
        throw new Error('Google Ads לא מוגדר עבור לקוח זה. יש להוסיף מספר חשבון Google Ads בהגדרות האינטגרציות.');
      }
    } else {
      // No clientId provided - this shouldn't happen from the frontend
      console.log('[Google Ads] No clientId provided in request');
      throw new Error('חסר מזהה לקוח בבקשה. יש לבחור לקוח כדי לצפות בנתוני Google Ads.');
    }

    if (!GLOBAL_DEVELOPER_TOKEN) {
      throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is not configured');
    }

    console.log('[Google Ads] All credentials loaded successfully');

    // Default date range: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const requestStartDate = startDate || thirtyDaysAgo.toISOString().split('T')[0];
    const requestEndDate = endDate || today.toISOString().split('T')[0];

    // Validate date range
    const dateValidation = validateDateRange(requestStartDate, requestEndDate);
    if (!dateValidation.valid) {
      log.error('Date validation failed:', dateValidation.error);
      return validationErrorResponse(dateValidation.error || 'Invalid date range', corsHeaders);
    }

    console.log(`[Google Ads] Date range: ${requestStartDate} to ${requestEndDate}`);

    // Clean customer ID (remove dashes if present)
    const cleanCustomerId = customerId!.replace(/-/g, '');

    // 1. Campaign Performance Query
    const campaignQuery = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign
      WHERE segments.date BETWEEN '${requestStartDate}' AND '${requestEndDate}'
      ORDER BY metrics.cost_micros DESC
    `;

    // 2. Daily Performance Query
    const dailyQuery = `
      SELECT
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr
      FROM customer
      WHERE segments.date BETWEEN '${requestStartDate}' AND '${requestEndDate}'
      ORDER BY segments.date ASC
    `;

    // 3. Ad Group Performance Query
    const adGroupQuery = `
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group.status,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM ad_group
      WHERE segments.date BETWEEN '${requestStartDate}' AND '${requestEndDate}'
      ORDER BY metrics.cost_micros DESC
      LIMIT 50
    `;

    // 4. Keywords Performance Query
    const keywordsQuery = `
      SELECT
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr
      FROM keyword_view
      WHERE segments.date BETWEEN '${requestStartDate}' AND '${requestEndDate}'
      ORDER BY metrics.impressions DESC
      LIMIT 100
    `;

    // 5. Account Summary Query
    const accountQuery = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM customer
      WHERE segments.date BETWEEN '${requestStartDate}' AND '${requestEndDate}'
    `;

    // 6. Ad Group Ads Query (individual ads)
    const adsQuery = `
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.ad.type,
        ad_group_ad.status,
        ad_group.id,
        ad_group.name,
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM ad_group_ad
      WHERE segments.date BETWEEN '${requestStartDate}' AND '${requestEndDate}'
        AND ad_group_ad.status != 'REMOVED'
      ORDER BY metrics.impressions DESC
      LIMIT 100
    `;

    // 7. Asset Query
    const assetQuery = `
      SELECT
        asset.id,
        asset.name,
        asset.type,
        asset.resource_name,
        asset.image_asset.full_size.url,
        asset.text_asset.text
      FROM asset
      WHERE asset.type IN ('IMAGE', 'TEXT', 'YOUTUBE_VIDEO')
      LIMIT 50
    `;

    // 8. Audience Query (User Lists)
    const audienceQuery = `
      SELECT
        user_list.id,
        user_list.name,
        user_list.type,
        user_list.size_for_display,
        user_list.size_for_search,
        user_list.description
      FROM user_list
      WHERE user_list.membership_status = 'OPEN'
      LIMIT 50
    `;

    // Execute all queries in parallel
    console.log('[Google Ads] Executing queries...');
    
    const [campaigns, daily, adGroups, keywords, account, ads, assets, audiences] = await Promise.all([
      executeGoogleAdsQuery(accessToken, GLOBAL_DEVELOPER_TOKEN, cleanCustomerId, campaignQuery).catch(e => ({ error: e.message })),
      executeGoogleAdsQuery(accessToken, GLOBAL_DEVELOPER_TOKEN, cleanCustomerId, dailyQuery).catch(e => ({ error: e.message })),
      executeGoogleAdsQuery(accessToken, GLOBAL_DEVELOPER_TOKEN, cleanCustomerId, adGroupQuery).catch(e => ({ error: e.message })),
      executeGoogleAdsQuery(accessToken, GLOBAL_DEVELOPER_TOKEN, cleanCustomerId, keywordsQuery).catch(e => ({ error: e.message })),
      executeGoogleAdsQuery(accessToken, GLOBAL_DEVELOPER_TOKEN, cleanCustomerId, accountQuery).catch(e => ({ error: e.message })),
      executeGoogleAdsQuery(accessToken, GLOBAL_DEVELOPER_TOKEN, cleanCustomerId, adsQuery).catch(e => ({ error: e.message })),
      executeGoogleAdsQuery(accessToken, GLOBAL_DEVELOPER_TOKEN, cleanCustomerId, assetQuery).catch(e => ({ error: e.message })),
      executeGoogleAdsQuery(accessToken, GLOBAL_DEVELOPER_TOKEN, cleanCustomerId, audienceQuery).catch(e => ({ error: e.message }))
    ]);

    // Process and format the response
    const response = {
      campaigns: formatCampaignData(campaigns),
      daily: formatDailyData(daily),
      adGroups: formatAdGroupData(adGroups),
      keywords: formatKeywordsData(keywords),
      account: formatAccountData(account),
      ads: formatAdsData(ads),
      assets: formatAssetsData(assets),
      audiences: formatAudiencesData(audiences),
      dateRange: {
        startDate: requestStartDate,
        endDate: requestEndDate
      }
    };

    console.log('[Google Ads] Data fetched successfully:', {
      campaignsCount: response.campaigns?.length || 0,
      dailyCount: response.daily?.length || 0,
      adGroupsCount: response.adGroups?.length || 0,
      keywordsCount: response.keywords?.length || 0,
      adsCount: response.ads?.length || 0,
      assetsCount: response.assets?.length || 0,
      audiencesCount: response.audiences?.length || 0
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Google Ads] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions to format data
function formatCampaignData(data: any): any[] {
  if (data.error) {
    console.error('[Google Ads] Campaign data error:', data.error);
    return [];
  }
  
  try {
    const results: any[] = [];
    if (Array.isArray(data)) {
      for (const chunk of data) {
        if (chunk.results) {
          for (const result of chunk.results) {
            results.push({
              id: result.campaign?.id,
              name: result.campaign?.name,
              status: result.campaign?.status,
              channelType: result.campaign?.advertisingChannelType,
              budget: (result.campaignBudget?.amountMicros || 0) / 1000000,
              impressions: parseInt(result.metrics?.impressions || '0'),
              clicks: parseInt(result.metrics?.clicks || '0'),
              cost: (result.metrics?.costMicros || 0) / 1000000,
              conversions: parseFloat(result.metrics?.conversions || '0'),
              conversionValue: parseFloat(result.metrics?.conversionsValue || '0'),
              ctr: parseFloat(result.metrics?.ctr || '0') * 100,
              avgCpc: (result.metrics?.averageCpc || 0) / 1000000
            });
          }
        }
      }
    }
    return results;
  } catch (e) {
    console.error('[Google Ads] Error formatting campaign data:', e);
    return [];
  }
}

function formatDailyData(data: any): any[] {
  if (data.error) {
    console.error('[Google Ads] Daily data error:', data.error);
    return [];
  }
  
  try {
    const results: any[] = [];
    if (Array.isArray(data)) {
      for (const chunk of data) {
        if (chunk.results) {
          for (const result of chunk.results) {
            results.push({
              date: result.segments?.date,
              impressions: parseInt(result.metrics?.impressions || '0'),
              clicks: parseInt(result.metrics?.clicks || '0'),
              cost: (result.metrics?.costMicros || 0) / 1000000,
              conversions: parseFloat(result.metrics?.conversions || '0'),
              ctr: parseFloat(result.metrics?.ctr || '0') * 100
            });
          }
        }
      }
    }
    return results;
  } catch (e) {
    console.error('[Google Ads] Error formatting daily data:', e);
    return [];
  }
}

function formatAdGroupData(data: any): any[] {
  if (data.error) {
    console.error('[Google Ads] Ad group data error:', data.error);
    return [];
  }
  
  try {
    const results: any[] = [];
    if (Array.isArray(data)) {
      for (const chunk of data) {
        if (chunk.results) {
          for (const result of chunk.results) {
            results.push({
              id: result.adGroup?.id,
              name: result.adGroup?.name,
              status: result.adGroup?.status,
              campaignName: result.campaign?.name,
              impressions: parseInt(result.metrics?.impressions || '0'),
              clicks: parseInt(result.metrics?.clicks || '0'),
              cost: (result.metrics?.costMicros || 0) / 1000000,
              conversions: parseFloat(result.metrics?.conversions || '0')
            });
          }
        }
      }
    }
    return results;
  } catch (e) {
    console.error('[Google Ads] Error formatting ad group data:', e);
    return [];
  }
}

function formatKeywordsData(data: any): any[] {
  if (data.error) {
    console.error('[Google Ads] Keywords data error:', data.error);
    return [];
  }
  
  try {
    const results: any[] = [];
    if (Array.isArray(data)) {
      for (const chunk of data) {
        if (chunk.results) {
          for (const result of chunk.results) {
            results.push({
              keyword: result.adGroupCriterion?.keyword?.text,
              matchType: result.adGroupCriterion?.keyword?.matchType,
              impressions: parseInt(result.metrics?.impressions || '0'),
              clicks: parseInt(result.metrics?.clicks || '0'),
              cost: (result.metrics?.costMicros || 0) / 1000000,
              conversions: parseFloat(result.metrics?.conversions || '0'),
              ctr: parseFloat(result.metrics?.ctr || '0') * 100
            });
          }
        }
      }
    }
    return results;
  } catch (e) {
    console.error('[Google Ads] Error formatting keywords data:', e);
    return [];
  }
}

function formatAccountData(data: any): any {
  if (data.error) {
    console.error('[Google Ads] Account data error:', data.error);
    return null;
  }
  
  try {
    if (Array.isArray(data) && data.length > 0 && data[0].results?.length > 0) {
      const result = data[0].results[0];
      return {
        id: result.customer?.id,
        name: result.customer?.descriptiveName,
        currency: result.customer?.currencyCode,
        totalImpressions: parseInt(result.metrics?.impressions || '0'),
        totalClicks: parseInt(result.metrics?.clicks || '0'),
        totalCost: (result.metrics?.costMicros || 0) / 1000000,
        totalConversions: parseFloat(result.metrics?.conversions || '0'),
        totalConversionValue: parseFloat(result.metrics?.conversionsValue || '0')
      };
    }
    return null;
  } catch (e) {
    console.error('[Google Ads] Error formatting account data:', e);
    return null;
  }
}

function formatAdsData(data: any): any[] {
  if (data.error) {
    console.error('[Google Ads] Ads data error:', data.error);
    return [];
  }
  
  try {
    const results: any[] = [];
    if (Array.isArray(data)) {
      for (const chunk of data) {
        if (chunk.results) {
          for (const result of chunk.results) {
            results.push({
              id: result.adGroupAd?.ad?.id,
              name: result.adGroupAd?.ad?.name || `Ad ${result.adGroupAd?.ad?.id}`,
              type: result.adGroupAd?.ad?.type,
              status: result.adGroupAd?.status,
              adGroupId: result.adGroup?.id,
              adGroupName: result.adGroup?.name,
              campaignId: result.campaign?.id,
              campaignName: result.campaign?.name,
              impressions: parseInt(result.metrics?.impressions || '0'),
              clicks: parseInt(result.metrics?.clicks || '0'),
              cost: (result.metrics?.costMicros || 0) / 1000000,
              conversions: parseFloat(result.metrics?.conversions || '0')
            });
          }
        }
      }
    }
    return results;
  } catch (e) {
    console.error('[Google Ads] Error formatting ads data:', e);
    return [];
  }
}

function formatAssetsData(data: any): any[] {
  if (data.error) {
    console.error('[Google Ads] Assets data error:', data.error);
    return [];
  }
  
  try {
    const results: any[] = [];
    if (Array.isArray(data)) {
      for (const chunk of data) {
        if (chunk.results) {
          for (const result of chunk.results) {
            results.push({
              id: result.asset?.id,
              name: result.asset?.name || result.asset?.textAsset?.text || `Asset ${result.asset?.id}`,
              type: result.asset?.type,
              resourceName: result.asset?.resourceName,
              imageUrl: result.asset?.imageAsset?.fullSize?.url,
              text: result.asset?.textAsset?.text,
            });
          }
        }
      }
    }
    return results;
  } catch (e) {
    console.error('[Google Ads] Error formatting assets data:', e);
    return [];
  }
}

function formatAudiencesData(data: any): any[] {
  if (data.error) {
    console.error('[Google Ads] Audiences data error:', data.error);
    return [];
  }
  
  try {
    const results: any[] = [];
    if (Array.isArray(data)) {
      for (const chunk of data) {
        if (chunk.results) {
          for (const result of chunk.results) {
            results.push({
              id: result.userList?.id,
              name: result.userList?.name,
              type: result.userList?.type,
              sizeForDisplay: result.userList?.sizeForDisplay,
              sizeForSearch: result.userList?.sizeForSearch,
              description: result.userList?.description,
            });
          }
        }
      }
    }
    return results;
  } catch (e) {
    console.error('[Google Ads] Error formatting audiences data:', e);
    return [];
  }
}
