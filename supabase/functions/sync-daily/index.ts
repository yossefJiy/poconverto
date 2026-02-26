import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  client_id?: string; // specific client or "all"
  date_from?: string; // YYYY-MM-DD
  date_to?: string;
  platforms?: string[]; // meta_ads, google_ads, tiktok_ads, shopify, woocommerce, ga4
}

interface SyncRunResult {
  platform: string;
  rows_upserted: number;
  error?: string;
}

// ===================== HELPERS =====================

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

function yesterdayDate(tz = 'Asia/Jerusalem'): string {
  const d = new Date();
  // Approximate timezone offset for Israel (+2/+3)
  const offset = 2; // simplified
  d.setHours(d.getHours() + offset);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

async function decryptCredentials(supabase: any, encrypted: string): Promise<any> {
  const { data, error } = await supabase.rpc('decrypt_integration_credentials', {
    encrypted_data: encrypted
  });
  if (error) throw new Error(`Decryption failed: ${error.message}`);
  return typeof data === 'string' ? JSON.parse(data) : data;
}

// ===================== GOOGLE ADS SYNC =====================

async function syncGoogleAds(
  supabase: any,
  clientId: string,
  integration: any,
  dateFrom: string,
  dateTo: string,
  clientCurrency: string
): Promise<SyncRunResult> {
  const result: SyncRunResult = { platform: 'google_ads', rows_upserted: 0 };

  try {
    const creds = await decryptCredentials(supabase, integration.encrypted_credentials);
    const customerId = (creds.customer_id || integration.external_account_id || '').replace(/-/g, '');
    if (!customerId) throw new Error('No customer_id configured');

    const clientId_oauth = Deno.env.get('GOOGLE_ADS_CLIENT_ID')!;
    const clientSecret = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET')!;
    const devToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN')!;

    if (!creds.refresh_token) throw new Error('No refresh_token');

    // Get access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId_oauth,
        client_secret: clientSecret,
        refresh_token: creds.refresh_token,
        grant_type: "refresh_token"
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error(`OAuth error: ${tokenData.error}`);

    // Query daily campaign metrics
    const query = `
      SELECT
        segments.date,
        campaign.id,
        campaign.name,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.conversions_value,
        customer.currency_code
      FROM campaign
      WHERE segments.date BETWEEN '${dateFrom}' AND '${dateTo}'
        AND campaign.status != 'REMOVED'
    `;

    const res = await fetch(
      `https://googleads.googleapis.com/v22/customers/${customerId}/googleAds:searchStream`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`,
          "developer-token": devToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Ads API ${res.status}: ${err.substring(0, 200)}`);
    }

    const data = await res.json();
    const rows: any[] = [];

    if (Array.isArray(data)) {
      for (const chunk of data) {
        for (const r of (chunk.results || [])) {
          const costMicros = parseInt(r.metrics?.costMicros || '0');
          const spend = costMicros / 1_000_000;
          const currencyCode = r.customer?.currencyCode || 'ILS';

          rows.push({
            client_id: clientId,
            integration_id: integration.id,
            date: r.segments?.date,
            platform: 'google_ads',
            account_id: customerId,
            campaign_id: r.campaign?.id?.toString() || '',
            campaign_name: r.campaign?.name || '',
            breakdown_key: null,
            spend_original: spend,
            currency_original: currencyCode,
            spend_reporting: spend, // TODO: convert if currency != clientCurrency
            impressions: parseInt(r.metrics?.impressions || '0'),
            clicks: parseInt(r.metrics?.clicks || '0'),
            conversions: parseFloat(r.metrics?.conversions || '0'),
            conversion_value_original: parseFloat(r.metrics?.conversionsValue || '0'),
            conversion_value_reporting: parseFloat(r.metrics?.conversionsValue || '0'),
            fetched_at: new Date().toISOString(),
          });
        }
      }
    }

    if (rows.length > 0) {
      const { error: upsertErr } = await supabase
        .from('daily_marketing_metrics')
        .upsert(rows, {
          onConflict: 'client_id,integration_id,date,campaign_id,breakdown_key',
          ignoreDuplicates: false
        });
      if (upsertErr) throw new Error(`Upsert error: ${upsertErr.message}`);
      result.rows_upserted = rows.length;
    }

    // Update last_sync_at
    await supabase.from('integrations').update({ last_sync_at: new Date().toISOString() }).eq('id', integration.id);

  } catch (e: any) {
    result.error = e.message;
    console.error(`[sync-daily] Google Ads error for client ${clientId}:`, e.message);
  }

  return result;
}

// ===================== META ADS SYNC =====================

