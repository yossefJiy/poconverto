import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
    position: number;
  }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    sku: string | null;
    inventory_quantity: number;
    inventory_management: string | null;
  }>;
  tags: string;
}

interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  created_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
    sku: string | null;
  }>;
}

interface ShopifyShop {
  id: number;
  name: string;
  email: string;
  domain: string;
  myshopify_domain: string;
  currency: string;
  money_format: string;
  plan_name: string;
  shop_owner: string;
}

interface ShopifyAnalytics {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    totalItemsSold: number;
    uniqueCustomers: number;
    estimatedSessions: number;
    conversionRate: string;
  };
  orderStatus: {
    paid: number;
    fulfilled: number;
    pending: number;
    refunded: number;
  };
  trafficSources: Array<{
    source: string;
    orders: number;
    percentage: string;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  orders: ShopifyOrder[];
}

interface ShopifyDataResult {
  products: ShopifyProduct[];
  orders: ShopifyOrder[];
  shop: ShopifyShop | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

async function callShopifyApi(action: string, params: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke('shopify-api', {
    body: { action, ...params }
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error || 'Shopify API error');
  
  return data.data;
}

export function useShopifyData(): ShopifyDataResult {
  const { 
    data: shopData, 
    isLoading: isLoadingShop,
    isError: isShopError,
    error: shopError,
  } = useQuery({
    queryKey: ['shopify-shop'],
    queryFn: () => callShopifyApi('get_shop'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const { 
    data: productsData, 
    isLoading: isLoadingProducts,
    isError: isProductsError,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['shopify-products'],
    queryFn: () => callShopifyApi('get_products', { limit: 250 }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  const { 
    data: ordersData, 
    isLoading: isLoadingOrders,
    isError: isOrdersError,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['shopify-orders'],
    queryFn: () => callShopifyApi('get_orders', { limit: 50 }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });

  const refetch = () => {
    refetchProducts();
    refetchOrders();
  };

  return {
    products: productsData?.products || [],
    orders: ordersData?.orders || [],
    shop: shopData?.shop || null,
    isLoading: isLoadingShop || isLoadingProducts || isLoadingOrders,
    isError: isShopError || isProductsError || isOrdersError,
    error: shopError || productsError || ordersError,
    refetch,
  };
}

export function useShopifyAnalytics(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['shopify-analytics', dateFrom, dateTo],
    queryFn: () => callShopifyApi('get_analytics', { 
      date_from: dateFrom, 
      date_to: dateTo 
    }),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

export function useShopifyProducts(limit = 50) {
  return useQuery({
    queryKey: ['shopify-products', limit],
    queryFn: () => callShopifyApi('get_products', { limit }),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

export function useShopifyOrders(limit = 50) {
  return useQuery({
    queryKey: ['shopify-orders', limit],
    queryFn: () => callShopifyApi('get_orders', { limit }),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

export function useShopifyShop() {
  return useQuery({
    queryKey: ['shopify-shop'],
    queryFn: () => callShopifyApi('get_shop'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
