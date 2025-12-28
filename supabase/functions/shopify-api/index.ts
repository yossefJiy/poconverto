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

// Function to fetch ALL orders with pagination
async function fetchAllOrders(
  baseUrl: string,
  accessToken: string,
  dateFrom?: string,
  dateTo?: string
): Promise<any[]> {
  let allOrders: any[] = [];
  let hasNextPage = true;
  let pageInfo: string | null = null;
  let pageCount = 0;
  const maxPages = 20; // Safety limit
  
  while (hasNextPage && pageCount < maxPages) {
    let endpoint = `/orders.json?limit=250&status=any`;
    
    if (pageInfo) {
      // Use page_info for subsequent requests (Shopify cursor pagination)
      endpoint = `/orders.json?limit=250&page_info=${pageInfo}`;
    } else {
      // First request - use date filters
      if (dateFrom) endpoint += `&created_at_min=${dateFrom}`;
      if (dateTo) endpoint += `&created_at_max=${dateTo}`;
    }
    
    console.log(`[Shopify API] Fetching orders page ${pageCount + 1}: ${endpoint}`);
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`[Shopify API] Failed to fetch orders: ${response.status}`);
      break;
    }
    
    const data = await response.json();
    const orders = data.orders || [];
    allOrders = allOrders.concat(orders);
    
    console.log(`[Shopify API] Got ${orders.length} orders on page ${pageCount + 1}, total so far: ${allOrders.length}`);
    
    // Check for next page in Link header
    const linkHeader = response.headers.get('Link');
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<[^>]*page_info=([^>&]*)>; rel="next"/);
      if (nextMatch) {
        pageInfo = nextMatch[1];
        pageCount++;
      } else {
        hasNextPage = false;
      }
    } else {
      hasNextPage = false;
    }
    
    // If we got less than 250, we're done
    if (orders.length < 250) {
      hasNextPage = false;
    }
  }
  
  console.log(`[Shopify API] Total orders fetched: ${allOrders.length}`);
  return allOrders;
}

