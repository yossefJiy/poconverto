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

// Helper to extract YYYY-MM-DD from various date formats
function extractDateOnly(dateStr: string): string {
  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  // Extract date part from ISO string or other formats
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  // Fallback: try to parse and format
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
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
  
  // Convert dates to date-only format for Shopify (YYYY-MM-DD)
  const fromDateClean = dateFrom ? extractDateOnly(dateFrom) : null;
  const toDateClean = dateTo ? extractDateOnly(dateTo) : null;
  
  console.log(`[Shopify API] Date range: ${fromDateClean} to ${toDateClean}`);
  
  while (hasNextPage && pageCount < maxPages) {
    let endpoint = `/orders.json?limit=250&status=any`;
    
    if (pageInfo) {
      // Use page_info for subsequent requests (Shopify cursor pagination)
      endpoint = `/orders.json?limit=250&page_info=${pageInfo}`;
    } else {
      // First request - use date filters with proper timezone handling
      // Shopify expects ISO format, but we want the full day in shop's timezone
      if (fromDateClean) endpoint += `&created_at_min=${fromDateClean}T00:00:00`;
      if (toDateClean) endpoint += `&created_at_max=${toDateClean}T23:59:59`;
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

// Function to fetch analytics using GraphQL Analytics API (ShopifyQL)
async function fetchShopifyAnalytics(
  storeDomain: string, 
  accessToken: string, 
  dateFrom: string, 
  dateTo: string
): Promise<{ sessions: number; visitors: number; conversionRate: number; totalSales: number | null } | null> {
  const cleanDomain = storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const graphqlUrl = `https://${cleanDomain}/admin/api/2024-10/graphql.json`;
  
  // Format dates for ShopifyQL (YYYY-MM-DD)
  const fromDate = extractDateOnly(dateFrom);
  const toDate = extractDateOnly(dateTo);
  
  console.log(`[Shopify API] ShopifyQL date range: ${fromDate} to ${toDate}`);
  
  // Query for sessions data
  const sessionsQuery = `
    FROM sessions
    SHOW sessions, visitors, sessions_converted
    SINCE ${fromDate}
    UNTIL ${toDate}
  `;
  
  // Query for total_sales (matches "Total sales over time" in Shopify dashboard)
  const salesQuery = `
    FROM sales
    SHOW total_sales
    SINCE ${fromDate}
    UNTIL ${toDate}
  `;
  
  const makeQuery = async (shopifyqlQuery: string) => {
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
    
    return response.json();
  };
  
  try {
    console.log('[Shopify API] Attempting ShopifyQL queries...');
    
    // Execute both queries in parallel
    const [sessionsResult, salesResult] = await Promise.all([
      makeQuery(sessionsQuery),
      makeQuery(salesQuery)
    ]);
    
    let totalSessions = 0;
    let totalVisitors = 0;
    let totalConverted = 0;
    let totalSales: number | null = null;
    
    // Parse sessions result
    if (sessionsResult?.data?.shopifyqlQuery?.__typename === 'TableResponse') {
      const tableData = sessionsResult.data.shopifyqlQuery.tableData;
      const columns = tableData?.columns || [];
      const rows = tableData?.rowData || [];
      
      const sessionsIdx = columns.findIndex((c: any) => c.name === 'sessions');
      const visitorsIdx = columns.findIndex((c: any) => c.name === 'visitors');
      const convertedIdx = columns.findIndex((c: any) => c.name === 'sessions_converted');
      
      for (const row of rows) {
        if (sessionsIdx >= 0 && row[sessionsIdx]) totalSessions += parseInt(row[sessionsIdx]) || 0;
        if (visitorsIdx >= 0 && row[visitorsIdx]) totalVisitors += parseInt(row[visitorsIdx]) || 0;
        if (convertedIdx >= 0 && row[convertedIdx]) totalConverted += parseInt(row[convertedIdx]) || 0;
      }
      
      console.log(`[Shopify API] Sessions data: sessions=${totalSessions}, visitors=${totalVisitors}, converted=${totalConverted}`);
    } else if (sessionsResult?.errors) {
      console.log('[Shopify API] Sessions query error:', sessionsResult.errors[0]?.message);
    }
    
    // Parse sales result
    if (salesResult?.data?.shopifyqlQuery?.__typename === 'TableResponse') {
      const tableData = salesResult.data.shopifyqlQuery.tableData;
      const columns = tableData?.columns || [];
      const rows = tableData?.rowData || [];
      
      const salesIdx = columns.findIndex((c: any) => c.name === 'total_sales');
      
      totalSales = 0;
      for (const row of rows) {
        if (salesIdx >= 0 && row[salesIdx]) {
          // total_sales can be formatted like "₪1,234.56" or just a number
          const value = row[salesIdx].toString().replace(/[^\d.-]/g, '');
          totalSales += parseFloat(value) || 0;
        }
      }
      
      console.log(`[Shopify API] ShopifyQL Total Sales: ₪${totalSales.toFixed(2)}`);
    } else if (salesResult?.errors) {
      console.log('[Shopify API] Sales query error:', salesResult.errors[0]?.message);
    } else if (salesResult?.data?.shopifyqlQuery?.parseErrors) {
      console.log('[Shopify API] Sales query parse error:', salesResult.data.shopifyqlQuery.parseErrors);
    }
    
    const conversionRate = totalSessions > 0 ? (totalConverted / totalSessions) * 100 : 0;
    
    console.log(`[Shopify API] Analytics summary: sessions=${totalSessions}, visitors=${totalVisitors}, conversionRate=${conversionRate.toFixed(2)}%, totalSales=${totalSales}`);
    
    return { sessions: totalSessions, visitors: totalVisitors, conversionRate, totalSales };
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
      
      // Calculate ALL revenue metrics for comparison
      // Note: Shopify "Total sales over time" typically uses ALL orders including cancelled
      
      console.log(`[Shopify API] Total orders fetched: ${allOrders.length}`);
      
      // Log sample order to see available fields
      if (allOrders.length > 0) {
        const sample = allOrders[0];
        console.log(`[Shopify API] Sample order: subtotal=${sample.subtotal_price}, total=${sample.total_price}, current_subtotal=${sample.current_subtotal_price}, current_total=${sample.current_total_price}, cancelled=${sample.cancelled_at}, financial_status=${sample.financial_status}`);
      }
      
      // Different order sets for different calculations
      const notCancelledOrders = allOrders.filter((o: any) => o.cancelled_at === null);
      const cancelledOrders = allOrders.filter((o: any) => o.cancelled_at !== null);
      
      console.log(`[Shopify API] Order breakdown: ${notCancelledOrders.length} active, ${cancelledOrders.length} cancelled`);
      
      // Calculate ALL possible revenue metrics
      const allOrdersSubtotal = allOrders.reduce((sum: number, o: any) => sum + parseFloat(o.subtotal_price || '0'), 0);
      const allOrdersTotal = allOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
      const notCancelledSubtotal = notCancelledOrders.reduce((sum: number, o: any) => sum + parseFloat(o.subtotal_price || '0'), 0);
      const notCancelledTotal = notCancelledOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total_price || '0'), 0);
      const currentSubtotal = notCancelledOrders.reduce((sum: number, o: any) => sum + parseFloat(o.current_subtotal_price || o.subtotal_price || '0'), 0);
      const currentTotal = notCancelledOrders.reduce((sum: number, o: any) => sum + parseFloat(o.current_total_price || o.total_price || '0'), 0);
      
      // Calculate with VAT (17%)
      const VAT_RATE = 1.17;
      const allOrdersSubtotalWithVat = allOrdersSubtotal * VAT_RATE;
      const notCancelledSubtotalWithVat = notCancelledSubtotal * VAT_RATE;
      
      console.log(`[Shopify API] === REVENUE COMPARISON ===`);
      console.log(`  ALL orders (incl cancelled) - subtotal: ₪${allOrdersSubtotal.toFixed(2)}, total: ₪${allOrdersTotal.toFixed(2)}`);
      console.log(`  NOT cancelled - subtotal: ₪${notCancelledSubtotal.toFixed(2)}, total: ₪${notCancelledTotal.toFixed(2)}`);
      console.log(`  CURRENT (after refunds) - subtotal: ₪${currentSubtotal.toFixed(2)}, total: ₪${currentTotal.toFixed(2)}`);
      console.log(`  === WITH 17% VAT ===`);
      console.log(`  ALL orders subtotal + 17% VAT: ₪${allOrdersSubtotalWithVat.toFixed(2)}`);
      console.log(`  NOT cancelled subtotal + 17% VAT: ₪${notCancelledSubtotalWithVat.toFixed(2)}`);
      if (analyticsData?.totalSales !== null) {
        console.log(`  ShopifyQL total_sales: ₪${analyticsData?.totalSales?.toFixed(2)}`);
      }
      
      // Use ShopifyQL total_sales if available, otherwise fall back to order-based calculation
      const totalOrders = notCancelledOrders.length;
      const totalRevenue = analyticsData?.totalSales ?? notCancelledSubtotalWithVat;
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
      const paidOrdersCount = allOrders.filter((o: any) => o.financial_status === 'paid').length;
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
              paid: paidOrdersCount,
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