async function syncMetaAds(
  supabase: any,
  clientId: string,
  integration: any,
  dateFrom: string,
  dateTo: string,
  clientCurrency: string
): Promise<SyncRunResult> {
  const result: SyncRunResult = { platform: 'meta_ads', rows_upserted: 0 };

  try {
    const creds = await decryptCredentials(supabase, integration.encrypted_credentials);
    if (!creds.access_token) throw new Error('No access_token');

    const settings = integration.settings || {};
    const adAccounts: string[] = [];

    // Multi-account support
    if (Array.isArray(settings.ad_accounts)) {
      for (const acc of settings.ad_accounts) {
        const id = acc?.id || acc?.ad_account_id || acc;
        if (id) adAccounts.push(id.startsWith('act_') ? id : `act_${id}`);
      }
    } else {
      const singleId = settings.ad_account_id || integration.external_account_id;
      if (singleId) adAccounts.push(singleId.startsWith('act_') ? singleId : `act_${singleId}`);
    }

    if (adAccounts.length === 0) throw new Error('No ad account IDs configured');

    const allRows: any[] = [];

    for (const accountId of adAccounts) {
      // Fetch campaign-level insights with publisher_platform breakdown
      const url = `https://graph.facebook.com/v18.0/${accountId}/insights`;
      const params = new URLSearchParams({
        access_token: creds.access_token,
        fields: 'campaign_name,campaign_id,impressions,clicks,spend,actions,action_values,publisher_platform',
        time_range: JSON.stringify({ since: dateFrom, until: dateTo }),
        time_increment: '1',
        level: 'campaign',
        breakdowns: 'publisher_platform',
        limit: '500',
      });

      const res = await fetch(`${url}?${params}`);
      const data = await res.json();

      if (data.error) {
        console.error(`[sync-daily] Meta API error for ${accountId}:`, data.error.message);
        continue;
      }

      for (const row of (data.data || [])) {
        const conversions = (row.actions || [])
          .filter((a: any) => a.action_type === 'purchase' || a.action_type === 'omni_purchase')
          .reduce((sum: number, a: any) => sum + parseInt(a.value || '0'), 0);

        const convValue = (row.action_values || [])
          .filter((a: any) => a.action_type === 'purchase' || a.action_type === 'omni_purchase')
          .reduce((sum: number, a: any) => sum + parseFloat(a.value || '0'), 0);

        const spend = parseFloat(row.spend || '0');

        allRows.push({
          client_id: clientId,
          integration_id: integration.id,
          date: row.date_start,
          platform: 'meta_ads',
          account_id: accountId,
          campaign_id: row.campaign_id || '',
          campaign_name: row.campaign_name || '',
          breakdown_key: row.publisher_platform || null,
          spend_original: spend,
          currency_original: 'USD', // Meta reports in account currency
          spend_reporting: spend, // TODO: convert
          impressions: parseInt(row.impressions || '0'),
          clicks: parseInt(row.clicks || '0'),
          conversions,
          conversion_value_original: convValue,
          conversion_value_reporting: convValue,
          fetched_at: new Date().toISOString(),
        });
      }
    }

    if (allRows.length > 0) {
      // Batch upsert in chunks of 500
      for (let i = 0; i < allRows.length; i += 500) {
        const chunk = allRows.slice(i, i + 500);
        const { error: upsertErr } = await supabase
          .from('daily_marketing_metrics')
          .upsert(chunk, {
            onConflict: 'client_id,integration_id,date,campaign_id,breakdown_key',
            ignoreDuplicates: false
          });
        if (upsertErr) throw new Error(`Upsert error: ${upsertErr.message}`);
      }
      result.rows_upserted = allRows.length;
    }

    await supabase.from('integrations').update({ last_sync_at: new Date().toISOString() }).eq('id', integration.id);

  } catch (e: any) {
    result.error = e.message;
    console.error(`[sync-daily] Meta Ads error for client ${clientId}:`, e.message);
  }

  return result;
}

// ===================== TIKTOK ADS SYNC =====================

