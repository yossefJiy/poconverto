import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyRequest {
  action: 'get_products' | 'get_product' | 'get_orders' | 'get_inventory' | 'test_connection' | 'get_shop';
  product_id?: string;
  limit?: number;
  page_info?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN');
    const storeDomain = Deno.env.get('SHOPIFY_STORE_DOMAIN');

    if (!accessToken || !storeDomain) {
      console.error('Missing Shopify credentials');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Shopify credentials not configured' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up store domain (remove protocol and trailing slashes)
    const cleanDomain = storeDomain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    
    const baseUrl = `https://${cleanDomain}/admin/api/2024-01`;

    const { action, product_id, limit = 50, page_info }: ShopifyRequest = await req.json();

    console.log(`Shopify API request: ${action}`);

    let endpoint = '';
    let method = 'GET';

    switch (action) {
      case 'test_connection':
      case 'get_shop':
        endpoint = '/shop.json';
        break;
      case 'get_products':
        endpoint = `/products.json?limit=${limit}${page_info ? `&page_info=${page_info}` : ''}`;
        break;
      case 'get_product':
        if (!product_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Product ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `/products/${product_id}.json`;
        break;
      case 'get_orders':
        endpoint = `/orders.json?limit=${limit}&status=any`;
        break;
      case 'get_inventory':
        endpoint = `/inventory_levels.json?limit=${limit}`;
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Calling Shopify API: ${baseUrl}${endpoint}`);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Shopify API error: ${response.status}`,
          details: errorText
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Extract pagination info from Link header
    const linkHeader = response.headers.get('Link');
    let pagination = null;
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<[^>]*page_info=([^>&]*)>; rel="next"/);
      const prevMatch = linkHeader.match(/<[^>]*page_info=([^>&]*)>; rel="previous"/);
      pagination = {
        next: nextMatch ? nextMatch[1] : null,
        previous: prevMatch ? prevMatch[1] : null,
      };
    }

    console.log(`Shopify API success: ${action}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        pagination 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Shopify API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
