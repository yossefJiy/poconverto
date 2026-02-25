const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// The external project's data-bridge endpoint
const API_URL = 'https://lakfzxdipczsjlkcadul.supabase.co/functions/v1/data-bridge';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const privateApiKey = Deno.env.get('PRIVATE_API_KEY');
    if (!privateApiKey) {
      throw new Error('PRIVATE_API_KEY not configured');
    }

    const fetchHeaders = {
      'X-API-Key': privateApiKey,
      'Content-Type': 'application/json'
    };

    const url = new URL(req.url);
    const type = url.searchParams.get('type');

    if (req.method === 'POST') {
      const body = await req.json();
      const dataType = body.type || type || 'clients';
      const response = await fetch(`${API_URL}?type=${dataType}`, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({ data: body.data })
      });
      const result = await response.json();
      return new Response(JSON.stringify({ success: true, data: result.data, message: `Data written to ${dataType}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (type) {
      const response = await fetch(`${API_URL}?type=${type}`, { headers: fetchHeaders });
      const result = await response.json();
      return new Response(JSON.stringify({ success: true, type, data: result.data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch all
    const [clientsRes, leadsRes, tasksRes] = await Promise.all([
      fetch(`${API_URL}?type=clients`, { headers: fetchHeaders }),
      fetch(`${API_URL}?type=leads`, { headers: fetchHeaders }),
      fetch(`${API_URL}?type=tasks`, { headers: fetchHeaders })
    ]);
    const [clients, leads, tasks] = await Promise.all([
      clientsRes.json(), leadsRes.json(), tasksRes.json()
    ]);

    return new Response(JSON.stringify({
      success: true,
      clients: clients.data,
      leads: leads.data,
      tasks: tasks.data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