async function syncTikTokAds(
  supabase: any,
  clientId: string,
  integration: any,
  dateFrom: string,
  dateTo: string,
  clientCurrency: string
): Promise<SyncRunResult> {
  const result: SyncRunResult = { platform: 'tiktok_ads', rows_upserted: 0 };

  try {
    let token: string;
    let advId: string;

    if (integration.encrypted_credentials) {
      const creds = await decryptCredentials(supabase, integration.encrypted_credentials);
      token = creds.access_token;
      advId = creds.advertiser_id || integration.external_account_id;
    } else {
      throw new Error('No credentials configured for this TikTok integration');
    }

    if (!token || !advId) throw new Error('Missing TikTok credentials');

    const headers = { 'Access-Token': token, 'Content-Type': 'application/json' };

    // Fetch campaign-level daily data
    const reportBody = {
      advertiser_id: advId,
      report_type: 'BASIC',
      dimensions: ['campaign_id', 'stat_time_day'],
      data_level: 'AUCTION_CAMPAIGN',
      metrics: ['spend', 'impressions', 'clicks', 'conversion', 'cost_per_conversion'],
      start_date: dateFrom,
      end_date: dateTo,
      page_size: 1000,
    };

    const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/', {
      method: 'POST', headers, body: JSON.stringify(reportBody),
    });
    const data = await res.json();

    if (data.code !== 0) throw new Error(`TikTok API error: ${data.message}`);

    // Get campaign names
    const campaignsRes = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id=${advId}&page_size=1000`,
      { headers }
    );
    const campaignsData = await campaignsRes.json();
    const campaignNames: Record<string, string> = {};
    for (const c of (campaignsData.data?.list || [])) {
      campaignNames[c.campaign_id] = c.campaign_name;
    }

    const rows: any[] = [];
    for (const row of (data.data?.list || [])) {
      const cid = row.dimensions?.campaign_id;
      const date = row.dimensions?.stat_time_day;
      const m = row.metrics || {};

      rows.push({
        client_id: clientId,
        integration_id: integration.id,
        date,
        platform: 'tiktok_ads',
        account_id: advId,
        campaign_id: cid || '',
        campaign_name: campaignNames[cid] || cid || '',
        breakdown_key: null,
        spend_original: parseFloat(m.spend) || 0,
        currency_original: 'USD',
        spend_reporting: parseFloat(m.spend) || 0,
        impressions: parseInt(m.impressions) || 0,
        clicks: parseInt(m.clicks) || 0,
        conversions: parseInt(m.conversion) || 0,
        conversion_value_original: 0,
        conversion_value_reporting: 0,
        fetched_at: new Date().toISOString(),
      });
    }

    if (rows.length > 0) {
      const { error: upsertErr } = await supabase
        .from('daily_marketing_metrics')
        .upsert(rows, {
          onConflict: 'client_id,integration_id,date,campaign_id,breakdown_key',
          ignoreDuplicates: false
        });
      if (upsertErr) throw new Error(`Upsert: ${upsertErr.message}`);
      result.rows_upserted = rows.length;
    }

    await supabase.from('integrations').update({ last_sync_at: new Date().toISOString() }).eq('id', integration.id);

  } catch (e: any) {
    result.error = e.message;
    console.error(`[sync-daily] TikTok error for client ${clientId}:`, e.message);
  }

  return result;
}

// ===================== SHOPIFY SYNC =====================

async function syncShopify(
  supabase: any,
  clientId: string,
  integration: any,
  dateFrom: string,
  dateTo: string,
  clientCurrency: string
): Promise<SyncRunResult> {
  const result: SyncRunResult = { platform: 'shopify', rows_upserted: 0 };

  try {
    let accessToken: string;
    let storeDomain: string;

    if (integration.encrypted_credentials) {
      const creds = await decryptCredentials(supabase, integration.encrypted_credentials);
      accessToken = creds.access_token;
      storeDomain = creds.store_domain || integration.external_account_id;
    } else {
      throw new Error('No credentials configured for this Shopify integration');
    }

    if (!accessToken || !storeDomain) throw new Error('Missing Shopify credentials');

    const cleanDomain = storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const graphqlUrl = `https://${cleanDomain}/admin/api/2025-10/graphql.json`;

    // Generate date list
    const dates: string[] = [];
    let d = new Date(dateFrom);
    const end = new Date(dateTo);
    while (d <= end) {
      dates.push(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() + 1);
    }

    // Use ShopifyQL for daily sales breakdown
    const salesQuery = `
      FROM sales
      SHOW orders, gross_sales, discounts, returns, net_sales, total_sales
      GROUP BY day
      SINCE ${dateFrom}
      UNTIL ${dateTo}
      ORDER BY day ASC
    `;

    const graphqlQuery = `
      query {
        shopifyqlQuery(query: "${salesQuery.replace(/\n/g, ' ').replace(/"/g, '\\"').trim()}") {
          tableData {
            columns { name dataType }
            rows
          }
          parseErrors
        }
      }
    `;

    const gqlRes = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: graphqlQuery }),
    });

    if (!gqlRes.ok) throw new Error(`Shopify GraphQL ${gqlRes.status}`);
    const gqlData = await gqlRes.json();

    const tableData = gqlData?.data?.shopifyqlQuery?.tableData;
    const rows: any[] = [];

    if (tableData?.rows) {
      for (const row of tableData.rows) {
        const date = row.day?.toString().split('T')[0];
        if (!date) continue;

        const parseNum = (v: any) => {
          if (v === null || v === undefined) return 0;
          return parseFloat(v.toString().replace(/[^\d.-]/g, '')) || 0;
        };

        rows.push({
          client_id: clientId,
          integration_id: integration.id,
          date,
          store_platform: 'shopify',
          orders: parseInt(row.orders) || 0,
          gross_sales: parseNum(row.gross_sales),
          discounts: Math.abs(parseNum(row.discounts)),
          refunds: Math.abs(parseNum(row.returns)),
          net_sales: parseNum(row.net_sales),
          currency_original: clientCurrency,
          net_sales_reporting: parseNum(row.net_sales),
          fetched_at: new Date().toISOString(),
        });
      }
    }

    if (rows.length > 0) {
      const { error: upsertErr } = await supabase
        .from('daily_site_metrics')
        .upsert(rows, {
          onConflict: 'client_id,integration_id,date',
          ignoreDuplicates: false
        });
      if (upsertErr) throw new Error(`Upsert: ${upsertErr.message}`);
      result.rows_upserted = rows.length;
    }

    await supabase.from('integrations').update({ last_sync_at: new Date().toISOString() }).eq('id', integration.id);

  } catch (e: any) {
    result.error = e.message;
    console.error(`[sync-daily] Shopify error for client ${clientId}:`, e.message);
  }

  return result;
}

