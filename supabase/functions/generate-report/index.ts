import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAuth, unauthorizedResponse } from "../_shared/auth.ts";
import { healthCheckResponse, checkEnvVars, createLogger } from "../_shared/utils.ts";
import { SERVICE_VERSIONS, REQUIRED_ENV_VARS } from "../_shared/constants.ts";

const log = createLogger('Report');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  action?: 'health';
  client_id?: string;
  report_type?: 'monthly' | 'weekly' | 'campaign';
  date_from?: string;
  date_to?: string;
  campaign_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ReportRequest = await req.json();
    
    // Health check endpoint
    if (body.action === 'health') {
      const envCheck = checkEnvVars(REQUIRED_ENV_VARS.CORE);
      return healthCheckResponse('generate-report', SERVICE_VERSIONS.GENERATE_REPORT, [envCheck]);
    }

    // Validate authentication
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    log.info('Generating report for user:', auth.user.id, 'client:', body.client_id);

    // Verify user has access to this client
    const { data: hasAccess } = await supabase.rpc('has_client_access', {
      _client_id: body.client_id,
      _user_id: auth.user.id
    });

    if (!hasAccess) {
      console.warn('[Report] Access denied for user:', auth.user.id, 'client:', body.client_id);
      return new Response(
        JSON.stringify({ error: 'Access denied to this client' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch client data
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', body.client_id)
      .single();

    if (!client) {
      throw new Error('Client not found');
    }

    // Fetch campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('client_id', body.client_id)
      .order('created_at', { ascending: false });

    // Fetch tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('client_id', body.client_id);

    // Fetch goals
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('client_id', body.client_id);

    // Calculate metrics
    const totalImpressions = campaigns?.reduce((sum, c) => sum + (c.impressions || 0), 0) || 0;
    const totalClicks = campaigns?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;
    const totalConversions = campaigns?.reduce((sum, c) => sum + (c.conversions || 0), 0) || 0;
    const totalSpent = campaigns?.reduce((sum, c) => sum + (c.spent || 0), 0) || 0;
    const totalBudget = campaigns?.reduce((sum, c) => sum + (c.budget || 0), 0) || 0;

    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
    const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0;
    const costPerClick = totalClicks > 0 ? (totalSpent / totalClicks).toFixed(2) : 0;
    const costPerConversion = totalConversions > 0 ? (totalSpent / totalConversions).toFixed(2) : 0;

    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;
    const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;

    // Platform breakdown
    const platformStats: Record<string, any> = {};
    campaigns?.forEach(c => {
      if (!platformStats[c.platform]) {
        platformStats[c.platform] = {
          campaigns: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spent: 0
        };
      }
      platformStats[c.platform].campaigns++;
      platformStats[c.platform].impressions += c.impressions || 0;
      platformStats[c.platform].clicks += c.clicks || 0;
      platformStats[c.platform].conversions += c.conversions || 0;
      platformStats[c.platform].spent += c.spent || 0;
    });

    // Goals progress
    const goalsProgress = goals?.map(g => ({
      name: g.name,
      target: g.target_value,
      current: g.current_value || 0,
      progress: g.target_value > 0 ? Math.round(((g.current_value || 0) / g.target_value) * 100) : 0,
      unit: g.unit,
      period: g.period
    }));

    const reportData = {
      generated_at: new Date().toISOString(),
      report_type: body.report_type,
      client: {
        name: client.name,
        industry: client.industry,
        website: client.website
      },
      period: {
        from: body.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: body.date_to || new Date().toISOString()
      },
      summary: {
        total_campaigns: campaigns?.length || 0,
        active_campaigns: campaigns?.filter(c => c.status === 'active').length || 0,
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        total_spent: totalSpent,
        total_budget: totalBudget,
        budget_utilization: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
      },
      performance: {
        ctr: parseFloat(ctr as string),
        conversion_rate: parseFloat(conversionRate as string),
        cost_per_click: parseFloat(costPerClick as string),
        cost_per_conversion: parseFloat(costPerConversion as string),
        roi: totalSpent > 0 ? ((totalConversions * 100 - totalSpent) / totalSpent * 100).toFixed(2) : 0
      },
      platforms: platformStats,
      tasks: {
        completed: completedTasks,
        in_progress: inProgressTasks,
        pending: pendingTasks,
        total: tasks?.length || 0,
        completion_rate: tasks?.length ? Math.round((completedTasks / tasks.length) * 100) : 0
      },
      goals: goalsProgress,
      campaigns: campaigns?.slice(0, 10).map(c => ({
        name: c.name,
        platform: c.platform,
        status: c.status,
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.conversions,
        spent: c.spent,
        budget: c.budget,
        ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : 0
      }))
    };

    console.log('[Report] Generated successfully');

    return new Response(
      JSON.stringify(reportData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Report] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
