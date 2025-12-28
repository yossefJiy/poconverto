import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateAuth, unauthorizedResponse } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyRequest {
  action: 'get_products' | 'get_product' | 'get_orders' | 'get_inventory' | 'test_connection' | 'get_shop' | 'get_analytics';
  product_id?: string;
  limit?: number;
  page_info?: string;
  date_from?: string;
  date_to?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user authentication
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      console.error('[Shopify API] Auth failed:', auth.error);
      return unauthorizedResponse(auth.error);
    }
    console.log('[Shopify API] Authenticated user:', auth.user.id);

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

    const { action, product_id, limit = 50, page_info, date_from, date_to }: ShopifyRequest = await req.json();

    console.log(`Shopify API request: ${action}`);

    // For analytics, we need to fetch orders and calculate metrics
    if (action === 'get_analytics') {
      console.log(`Fetching analytics data from ${date_from} to ${date_to}`);
      
      // Fetch all orders for the date range
      let allOrders: any[] = [];
      let ordersEndpoint = `/orders.json?limit=250&status=any`;
      if (date_from) ordersEndpoint += `&created_at_min=${date_from}`;
      if (date_to) ordersEndpoint += `&created_at_max=${date_to}`;
      
      const ordersResponse = await fetch(`${baseUrl}${ordersEndpoint}`, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        allOrders = ordersData.orders || [];
      }
      
      // Calculate analytics metrics
      // Use current_total_price which reflects the actual paid amount after refunds/discounts
      const totalOrders = allOrders.length;
      const totalRevenue = allOrders.reduce((sum: number, o: any) => sum + parseFloat(o.current_total_price || o.total_price || '0'), 0);
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate items sold
      const totalItemsSold = allOrders.reduce((sum: number, o: any) => {
        return sum + (o.line_items || []).reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0);
      }, 0);
      
      // Get unique customers
      const uniqueCustomers = new Set(allOrders.map((o: any) => o.email || o.customer?.email).filter(Boolean)).size;
      
      // Calculate conversion rate (orders / sessions estimate based on typical 2% conversion)
      // Note: Shopify doesn't provide session data via Admin API, this is an estimate
      const estimatedSessions = Math.round(totalOrders / 0.02);
      const conversionRate = totalOrders > 0 ? (totalOrders / estimatedSessions) * 100 : 0;
      
      // Analyze traffic sources from UTM parameters and referring sites
      const trafficSources: Record<string, number> = {};
      allOrders.forEach((order: any) => {
        const source = order.source_name || order.referring_site || 'direct';
        const sourceName = source.includes('google') ? 'Google' 
          : source.includes('facebook') || source.includes('fb') ? 'Facebook'
          : source.includes('instagram') ? 'Instagram'
          : source.includes('email') ? 'Email'
          : source === 'web' || source === 'direct' ? 'Direct'
          : 'Other';
        trafficSources[sourceName] = (trafficSources[sourceName] || 0) + 1;
      });
      
      // Financial status breakdown
      const paidOrders = allOrders.filter((o: any) => o.financial_status === 'paid').length;
      const fulfilledOrders = allOrders.filter((o: any) => o.fulfillment_status === 'fulfilled').length;
      const pendingOrders = allOrders.filter((o: any) => o.financial_status === 'pending').length;
      const refundedOrders = allOrders.filter((o: any) => o.financial_status === 'refunded').length;
      
      // Top products
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      allOrders.forEach((order: any) => {
        (order.line_items || []).forEach((item: any) => {
          const key = item.product_id?.toString() || item.title;
          if (!productSales[key]) {
            productSales[key] = { name: item.title, quantity: 0, revenue: 0 };
          }
          productSales[key].quantity += item.quantity || 0;
          productSales[key].revenue += parseFloat(item.price || '0') * (item.quantity || 0);
        });
      });
      
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      console.log(`Analytics calculated: ${totalOrders} orders, ${totalRevenue} revenue`);
      
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            summary: {
              totalOrders,
              totalRevenue,
              avgOrderValue,
              totalItemsSold,
              uniqueCustomers,
              estimatedSessions,
              conversionRate: conversionRate.toFixed(2),
            },
            orderStatus: {
              paid: paidOrders,
              fulfilled: fulfilledOrders,
              pending: pendingOrders,
              refunded: refundedOrders,
            },
            trafficSources: Object.entries(trafficSources).map(([source, count]) => ({
              source,
              orders: count,
              percentage: totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : '0',
            })),
            topProducts,
            orders: allOrders,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
