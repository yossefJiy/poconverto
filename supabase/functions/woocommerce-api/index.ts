import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateAuth, unauthorizedResponse } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WooCommerceRequest {
  action: 'get_analytics' | 'get_orders' | 'get_products' | 'get_customers' | 'sync_all';
  client_id: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

interface WooCommerceCredentials {
  store_url: string;
  consumer_key: string;
  consumer_secret: string;
}

async function getWooCommerceCredentials(supabaseClient: any, clientId: string): Promise<WooCommerceCredentials | null> {
  console.log('[WooCommerce] Fetching credentials for client:', clientId);
  
  const { data: integration, error } = await supabaseClient
    .from('integrations')
    .select('encrypted_credentials, settings')
    .eq('client_id', clientId)
    .eq('platform', 'woocommerce')
    .eq('is_connected', true)
    .maybeSingle();
  
  if (error || !integration) {
    console.error('[WooCommerce] No integration found:', error);
    return null;
  }
  
  // Decrypt credentials
  if (integration.encrypted_credentials) {
    const { data: decrypted, error: decryptError } = await supabaseClient
      .rpc('decrypt_integration_credentials', { encrypted_data: integration.encrypted_credentials });
    
    if (decryptError) {
      console.error('[WooCommerce] Decryption error:', decryptError);
      return null;
    }
    
    return {
      store_url: integration.settings?.store_url || '',
      consumer_key: decrypted?.consumer_key || '',
      consumer_secret: decrypted?.consumer_secret || '',
    };
  }
  
  return null;
}

async function wooCommerceRequest(
  credentials: WooCommerceCredentials,
  endpoint: string,
  params: Record<string, string> = {}
): Promise<any> {
  const cleanUrl = credentials.store_url.replace(/\/$/, '');
  const queryParams = new URLSearchParams(params).toString();
  const url = `${cleanUrl}/wp-json/wc/v3/${endpoint}${queryParams ? '?' + queryParams : ''}`;
  
  const authString = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`);
  
  console.log('[WooCommerce] Making request to:', endpoint);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[WooCommerce] API error:', response.status, errorText);
    throw new Error(`WooCommerce API error: ${response.status}`);
  }
  
  return response.json();
}

async function getOrders(credentials: WooCommerceCredentials, startDate?: string, endDate?: string, page = 1, perPage = 50) {
  const params: Record<string, string> = {
    page: page.toString(),
    per_page: perPage.toString(),
    orderby: 'date',
    order: 'desc',
  };
  
  if (startDate) params.after = new Date(startDate).toISOString();
  if (endDate) params.before = new Date(endDate).toISOString();
  
  return wooCommerceRequest(credentials, 'orders', params);
}

async function getProducts(credentials: WooCommerceCredentials, page = 1, perPage = 50) {
  return wooCommerceRequest(credentials, 'products', {
    page: page.toString(),
    per_page: perPage.toString(),
    status: 'publish',
  });
}

async function getCustomers(credentials: WooCommerceCredentials, page = 1, perPage = 50) {
  return wooCommerceRequest(credentials, 'customers', {
    page: page.toString(),
    per_page: perPage.toString(),
    orderby: 'registered_date',
    order: 'desc',
  });
}

async function getReports(credentials: WooCommerceCredentials, startDate?: string, endDate?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.date_min = startDate;
  if (endDate) params.date_max = endDate;
  
  try {
    const [salesReport, topSellers] = await Promise.all([
      wooCommerceRequest(credentials, 'reports/sales', params),
      wooCommerceRequest(credentials, 'reports/top_sellers', { period: 'month' }),
    ]);
    
    return { salesReport, topSellers };
  } catch (error) {
    console.error('[WooCommerce] Reports error:', error);
    return { salesReport: [], topSellers: [] };
  }
}

async function getAnalytics(credentials: WooCommerceCredentials, startDate?: string, endDate?: string) {
  console.log('[WooCommerce] Fetching analytics from', startDate, 'to', endDate);
  
  // Fetch orders for the period
  const orders = await getOrders(credentials, startDate, endDate, 1, 100);
  
  // Calculate metrics from orders
  let totalRevenue = 0;
  let totalOrders = orders.length;
  let totalItems = 0;
  const statusCounts: Record<string, number> = {};
  const dailySales: Record<string, { revenue: number; orders: number }> = {};
  
  for (const order of orders) {
    const orderTotal = parseFloat(order.total || '0');
    totalRevenue += orderTotal;
    totalItems += order.line_items?.length || 0;
    
    // Count by status
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    
    // Daily breakdown
    const orderDate = order.date_created?.split('T')[0];
    if (orderDate) {
      if (!dailySales[orderDate]) {
        dailySales[orderDate] = { revenue: 0, orders: 0 };
      }
      dailySales[orderDate].revenue += orderTotal;
      dailySales[orderDate].orders += 1;
    }
  }
  
  // Get product and customer counts
  const products = await getProducts(credentials, 1, 1);
  const customers = await getCustomers(credentials, 1, 1);
  
  // Calculate average order value
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Get top products from orders
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const order of orders) {
    for (const item of order.line_items || []) {
      const key = item.product_id?.toString() || item.name;
      if (!productSales[key]) {
        productSales[key] = { name: item.name, quantity: 0, revenue: 0 };
      }
      productSales[key].quantity += item.quantity || 0;
      productSales[key].revenue += parseFloat(item.total || '0');
    }
  }
  
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  
  return {
    summary: {
      totalRevenue,
      totalOrders,
      totalItems,
      averageOrderValue,
      currency: orders[0]?.currency || 'ILS',
    },
    statusBreakdown: statusCounts,
    dailySales: Object.entries(dailySales).map(([date, data]) => ({
      date,
      ...data,
    })).sort((a, b) => a.date.localeCompare(b.date)),
    topProducts,
    recentOrders: orders.slice(0, 10).map((order: any) => ({
      id: order.id,
      number: order.number,
      status: order.status,
      total: order.total,
      currency: order.currency,
      customer: order.billing?.first_name + ' ' + order.billing?.last_name,
      date: order.date_created,
      items: order.line_items?.length || 0,
    })),
  };
}

async function syncAllData(supabaseClient: any, clientId: string, credentials: WooCommerceCredentials) {
  console.log('[WooCommerce] Starting full sync for client:', clientId);
  
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];
  
  const analytics = await getAnalytics(credentials, startDate, endDate);
  
  // Save snapshot to database
  const { error: snapshotError } = await supabaseClient
    .from('analytics_snapshots')
    .upsert({
      client_id: clientId,
      platform: 'woocommerce',
      snapshot_date: endDate,
      metrics: {
        totalRevenue: analytics.summary.totalRevenue,
        totalOrders: analytics.summary.totalOrders,
        averageOrderValue: analytics.summary.averageOrderValue,
      },
      data: analytics,
    }, {
      onConflict: 'client_id,platform,snapshot_date',
    });
  
  if (snapshotError) {
    console.error('[WooCommerce] Snapshot save error:', snapshotError);
  }
  
  // Update last sync time
  await supabaseClient
    .from('integrations')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('client_id', clientId)
    .eq('platform', 'woocommerce');
  
  return analytics;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      console.error('[WooCommerce] Auth failed:', auth.error);
      return unauthorizedResponse(auth.error);
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, client_id, start_date, end_date, page, per_page } = await req.json() as WooCommerceRequest;

    console.log(`[WooCommerce] Action: ${action} for client: ${client_id}`);

    // Get WooCommerce credentials
    const credentials = await getWooCommerceCredentials(supabaseClient, client_id);
    
    if (!credentials) {
      return new Response(
        JSON.stringify({ success: false, error: 'WooCommerce לא מחובר ללקוח זה' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;
    
    switch (action) {
      case 'get_analytics':
        result = await getAnalytics(credentials, start_date, end_date);
        break;
        
      case 'get_orders':
        result = await getOrders(credentials, start_date, end_date, page || 1, per_page || 50);
        break;
        
      case 'get_products':
        result = await getProducts(credentials, page || 1, per_page || 50);
        break;
        
      case 'get_customers':
        result = await getCustomers(credentials, page || 1, per_page || 50);
        break;
        
      case 'sync_all':
        result = await syncAllData(supabaseClient, client_id, credentials);
        break;
        
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'פעולה לא מוכרת' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[WooCommerce] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
