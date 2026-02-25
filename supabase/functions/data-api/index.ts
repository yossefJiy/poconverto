import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const isBridge = url.searchParams.get('bridge') === 'true';
    const type = url.searchParams.get('type');

    // === BRIDGE ENDPOINT: API-key based auth for cross-project sync ===
    if (isBridge) {
      const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key');
      const expectedKey = Deno.env.get('PRIVATE_API_KEY');
      
      if (!expectedKey) {
        return new Response(JSON.stringify({ error: 'PRIVATE_API_KEY not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (!apiKey || apiKey !== expectedKey) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      const tableMap: Record<string, string> = {
        clients: 'clients',
        leads: 'leads',
        tasks: 'tasks',
        contacts: 'client_contacts',
        team: 'team_members',
        projects: 'projects',
        campaigns: 'campaigns',
      };

      if (!type || !tableMap[type]) {
        return new Response(JSON.stringify({ error: 'Invalid type', validTypes: Object.keys(tableMap) }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const table = tableMap[type];

      if (req.method === 'POST') {
        const body = await req.json();
        if (!body.data) {
          return new Response(JSON.stringify({ error: 'Missing data' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        const { data, error } = await supabase.from(table).upsert(body.data, { onConflict: 'id' }).select();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // GET
      console.log(`[data-api/bridge] Fetching ${type}...`);
      const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      console.log(`[data-api/bridge] Got ${data?.length || 0} ${type} records`);
      return new Response(JSON.stringify({ success: true, data, count: data?.length || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // === STANDARD ENDPOINTS: Auth-based access ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: claimsData, error: claimsError } = await anonClient.auth.getUser();
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = claimsData.user.id;
    const clientId = url.searchParams.get('client_id');
    const endpoint = type || url.pathname.split('/').pop();

    console.log(`[Data API] Request: ${endpoint}, client_id: ${clientId}, user: ${userId}`);

    let data: unknown = null;

    switch (endpoint) {
      case 'dashboard': {
        const campaignsData = clientId 
          ? (await supabase.from('campaigns').select('*').eq('client_id', clientId)).data || []
          : (await supabase.from('campaigns').select('*')).data || [];
        const tasksData = clientId 
          ? (await supabase.from('tasks').select('*').eq('client_id', clientId)).data || []
          : (await supabase.from('tasks').select('*')).data || [];

        data = {
          summary: {
            totalCampaigns: campaignsData.length,
            activeCampaigns: campaignsData.filter((c: any) => c.status === 'active').length,
            totalBudget: campaignsData.reduce((sum: number, c: any) => sum + (c.budget || 0), 0),
            totalSpent: campaignsData.reduce((sum: number, c: any) => sum + (c.spent || 0), 0),
            openTasks: tasksData.filter((t: any) => t.status !== 'completed').length,
          },
          campaigns: campaignsData,
          tasks: tasksData,
          generatedAt: new Date().toISOString(),
        };
        break;
      }

      case 'clients': {
        const { data: clients, error } = await supabase
          .from('clients').select('*').order('created_at', { ascending: false });
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
        let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (clientId) query = query.eq('client_id', clientId);
        const { data: tasks, error } = await query;
        if (error) throw error;
        data = tasks;
        break;
      }

      case 'team': {
        const { data: team, error } = await supabase
          .from('team_members').select('*').eq('is_active', true).order('name');
        if (error) throw error;
        data = team;
        break;
      }

      default:
        data = { message: `Endpoint: ${endpoint}`, available: ['clients', 'campaigns', 'tasks', 'team', 'dashboard'] };
    }

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
