import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_URL = 'https://lakfzxdipczsjlkcadul.supabase.co/functions/v1/private-api';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const privateApiKey = Deno.env.get('PRIVATE_API_KEY');
    
    if (!privateApiKey) {
      throw new Error('PRIVATE_API_KEY not configured');
    }

    const headers = {
      'X-API-Key': privateApiKey,
      'Content-Type': 'application/json'
    };

    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // clients, leads, tasks
    const action = url.searchParams.get('action'); // read, write

    // POST request - write data to external system
    if (req.method === 'POST') {
      const body = await req.json();
      const dataType = body.type || type || 'clients';
      
      const response = await fetch(`${API_URL}?type=${dataType}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: body.data })
      });
      
      const result = await response.json();
      
      return new Response(JSON.stringify({
        success: true,
        data: result.data,
        message: `Data written to ${dataType}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET request - fetch data from external system
    if (type) {
      // Fetch specific type
      const response = await fetch(`${API_URL}?type=${type}`, { headers });
      const result = await response.json();
      
      return new Response(JSON.stringify({
        success: true,
        type,
        data: result.data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch all data types
    const [clientsRes, leadsRes, tasksRes] = await Promise.all([
      fetch(`${API_URL}?type=clients`, { headers }),
      fetch(`${API_URL}?type=leads`, { headers }),
      fetch(`${API_URL}?type=tasks`, { headers })
    ]);

    const [clients, leads, tasks] = await Promise.all([
      clientsRes.json(),
      leadsRes.json(),
      tasksRes.json()
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
    console.error('Error in fetch-external:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