// ===================== GA4 SYNC =====================

async function syncGA4(
  supabase: any,
  clientId: string,
  integration: any,
  dateFrom: string,
  dateTo: string
): Promise<SyncRunResult> {
  const result: SyncRunResult = { platform: 'ga4', rows_upserted: 0 };

  try {
    let serviceAccount: any;
    let propertyId: string;

    if (integration.encrypted_credentials) {
      const creds = await decryptCredentials(supabase, integration.encrypted_credentials);
      serviceAccount = creds.service_account || creds;
      propertyId = creds.property_id || integration.external_account_id;
    } else {
      throw new Error('No credentials configured for this GA4 integration');
    }

    if (!propertyId) throw new Error('No property_id configured');
    if (!serviceAccount?.private_key) throw new Error('No service account key');

    // Generate JWT access token
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: "RS256", typ: "JWT" };
    const payload = {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now, exp: now + 3600
    };

    const enc = (o: any) => btoa(JSON.stringify(o)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const headerB64 = enc(header);
    const payloadB64 = enc(payload);
    const sigInput = `${headerB64}.${payloadB64}`;

    const pemContents = serviceAccount.private_key
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\n/g, "");

    const binaryKey = Uint8Array.from(atob(pemContents), (c: string) => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8", binaryKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false, ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(sigInput)
    );
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const jwt = `${sigInput}.${sigB64}`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Failed to get GA4 access token');

    // Run daily report
    const reportRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: dateFrom, endDate: dateTo }],
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "engagedSessions" },
            { name: "ecommercePurchases" }
          ],
          dimensions: [{ name: "date" }],
          orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
        })
      }
    );
    const reportData = await reportRes.json();

    const rows: any[] = [];
    for (const row of (reportData.rows || [])) {
      const dateRaw = row.dimensionValues?.[0]?.value || '';
      const date = `${dateRaw.substring(0,4)}-${dateRaw.substring(4,6)}-${dateRaw.substring(6,8)}`;

      rows.push({
        client_id: clientId,
        integration_id: integration.id,
        date,
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        users: parseInt(row.metricValues?.[1]?.value || '0'),
        engaged_sessions: parseInt(row.metricValues?.[2]?.value || '0'),
        ecommerce_events: parseInt(row.metricValues?.[3]?.value || '0'),
        fetched_at: new Date().toISOString(),
      });
    }

    if (rows.length > 0) {
      const { error: upsertErr } = await supabase
        .from('daily_web_analytics_metrics')
        .upsert(rows, {
          onConflict: 'client_id,integration_id,date',
          ignoreDuplicates: false
        });
      if (upsertErr) throw new Error(`Upsert: ${upsertErr.message}`);
      result.rows_upserted = rows.length;
    }

    await supabase.from('integrations').update({ last_sync_at: new Date().toISOString() }).eq('id', integration.id);

  } catch (e: any) {
    result.error = e.message;
    console.error(`[sync-daily] GA4 error for client ${clientId}:`, e.message);
  }

  return result;
}