// Function to fetch analytics using GraphQL Analytics API
async function fetchShopifyAnalytics(
  storeDomain: string, 
  accessToken: string, 
  dateFrom: string, 
  dateTo: string
): Promise<{ sessions: number; visitors: number; conversionRate: number } | null> {
  const cleanDomain = storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const graphqlUrl = `https://${cleanDomain}/admin/api/2024-10/graphql.json`;
  
  // Format dates for ShopifyQL (YYYY-MM-DD)
  const fromDate = new Date(dateFrom).toISOString().split('T')[0];
  const toDate = new Date(dateTo).toISOString().split('T')[0];
  
  // Try using shopifyqlQuery first
  const shopifyqlQuery = `
    FROM sessions
    SHOW sessions, visitors, sessions_converted
    SINCE ${fromDate}
    UNTIL ${toDate}
  `;
  
  const graphqlQuery = `
    query {
      shopifyqlQuery(query: "${shopifyqlQuery.replace(/\n/g, ' ').replace(/"/g, '\\"').trim()}") {
        __typename
        ... on TableResponse {
          tableData {
            columns { name dataType }
            rowData
          }
        }
        parseErrors { code message }
      }
    }
  `;
  
  try {
    console.log('[Shopify API] Attempting ShopifyQL analytics query...');
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: graphqlQuery }),
    });
    
    if (!response.ok) {
      console.error('[Shopify API] GraphQL request failed:', response.status);
      return null;
    }
    
    const result = await response.json();
    
    if (result.errors) {
      console.log('[Shopify API] ShopifyQL not available (requires read_reports scope):', result.errors[0]?.message);
      return null;
    }
    
    const queryResult = result.data?.shopifyqlQuery;
    
    if (queryResult?.parseErrors?.length > 0) {
      console.error('[Shopify API] ShopifyQL parse errors:', queryResult.parseErrors);
      return null;
    }
    
    // Parse table response
    if (queryResult?.__typename === 'TableResponse' && queryResult.tableData) {
      const columns = queryResult.tableData.columns;
      const rows = queryResult.tableData.rowData || [];
      
      let totalSessions = 0;
      let totalVisitors = 0;
      let totalConverted = 0;
      
      const sessionsIdx = columns.findIndex((c: any) => c.name === 'sessions');
      const visitorsIdx = columns.findIndex((c: any) => c.name === 'visitors');
      const convertedIdx = columns.findIndex((c: any) => c.name === 'sessions_converted');
      
      for (const row of rows) {
        if (sessionsIdx >= 0 && row[sessionsIdx]) totalSessions += parseInt(row[sessionsIdx]) || 0;
        if (visitorsIdx >= 0 && row[visitorsIdx]) totalVisitors += parseInt(row[visitorsIdx]) || 0;
        if (convertedIdx >= 0 && row[convertedIdx]) totalConverted += parseInt(row[convertedIdx]) || 0;
      }
      
      const conversionRate = totalSessions > 0 ? (totalConverted / totalSessions) * 100 : 0;
      
      console.log(`[Shopify API] Real analytics: sessions=${totalSessions}, visitors=${totalVisitors}, conversionRate=${conversionRate.toFixed(2)}%`);
      
      return { sessions: totalSessions, visitors: totalVisitors, conversionRate };
    }
    
    return null;
  } catch (error) {
    console.error('[Shopify API] Analytics fetch error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
        JSON.stringify({ success: false, error: 'Shopify credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanDomain = storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const baseUrl = `https://${cleanDomain}/admin/api/2024-01`;

    const { action, product_id, limit = 50, page_info, date_from, date_to }: ShopifyRequest = await req.json();

    console.log(`[Shopify API] Request: ${action}`);

    if (action === 'get_analytics') {
      console.log(`[Shopify API] Fetching analytics from ${date_from} to ${date_to}`);
      
      // Fetch ALL orders with pagination
      const allOrders = await fetchAllOrders(baseUrl, accessToken, date_from, date_to);
      
      // Try to fetch real session data
      let analyticsData = null;
      if (date_from && date_to) {
        analyticsData = await fetchShopifyAnalytics(storeDomain, accessToken, date_from, date_to);
      }
      
      // Calculate analytics metrics using total_price (full price before refunds)
      const totalOrders = allOrders.length;
      const totalRevenue = allOrders.reduce((sum: number, o: any) => {
        // Use total_price for full revenue including refunded orders
        return sum + parseFloat(o.total_price || '0');
      }, 0);
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate items sold
      const totalItemsSold = allOrders.reduce((sum: number, o: any) => {
        return sum + (o.line_items || []).reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0);
      }, 0);
      
      // Unique customers
      const uniqueCustomers = new Set(allOrders.map((o: any) => o.email || o.customer?.email).filter(Boolean)).size;
      
      // Session data - only real data, no estimates
      let realSessions: number | null = analyticsData?.sessions || null;
      let realVisitors: number | null = analyticsData?.visitors || null;
      let conversionRate: string | null = null;
      let isRealSessionData = false;
      
      if (analyticsData && analyticsData.sessions > 0) {
        conversionRate = analyticsData.conversionRate.toFixed(2);
        isRealSessionData = true;
        console.log(`[Shopify API] Real analytics: sessions=${realSessions}, visitors=${realVisitors}, conversionRate=${conversionRate}%`);
      } else {
        console.log(`[Shopify API] No real session data - read_reports scope required`);
      }
      
      // Traffic sources
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
      
      // Order status breakdown
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
      
      console.log(`[Shopify API] Final: ${totalOrders} orders, ₪${totalRevenue.toFixed(2)} revenue`);
      
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
              sessions: realSessions,
              visitors: realVisitors,
              conversionRate,
              isRealSessionData,
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

    console.log(`[Shopify API] Calling: ${baseUrl}${endpoint}`);

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Shopify API] Error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ success: false, error: `Shopify API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    const linkHeader = response.headers.get('Link');
    let pagination = null;
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<[^>]*page_info=([^>&]*)>; rel="next"/);
      const prevMatch = linkHeader.match(/<[^>]*page_info=([^>&]*)>; rel="previous"/);
      pagination = { next: nextMatch?.[1] || null, previous: prevMatch?.[1] || null };
    }

    console.log(`[Shopify API] Success: ${action}`);

    return new Response(
      JSON.stringify({ success: true, data, pagination }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Shopify API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
