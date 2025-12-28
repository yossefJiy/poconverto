import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, unauthorizedResponse } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Ads API base URL
const GOOGLE_ADS_API_VERSION = 'v22';
const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

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

// Execute Google Ads Query Language (GAQL) query using search (not searchStream)
async function executeGoogleAdsQuery(
  accessToken: string,
  developerToken: string,
  customerId: string,
  query: string,
  loginCustomerId?: string
): Promise<any> {
  // Use search instead of searchStream for better compatibility
  const url = `${GOOGLE_ADS_API_BASE}/customers/${customerId}/googleAds:search`;
  
  console.log(`[Google Ads] Executing query for customer ${customerId}`);
  console.log(`[Google Ads] Query: ${query}`);
  
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${accessToken}`,
    "developer-token": developerToken,
    "Content-Type": "application/json"
  };
  
  // If using MCC, add login-customer-id header
  if (loginCustomerId && loginCustomerId !== customerId) {
    headers["login-customer-id"] = loginCustomerId;
    console.log(`[Google Ads] Using login-customer-id: ${loginCustomerId}`);
  }
  
  const response = await fetch(url, {
    method: "POST",
    headers,
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

// Test API access by listing accessible customers
async function testApiAccess(
  accessToken: string,
  developerToken: string
): Promise<{ success: boolean; customers?: string[]; error?: string }> {
  const url = `${GOOGLE_ADS_API_BASE}/customers:listAccessibleCustomers`;
  
  console.log('[Google Ads] Testing API access with listAccessibleCustomers...');
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "developer-token": developerToken,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Google Ads] listAccessibleCustomers error: ${response.status}`, errorText);
      return { success: false, error: `${response.status}: ${errorText}` };
    }

    const data = await response.json();
    console.log('[Google Ads] Accessible customers:', data);
    return { success: true, customers: data.resourceNames };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('[Google Ads] listAccessibleCustomers exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user authentication
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      console.error('[Google Ads] Auth failed:', auth.error);
      return unauthorizedResponse(auth.error);
    }
    console.log('[Google Ads] Authenticated user:', auth.user.id);

    // Get credentials from environment
    const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
    const customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID');
    const clientId = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');
    const refreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN');

    if (!developerToken) {
      throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN is not configured');
    }
    if (!customerId) {
      throw new Error('GOOGLE_ADS_CUSTOMER_ID is not configured');
    }
    if (!clientId || !clientSecret) {
      throw new Error('GOOGLE_ADS_CLIENT_ID or GOOGLE_ADS_CLIENT_SECRET is not configured');
    }
    if (!refreshToken) {
      throw new Error('GOOGLE_ADS_REFRESH_TOKEN is not configured');
    }

    console.log('[Google Ads] All credentials loaded successfully');
    console.log('[Google Ads] Developer Token (first 10 chars):', developerToken.substring(0, 10) + '...');
    console.log('[Google Ads] Customer ID:', customerId);

    // Parse request body
    const { startDate, endDate, reportType } = await req.json();
    
    // Default date range: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const requestStartDate = startDate || thirtyDaysAgo.toISOString().split('T')[0];
    const requestEndDate = endDate || today.toISOString().split('T')[0];

    console.log(`[Google Ads] Date range: ${requestStartDate} to ${requestEndDate}`);

    // Get access token using refresh token flow
    const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);

    // Test API access first
    const accessTest = await testApiAccess(accessToken, developerToken);
    if (!accessTest.success) {
      console.error('[Google Ads] API access test failed:', accessTest.error);
      throw new Error(`Google Ads API access denied: ${accessTest.error}. Please check your Developer Token has Standard Access approval.`);
    }
    
    console.log('[Google Ads] API access confirmed. Accessible customers:', accessTest.customers);

    // Clean customer ID (remove dashes if present)
    const cleanCustomerId = customerId.replace(/-/g, '');

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

    // Execute all queries in parallel
    console.log('[Google Ads] Executing queries...');
    
    const [campaigns, daily, adGroups, keywords, account] = await Promise.all([
      executeGoogleAdsQuery(accessToken, developerToken, cleanCustomerId, campaignQuery).catch(e => ({ error: e.message })),
      executeGoogleAdsQuery(accessToken, developerToken, cleanCustomerId, dailyQuery).catch(e => ({ error: e.message })),
      executeGoogleAdsQuery(accessToken, developerToken, cleanCustomerId, adGroupQuery).catch(e => ({ error: e.message })),
      executeGoogleAdsQuery(accessToken, developerToken, cleanCustomerId, keywordsQuery).catch(e => ({ error: e.message })),
      executeGoogleAdsQuery(accessToken, developerToken, cleanCustomerId, accountQuery).catch(e => ({ error: e.message }))
    ]);

    // Process and format the response
    const response = {
      campaigns: formatCampaignData(campaigns),
      daily: formatDailyData(daily),
      adGroups: formatAdGroupData(adGroups),
      keywords: formatKeywordsData(keywords),
      account: formatAccountData(account),
      dateRange: {
        startDate: requestStartDate,
        endDate: requestEndDate
      }
    };

    console.log('[Google Ads] Data fetched successfully:', {
      campaignsCount: response.campaigns?.length || 0,
      dailyCount: response.daily?.length || 0,
      adGroupsCount: response.adGroups?.length || 0,
      keywordsCount: response.keywords?.length || 0
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
