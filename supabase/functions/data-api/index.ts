import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/').pop();
    const clientId = url.searchParams.get('client_id');

    console.log(`API Request: ${endpoint}, client_id: ${clientId}`);

    let data: any = null;

    switch (endpoint) {
      case 'dashboard': {
        // Get comprehensive dashboard data
        const [campaigns, tasks, goals] = await Promise.all([
          supabase.from('campaigns').select('*').eq(clientId ? 'client_id' : 'id', clientId || '').neq('id', ''),
          supabase.from('tasks').select('*').eq(clientId ? 'client_id' : 'id', clientId || '').neq('id', ''),
          supabase.from('goals').select('*').eq(clientId ? 'client_id' : 'id', clientId || '').neq('id', ''),
        ]);

        const campaignsData = clientId 
          ? (await supabase.from('campaigns').select('*').eq('client_id', clientId)).data || []
          : (await supabase.from('campaigns').select('*')).data || [];
        
        const tasksData = clientId 
          ? (await supabase.from('tasks').select('*').eq('client_id', clientId)).data || []
          : (await supabase.from('tasks').select('*')).data || [];

        const goalsData = clientId 
          ? (await supabase.from('goals').select('*').eq('client_id', clientId)).data || []
          : (await supabase.from('goals').select('*')).data || [];

        data = {
          summary: {
            totalCampaigns: campaignsData.length,
            activeCampaigns: campaignsData.filter((c: any) => c.status === 'active').length,
            totalBudget: campaignsData.reduce((sum: number, c: any) => sum + (c.budget || 0), 0),
            totalSpent: campaignsData.reduce((sum: number, c: any) => sum + (c.spent || 0), 0),
            totalImpressions: campaignsData.reduce((sum: number, c: any) => sum + (c.impressions || 0), 0),
            totalClicks: campaignsData.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0),
            totalConversions: campaignsData.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0),
            openTasks: tasksData.filter((t: any) => t.status !== 'completed').length,
            completedTasks: tasksData.filter((t: any) => t.status === 'completed').length,
          },
          campaigns: campaignsData,
          tasks: tasksData,
          goals: goalsData,
          generatedAt: new Date().toISOString(),
        };
        break;
      }

      case 'clients': {
        const { data: clients, error } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        data = clients;
        break;
      }

      case 'campaigns': {
        let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false });
        if (clientId) query = query.eq('client_id', clientId);
        const { data: campaigns, error } = await query;
        if (error) throw error;
        data = campaigns;
        break;
      }

      case 'tasks': {
        let query = supabase.from('tasks').select('*, team_members(name)').order('created_at', { ascending: false });
        if (clientId) query = query.eq('client_id', clientId);
        const { data: tasks, error } = await query;
        if (error) throw error;
        data = tasks;
        break;
      }

      case 'team': {
        const { data: team, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (error) throw error;
        data = team;
        break;
      }

      case 'analytics': {
        // Aggregate analytics data
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('platform, impressions, clicks, conversions, spent')
          .eq(clientId ? 'client_id' : 'id', clientId || '').neq('id', '');

        const campaignsData = clientId 
          ? (await supabase.from('campaigns').select('*').eq('client_id', clientId)).data || []
          : (await supabase.from('campaigns').select('*')).data || [];

        const byPlatform: Record<string, any> = {};
        campaignsData.forEach((c: any) => {
          if (!byPlatform[c.platform]) {
            byPlatform[c.platform] = { impressions: 0, clicks: 0, conversions: 0, spent: 0, count: 0 };
          }
          byPlatform[c.platform].impressions += c.impressions || 0;
          byPlatform[c.platform].clicks += c.clicks || 0;
          byPlatform[c.platform].conversions += c.conversions || 0;
          byPlatform[c.platform].spent += c.spent || 0;
          byPlatform[c.platform].count++;
        });

        data = {
          byPlatform,
          totals: {
            impressions: campaignsData.reduce((sum: number, c: any) => sum + (c.impressions || 0), 0),
            clicks: campaignsData.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0),
            conversions: campaignsData.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0),
            spent: campaignsData.reduce((sum: number, c: any) => sum + (c.spent || 0), 0),
          },
          generatedAt: new Date().toISOString(),
        };
        break;
      }

      case 'export': {
        // Full data export for client
        if (!clientId) throw new Error('client_id is required for export');
        
        const [client, campaigns, tasks, goals, personas, competitors, brandMessages] = await Promise.all([
          supabase.from('clients').select('*').eq('id', clientId).single(),
          supabase.from('campaigns').select('*').eq('client_id', clientId),
          supabase.from('tasks').select('*').eq('client_id', clientId),
          supabase.from('goals').select('*').eq('client_id', clientId),
          supabase.from('personas').select('*').eq('client_id', clientId),
          supabase.from('competitors').select('*').eq('client_id', clientId),
          supabase.from('brand_messages').select('*').eq('client_id', clientId),
        ]);

        data = {
          client: client.data,
          campaigns: campaigns.data,
          tasks: tasks.data,
          goals: goals.data,
          personas: personas.data,
          competitors: competitors.data,
          brandMessages: brandMessages.data,
          exportedAt: new Date().toISOString(),
        };
        break;
      }

      default:
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }

    console.log(`API Response for ${endpoint}: ${JSON.stringify(data).substring(0, 200)}...`);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API Error:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
