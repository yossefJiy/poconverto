import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_ADS_API_VERSION = 'v22';
const GOOGLE_ADS_API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

const GLOBAL_CLIENT_ID = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
const GLOBAL_CLIENT_SECRET = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');
const GLOBAL_DEVELOPER_TOKEN = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  const tokenData = await tokenResponse.json();
  if (tokenData.error) {
    throw new Error(`OAuth token error: ${tokenData.error_description || tokenData.error}`);
  }
  if (!tokenData.access_token) {
    throw new Error('Failed to obtain access token');
  }
  return tokenData.access_token;
}

async function getClientCredentials(supabaseClient: any, clientId: string) {
  const { data: integration, error } = await supabaseClient
    .from('integrations')
    .select('id, encrypted_credentials, settings, external_account_id')
    .eq('client_id', clientId)
    .eq('platform', 'google_ads')
    .eq('is_connected', true)
    .single();

  if (error || !integration) return null;

  let credentials: any = {};
  
  if (integration.encrypted_credentials) {
    const { data: decryptedData, error: decryptError } = await supabaseClient
      .rpc('decrypt_integration_credentials', { encrypted_data: integration.encrypted_credentials });

    if (!decryptError && decryptedData) {
      credentials = decryptedData;
    }
  }

  if (integration.settings?.customer_id) {
    credentials.customer_id = integration.settings.customer_id;
  } else if (integration.external_account_id) {
    credentials.customer_id = integration.external_account_id;
  }

  return credentials;
}

async function getCredentials(supabaseClient: any, client_id?: string) {
  let refreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN');
  let customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID');
  let clientId = GLOBAL_CLIENT_ID;
  let clientSecret = GLOBAL_CLIENT_SECRET;
  let developerToken = GLOBAL_DEVELOPER_TOKEN;

  if (client_id) {
    const creds = await getClientCredentials(supabaseClient, client_id);
    if (creds?.refresh_token) refreshToken = creds.refresh_token;
    if (creds?.customer_id) customerId = creds.customer_id;
  }

  if (!refreshToken || !clientId || !clientSecret || !developerToken || !customerId) {
    throw new Error('Google Ads credentials not configured');
  }

  const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);
  const cleanCustomerId = customerId.replace(/-/g, '');

  return { accessToken, developerToken, cleanCustomerId };
}

function makeHeaders(accessToken: string, developerToken: string) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json',
  };
}

// Action: generate keyword ideas (existing)
async function handleGenerateIdeas(body: any, creds: any) {
  const { keywords, url, language_id, location_ids } = body;
  
  const requestBody: any = {
    keywordPlanNetwork: "GOOGLE_SEARCH",
    includeAdultKeywords: false,
    language: `languageConstants/${language_id || '1027'}`,
    geoTargetConstants: (location_ids || ['2376']).map((id: string) => `geoTargetConstants/${id}`),
  };

  if (keywords?.length && url) {
    requestBody.keywordAndUrlSeed = { keywords, url };
  } else if (keywords?.length) {
    requestBody.keywordSeed = { keywords };
  } else if (url) {
    requestBody.urlSeed = { url };
  }

  console.log('[Keyword Research] Requesting ideas for:', { keywords, url });

  const response = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${creds.cleanCustomerId}:generateKeywordIdeas`,
    {
      method: 'POST',
      headers: makeHeaders(creds.accessToken, creds.developerToken),
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Keyword Research] API error:', response.status, errorText);
    throw new Error(`Google Ads API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  const results = (data.results || []).map((result: any) => {
    const metrics = result.keywordIdeaMetrics || {};
    const monthlyVolumes = (metrics.monthlySearchVolumes || []).map((m: any) => ({
      year: m.year,
      month: m.month,
      volume: parseInt(m.monthlySearches || '0')
    }));

    return {
      keyword: result.text,
      avgMonthlySearches: parseInt(metrics.avgMonthlySearches || '0'),
      competition: metrics.competition || 'UNSPECIFIED',
      competitionIndex: parseInt(metrics.competitionIndex || '0'),
      lowTopOfPageBidMicros: parseInt(metrics.lowTopOfPageBidMicros || '0') / 1_000_000,
      highTopOfPageBidMicros: parseInt(metrics.highTopOfPageBidMicros || '0') / 1_000_000,
      monthlyVolumes
    };
  });

  console.log(`[Keyword Research] Found ${results.length} keyword ideas`);
  return { success: true, results, totalSize: data.totalSize || results.length };
}