// ===================== MAIN HANDLER =====================

const PLATFORM_TO_DB: Record<string, string> = {
  meta_ads: 'facebook_ads',
  google_ads: 'google_ads',
  tiktok_ads: 'tiktok_ads',
  shopify: 'shopify',
  woocommerce: 'woocommerce',
  ga4: 'ga4',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = getSupabaseAdmin();
  let syncRunId: string | null = null;

  try {
    const body: SyncRequest = await req.json();
    const {
      client_id,
      date_from = yesterdayDate(),
      date_to = yesterdayDate(),
      platforms = ['meta_ads', 'google_ads', 'tiktok_ads', 'shopify'],
    } = body;

    console.log(`[sync-daily] Starting sync: client=${client_id || 'all'}, dates=${date_from}..${date_to}, platforms=${platforms.join(',')}`);

    // Create sync_run record
    const { data: syncRun, error: syncErr } = await supabase
      .from('sync_runs')
      .insert({
        client_id: client_id && client_id !== 'all' ? client_id : null,
        date_from,
        date_to,
        platforms: platforms,
        status: 'running',
      })
      .select('id')
      .single();

    if (syncErr) console.error('[sync-daily] Failed to create sync_run:', syncErr);
    syncRunId = syncRun?.id || null;

    // Get clients
    let clientsQuery = supabase.from('clients').select('id, currency, timezone').eq('status', 'active');
    if (client_id && client_id !== 'all') {
      clientsQuery = clientsQuery.eq('id', client_id);
    }
    const { data: clients, error: clientsErr } = await clientsQuery;
    if (clientsErr) throw new Error(`Failed to fetch clients: ${clientsErr.message}`);

    const allResults: SyncRunResult[] = [];
    let totalRows = 0;

    for (const client of (clients || [])) {
      // Get active integrations for this client
      const { data: integrations } = await supabase
        .from('integrations')
        .select('*')
        .eq('client_id', client.id)
        .eq('is_connected', true);

      if (!integrations || integrations.length === 0) continue;

      for (const integration of integrations) {
        const platformKey = integration.platform;

        // Map DB platform names to request platform names
        const requestPlatformMap: Record<string, string> = {
          facebook_ads: 'meta_ads',
          google_ads: 'google_ads',
          tiktok_ads: 'tiktok_ads',
          shopify: 'shopify',
          woocommerce: 'woocommerce',
          ga4: 'ga4',
        };

        const requestPlatform = requestPlatformMap[platformKey] || platformKey;
        if (!platforms.includes(requestPlatform)) continue;
        if (!integration.encrypted_credentials) continue;

        let syncResult: SyncRunResult;

        switch (platformKey) {
          case 'google_ads':
            syncResult = await syncGoogleAds(supabase, client.id, integration, date_from, date_to, client.currency || 'ILS');
            break;
          case 'facebook_ads':
            syncResult = await syncMetaAds(supabase, client.id, integration, date_from, date_to, client.currency || 'ILS');
            break;
          case 'tiktok_ads':
            syncResult = await syncTikTokAds(supabase, client.id, integration, date_from, date_to, client.currency || 'ILS');
            break;
          case 'shopify':
            syncResult = await syncShopify(supabase, client.id, integration, date_from, date_to, client.currency || 'ILS');
            break;
          case 'ga4':
            syncResult = await syncGA4(supabase, client.id, integration, date_from, date_to);
            break;
          default:
            continue;
        }

        allResults.push(syncResult);
        totalRows += syncResult.rows_upserted;
      }
    }

    // Update sync_run
    const hasErrors = allResults.some(r => r.error);
    const status = allResults.length === 0 ? 'success' :
      hasErrors && allResults.every(r => r.error) ? 'fail' :
      hasErrors ? 'partial' : 'success';

    const errorSummary = allResults
      .filter(r => r.error)
      .map(r => `${r.platform}: ${r.error}`)
      .join('; ');

    if (syncRunId) {
      await supabase.from('sync_runs').update({
        status,
        rows_upserted: totalRows,
        error_summary: errorSummary || null,
        finished_at: new Date().toISOString(),
      }).eq('id', syncRunId);
    }

    console.log(`[sync-daily] Done: ${totalRows} rows, status=${status}`);

    return new Response(JSON.stringify({
      success: true,
      status,
      rows_upserted: totalRows,
      results: allResults,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[sync-daily] Fatal error:', error);

    if (syncRunId) {
      await supabase.from('sync_runs').update({
        status: 'fail',
        error_summary: error.message,
        finished_at: new Date().toISOString(),
      }).eq('id', syncRunId);
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
