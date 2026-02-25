import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIKTOK_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

interface TikTokRequest {
  clientId: string;
  startDate?: string;
  endDate?: string;
  action?: 'campaigns' | 'insights' | 'account';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('TIKTOK_ACCESS_TOKEN');
    const advertiserId = Deno.env.get('TIKTOK_ADVERTISER_ID');

    if (!accessToken || !advertiserId) {
      return new Response(JSON.stringify({ 
        error: 'TikTok credentials not configured',
        details: 'Missing TIKTOK_ACCESS_TOKEN or TIKTOK_ADVERTISER_ID' 
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body: TikTokRequest = await req.json();
    const { clientId, startDate, endDate, action = 'insights' } = body;

    if (!clientId) {
      return new Response(JSON.stringify({ error: 'clientId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if client has TikTok integration
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('client_id', clientId)
      .eq('platform', 'tiktok_ads')
      .eq('is_connected', true)
      .maybeSingle();

    // Use integration-specific credentials if available, otherwise use global
    let token = accessToken;
    let advId = advertiserId;

    if (integration?.encrypted_credentials) {
      try {
        const { data: decrypted } = await supabase.rpc('decrypt_integration_credentials', {
          encrypted_data: integration.encrypted_credentials
        });
        if (decrypted) {
          const creds = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          token = creds.access_token || token;
          advId = creds.advertiser_id || advId;
        }
      } catch (e) {
        console.log('[tiktok-ads] Using global credentials, decryption failed:', e);
      }
    }

    const headers = {
      'Access-Token': token,
      'Content-Type': 'application/json',
    };

    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = endDate || now.toISOString().split('T')[0];

    // Fetch campaigns
    const campaignsUrl = `${TIKTOK_API_BASE}/campaign/get/?advertiser_id=${advId}&page_size=100`;
    const campaignsRes = await fetch(campaignsUrl, { headers });
    const campaignsData = await campaignsRes.json();

    if (campaignsData.code !== 0) {
      console.error('[tiktok-ads] Campaign API error:', campaignsData);
      return new Response(JSON.stringify({ 
        error: 'TikTok API error', 
        details: campaignsData.message || 'Failed to fetch campaigns' 
      }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const campaigns = campaignsData.data?.list || [];

    // Fetch insights/reporting data
    const reportBody = {
      advertiser_id: advId,
      report_type: 'BASIC',
      dimensions: ['campaign_id'],
      data_level: 'AUCTION_CAMPAIGN',
      metrics: [
        'spend', 'impressions', 'clicks', 'conversion', 'cpc', 'cpm', 'ctr',
        'cost_per_conversion', 'reach', 'video_play_actions', 'video_watched_2s',
        'video_watched_6s', 'video_views_p25', 'video_views_p50', 'video_views_p75',
        'video_views_p100', 'likes', 'comments', 'shares', 'follows'
      ],
      start_date: start,
      end_date: end,
      page_size: 100,
    };

    const reportRes = await fetch(`${TIKTOK_API_BASE}/report/integrated/get/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(reportBody),
    });
    const reportData = await reportRes.json();

    // Fetch daily breakdown for charts
    const dailyBody = {
      advertiser_id: advId,
      report_type: 'BASIC',
      dimensions: ['stat_time_day'],
      data_level: 'AUCTION_ADVERTISER',
      metrics: ['spend', 'impressions', 'clicks', 'conversion', 'ctr', 'cpc', 'reach', 'video_play_actions'],
      start_date: start,
      end_date: end,
      page_size: 100,
    };

    const dailyRes = await fetch(`${TIKTOK_API_BASE}/report/integrated/get/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dailyBody),
    });
    const dailyData = await dailyRes.json();

    // Process campaign data with insights
    const insightsByCampaign: Record<string, any> = {};
    if (reportData.code === 0 && reportData.data?.list) {
      for (const row of reportData.data.list) {
        const cid = row.dimensions?.campaign_id;
        if (cid) insightsByCampaign[cid] = row.metrics;
      }
    }

    const campaignsList = campaigns.map((c: any) => {
      const metrics = insightsByCampaign[c.campaign_id] || {};
      return {
        id: c.campaign_id,
        name: c.campaign_name,
        status: c.operation_status || c.secondary_status,
        objective: c.objective_type,
        budget: parseFloat(c.budget) || 0,
        budgetMode: c.budget_mode,
        spend: parseFloat(metrics.spend) || 0,
        impressions: parseInt(metrics.impressions) || 0,
        clicks: parseInt(metrics.clicks) || 0,
        conversions: parseInt(metrics.conversion) || 0,
        cpc: parseFloat(metrics.cpc) || 0,
        cpm: parseFloat(metrics.cpm) || 0,
        ctr: parseFloat(metrics.ctr) || 0,
        reach: parseInt(metrics.reach) || 0,
        videoViews: parseInt(metrics.video_play_actions) || 0,
        likes: parseInt(metrics.likes) || 0,
        comments: parseInt(metrics.comments) || 0,
        shares: parseInt(metrics.shares) || 0,
        follows: parseInt(metrics.follows) || 0,
      };
    });

    // Process daily data for charts
    const dailyList = (dailyData.code === 0 && dailyData.data?.list) 
      ? dailyData.data.list.map((row: any) => ({
          date: row.dimensions?.stat_time_day,
          spend: parseFloat(row.metrics?.spend) || 0,
          impressions: parseInt(row.metrics?.impressions) || 0,
          clicks: parseInt(row.metrics?.clicks) || 0,
          conversions: parseInt(row.metrics?.conversion) || 0,
          ctr: parseFloat(row.metrics?.ctr) || 0,
          cpc: parseFloat(row.metrics?.cpc) || 0,
          reach: parseInt(row.metrics?.reach) || 0,
          videoViews: parseInt(row.metrics?.video_play_actions) || 0,
        })).sort((a: any, b: any) => a.date?.localeCompare(b.date))
      : [];

    // Calculate totals
    const totals = {
      spend: campaignsList.reduce((s: number, c: any) => s + c.spend, 0),
      impressions: campaignsList.reduce((s: number, c: any) => s + c.impressions, 0),
      clicks: campaignsList.reduce((s: number, c: any) => s + c.clicks, 0),
      conversions: campaignsList.reduce((s: number, c: any) => s + c.conversions, 0),
      reach: campaignsList.reduce((s: number, c: any) => s + c.reach, 0),
      videoViews: campaignsList.reduce((s: number, c: any) => s + c.videoViews, 0),
      likes: campaignsList.reduce((s: number, c: any) => s + c.likes, 0),
      comments: campaignsList.reduce((s: number, c: any) => s + c.comments, 0),
      shares: campaignsList.reduce((s: number, c: any) => s + c.shares, 0),
      follows: campaignsList.reduce((s: number, c: any) => s + c.follows, 0),
      ctr: 0,
      cpc: 0,
      cpm: 0,
    };

    if (totals.impressions > 0) {
      totals.ctr = (totals.clicks / totals.impressions) * 100;
      totals.cpm = (totals.spend / totals.impressions) * 1000;
    }
    if (totals.clicks > 0) {
      totals.cpc = totals.spend / totals.clicks;
    }

    const activeCampaigns = campaignsList.filter((c: any) => 
      c.status === 'ENABLE' || c.status === 'CAMPAIGN_STATUS_ENABLE'
    ).length;

    return new Response(JSON.stringify({
      success: true,
      advertiser_id: advId,
      campaigns: campaignsList,
      daily: dailyList,
      totals,
      summary: {
        totalCampaigns: campaignsList.length,
        activeCampaigns,
        dateRange: { start, end },
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[tiktok-ads] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: String(error) 
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
