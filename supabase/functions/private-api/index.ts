import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

console.log('[private-api] Function loaded');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('PRIVATE_API_KEY');
    
    if (!expectedKey) {
      console.error('[private-api] PRIVATE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!apiKey || apiKey !== expectedKey) {
      console.error('[private-api] Invalid or missing API key');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const type = url.searchParams.get('type');

    const validTypes = ['clients', 'leads', 'tasks', 'contacts', 'team', 'projects'];
    if (!type || !validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid type', validTypes }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const tableMap: Record<string, { table: string; orderBy: string; ascending: boolean }> = {
      clients: { table: 'clients', orderBy: 'created_at', ascending: false },
      leads: { table: 'leads', orderBy: 'created_at', ascending: false },
      tasks: { table: 'tasks', orderBy: 'created_at', ascending: false },
      contacts: { table: 'client_contacts', orderBy: 'created_at', ascending: false },
      team: { table: 'team', orderBy: 'name', ascending: true },
      projects: { table: 'projects', orderBy: 'created_at', ascending: false },
    };

    const config = tableMap[type];

    if (req.method === 'GET') {
      console.log(`[private-api] Fetching ${type}...`);
      const { data, error } = await supabase
        .from(config.table)
        .select('*')
        .order(config.orderBy, { ascending: config.ascending });
      
      if (error) throw error;
      
      console.log(`[private-api] Got ${data?.length || 0} ${type} records`);
      return new Response(JSON.stringify({ success: true, data, count: data?.length || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      if (!body.data) {
        return new Response(JSON.stringify({ error: 'Missing data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const { data: result, error } = await supabase
        .from(config.table)
        .upsert(body.data, { onConflict: 'id' })
        .select();
      
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true, data: result, count: result?.length || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[private-api] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
