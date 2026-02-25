import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const url = new URL(req.url);
    const type = url.searchParams.get('type');

    const tableMap: Record<string, string> = {
      clients: 'clients',
      leads: 'leads',
      tasks: 'tasks',
      contacts: 'client_contacts',
      team: 'team_members',
      campaigns: 'campaigns',
    };

    if (req.method === 'POST') {
      const body = await req.json();
      const dataType = body.type || type || 'clients';
      if (!tableMap[dataType]) {
        return new Response(JSON.stringify({ error: 'Invalid type', validTypes: Object.keys(tableMap) }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      const { data, error } = await supabase.from(tableMap[dataType]).upsert(body.data, { onConflict: 'id' }).select();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (type && tableMap[type]) {
      const { data, error } = await supabase.from(tableMap[type]).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, type, data, count: data?.length || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const [c, l, t] = await Promise.all([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    ]);

    return new Response(JSON.stringify({
      success: true, clients: c.data, leads: l.data, tasks: t.data,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
