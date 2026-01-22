import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API Key
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('PRIVATE_API_KEY');
    
    if (!expectedKey) {
      console.error('PRIVATE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!apiKey || apiKey !== expectedKey) {
      console.error('Invalid or missing API key');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const type = url.searchParams.get('type');

    // Validate type parameter
    const validTypes = ['clients', 'leads', 'tasks'];
    if (!type || !validTypes.includes(type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid or missing type parameter',
        validTypes 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET - Read data from this project
    if (req.method === 'GET') {
      console.log(`Fetching ${type} data...`);
      
      const { data, error } = await supabase.from(type).select('*');
      
      if (error) {
        console.error(`Error fetching ${type}:`, error);
        throw error;
      }
      
      console.log(`Successfully fetched ${data?.length || 0} ${type} records`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        data,
        count: data?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST - Write data to this project
    if (req.method === 'POST') {
      const body = await req.json();
      
      if (!body.data) {
        return new Response(JSON.stringify({ error: 'Missing data in request body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      console.log(`Upserting data to ${type}...`);
      
      const { data: result, error } = await supabase
        .from(type)
        .upsert(body.data, { onConflict: 'id' })
        .select();
      
      if (error) {
        console.error(`Error upserting ${type}:`, error);
        throw error;
      }
      
      console.log(`Successfully upserted ${result?.length || 0} ${type} records`);
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: result,
        count: result?.length || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Unsupported method
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error in private-api:', error);
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