// Action: historical metrics for specific keywords
async function handleHistoricalMetrics(body: any, creds: any) {
  const { keywords, language_id, location_ids } = body;
  
  if (!keywords?.length) throw new Error('Keywords required for historical metrics');

  const requestBody: any = {
    keywords,
    keywordPlanNetwork: "GOOGLE_SEARCH",
    language: `languageConstants/${language_id || '1027'}`,
    geoTargetConstants: (location_ids || ['2376']).map((id: string) => `geoTargetConstants/${id}`),
  };

  console.log('[Keyword Research] Historical metrics for:', keywords.length, 'keywords');

  const response = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${creds.cleanCustomerId}:generateKeywordHistoricalMetrics`,
    {
      method: 'POST',
      headers: makeHeaders(creds.accessToken, creds.developerToken),
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Ads API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  const results = (data.results || []).map((result: any) => {
    const metrics = result.keywordMetrics || {};
    const monthlyVolumes = (metrics.monthlySearchVolumes || []).map((m: any) => ({
      year: m.year,
      month: m.month,
      volume: parseInt(m.monthlySearches || '0')
    }));

    return {
      keyword: result.text,
      avgMonthlySearches: parseInt(metrics.avgMonthlySearches || '0'),
      competition: metrics.competition || 'UNSPECIFIED',
      competitionIndex: parseInt(metrics.competitionIndex || '0'),
      lowTopOfPageBidMicros: parseInt(metrics.lowTopOfPageBidMicros || '0') / 1_000_000,
      highTopOfPageBidMicros: parseInt(metrics.highTopOfPageBidMicros || '0') / 1_000_000,
      monthlyVolumes
    };
  });

  return { success: true, results };
}

// Action: forecast metrics
async function handleForecast(body: any, creds: any) {
  const { keywords, daily_budget, language_id, location_ids } = body;
  
  if (!keywords?.length) throw new Error('Keywords required for forecast');

  // Step 1: Create a keyword plan
  const campaignBody = {
    keywordPlan: {
      name: `forecast_${Date.now()}`,
      forecastPeriod: {
        dateInterval: "NEXT_MONTH"
      }
    }
  };

  // For forecast, we use the keyword plan forecast endpoint
  // The simpler approach: use generateKeywordForecastMetrics directly
  const requestBody: any = {
    keywordPlan: {
      maxCpcBidMicros: String(Math.round((daily_budget || 10) * 1_000_000)),
    },
    keywords: keywords.map((kw: string) => ({
      text: kw,
      matchType: "BROAD"
    })),
    forecastPeriod: {
      dateInterval: "NEXT_MONTH"
    },
    keywordPlanNetwork: "GOOGLE_SEARCH",
    language: `languageConstants/${language_id || '1027'}`,
    geoTargetConstants: (location_ids || ['2376']).map((id: string) => `geoTargetConstants/${id}`),
  };

  console.log('[Keyword Research] Forecast for:', keywords.length, 'keywords, budget:', daily_budget);

  const response = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${creds.cleanCustomerId}:generateKeywordForecastMetrics`,
    {
      method: 'POST',
      headers: makeHeaders(creds.accessToken, creds.developerToken),
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Ads API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  const keywordForecasts = (data.keywordForecasts || []).map((f: any, i: number) => {
    const metrics = f.keywordForecast || {};
    return {
      keyword: keywords[i] || `keyword_${i}`,
      clicks: parseFloat(metrics.clicks || '0'),
      impressions: parseFloat(metrics.impressions || '0'),
      costMicros: parseInt(metrics.costMicros || '0') / 1_000_000,
      conversions: parseFloat(metrics.conversions || '0'),
      conversionValue: parseFloat(metrics.conversionValue || '0'),
      ctr: parseFloat(metrics.ctr || '0'),
      averageCpc: parseInt(metrics.averageCpcMicros || '0') / 1_000_000,
    };
  });

  const campaignForecast = data.campaignForecastMetrics || {};

  return {
    success: true,
    keywordForecasts,
    campaignForecast: {
      clicks: parseFloat(campaignForecast.clicks || '0'),
      impressions: parseFloat(campaignForecast.impressions || '0'),
      costMicros: parseInt(campaignForecast.costMicros || '0') / 1_000_000,
      conversions: parseFloat(campaignForecast.conversions || '0'),
    }
  };
}

// Action: ad group themes
async function handleAdGroupThemes(body: any, creds: any) {
  const { keywords, url } = body;
  
  if (!keywords?.length) throw new Error('Keywords required for ad group themes');

  const requestBody: any = {
    keywords: keywords.map((kw: string) => kw),
  };

  if (url) {
    requestBody.url = url;
  }

  console.log('[Keyword Research] Ad group themes for:', keywords.length, 'keywords');

  const response = await fetch(
    `${GOOGLE_ADS_API_BASE}/customers/${creds.cleanCustomerId}:generateAdGroupThemes`,
    {
      method: 'POST',
      headers: makeHeaders(creds.accessToken, creds.developerToken),
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Ads API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  const themes = (data.adGroupKeywordSuggestions || []).map((s: any) => ({
    adGroupTheme: s.keywordTheme?.displayName || 'ללא שם',
    keywords: s.keywordSuggestions?.map((ks: any) => ks.text) || []
  }));

  return { success: true, themes };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const action = body.action || 'generate_ideas';

    // Validate basic input
    if (action === 'generate_ideas' && !body.keywords?.length && !body.url) {
      return new Response(JSON.stringify({ error: 'Provide keywords or URL' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const creds = await getCredentials(supabaseClient, body.client_id);

    let result;
    switch (action) {
      case 'generate_ideas':
        result = await handleGenerateIdeas(body, creds);
        break;
      case 'historical_metrics':
        result = await handleHistoricalMetrics(body, creds);
        break;
      case 'forecast':
        result = await handleForecast(body, creds);
        break;
      case 'ad_group_themes':
        result = await handleAdGroupThemes(body, creds);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Keyword Research] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
