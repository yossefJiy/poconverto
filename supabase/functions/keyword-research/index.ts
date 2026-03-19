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

    const { keywords, url, client_id, language_id, location_ids } = await req.json();

    if (!keywords?.length && !url) {
      return new Response(JSON.stringify({ error: 'Provide keywords or URL' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get credentials - try client-specific first, then global
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
      return new Response(JSON.stringify({ error: 'Google Ads credentials not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const accessToken = await getAccessToken(clientId, clientSecret, refreshToken);

    // Clean customer ID
    const cleanCustomerId = customerId.replace(/-/g, '');

    // Build request body for generateKeywordIdeas
    const requestBody: any = {
      keywordPlanNetwork: "GOOGLE_SEARCH",
      includeAdultKeywords: false,
      // Language: Hebrew (1027) by default, English (1000)
      language: `languageConstants/${language_id || '1027'}`,
      // Location: Israel (2376) by default
      geoTargetConstants: (location_ids || ['2376']).map((id: string) => `geoTargetConstants/${id}`),
    };

    // Set seed - keywords, URL, or both
    if (keywords?.length && url) {
      requestBody.keywordAndUrlSeed = {
        keywords: keywords,
        url: url
      };
    } else if (keywords?.length) {
      requestBody.keywordSeed = {
        keywords: keywords
      };
    } else if (url) {
      requestBody.urlSeed = {
        url: url
      };
    }

    console.log('[Keyword Research] Requesting ideas for:', { keywords, url, customerId: cleanCustomerId });

    const response = await fetch(
      `${GOOGLE_ADS_API_BASE}/customers/${cleanCustomerId}:generateKeywordIdeas`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Keyword Research] API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `Google Ads API error: ${response.status}`, details: errorText }), {
        status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();

    // Parse results
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

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      totalSize: data.totalSize || results.length
    }), {
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
