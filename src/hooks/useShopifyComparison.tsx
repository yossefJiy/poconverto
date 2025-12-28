import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ComparisonData {
  current: {
    totalOrders: number;
    totalRevenue: number;
    grossSales: number;
    netSales: number;
    discounts: number;
    returns: number;
    taxes: number;
    shipping: number;
  };
  previous: {
    totalOrders: number;
    totalRevenue: number;
    grossSales: number;
    netSales: number;
    discounts: number;
    returns: number;
    taxes: number;
    shipping: number;
  };
  changes: {
    orders: number;
    revenue: number;
    grossSales: number;
    netSales: number;
  };
}

async function callShopifyApi(action: string, params: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke('shopify-api', {
    body: { action, ...params }
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error || 'Shopify API error');
  
  return data.data;
}

// Calculate previous period dates based on current period
function getPreviousPeriodDates(dateFrom: string, dateTo: string): { prevFrom: string; prevTo: string } {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - daysDiff + 1);
  
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    prevFrom: formatDate(prevFrom),
    prevTo: formatDate(prevTo),
  };
}

export function useShopifyComparison(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['shopify-comparison', dateFrom, dateTo],
    queryFn: async (): Promise<ComparisonData | null> => {
      if (!dateFrom || !dateTo) return null;
      
      const { prevFrom, prevTo } = getPreviousPeriodDates(dateFrom, dateTo);
      
      // Fetch both periods in parallel
      const [currentData, previousData] = await Promise.all([
        callShopifyApi('get_analytics', { date_from: dateFrom, date_to: dateTo }),
        callShopifyApi('get_analytics', { date_from: prevFrom, date_to: prevTo }),
      ]);
      
      const currentSummary = currentData.summary;
      const previousSummary = previousData.summary;
      
      // Calculate percentage changes
      const calcChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };
      
      return {
        current: {
          totalOrders: currentSummary.totalOrders || 0,
          totalRevenue: currentSummary.totalRevenue || 0,
          grossSales: currentData.grossSales || currentSummary.totalRevenue || 0,
          netSales: currentData.netSales || currentSummary.totalRevenue || 0,
          discounts: currentData.discounts || 0,
          returns: currentData.returns || 0,
          taxes: currentData.taxes || 0,
          shipping: currentData.shipping || 0,
        },
        previous: {
          totalOrders: previousSummary.totalOrders || 0,
          totalRevenue: previousSummary.totalRevenue || 0,
          grossSales: previousData.grossSales || previousSummary.totalRevenue || 0,
          netSales: previousData.netSales || previousSummary.totalRevenue || 0,
          discounts: previousData.discounts || 0,
          returns: previousData.returns || 0,
          taxes: previousData.taxes || 0,
          shipping: previousData.shipping || 0,
        },
        changes: {
          orders: calcChange(currentSummary.totalOrders || 0, previousSummary.totalOrders || 0),
          revenue: calcChange(currentSummary.totalRevenue || 0, previousSummary.totalRevenue || 0),
          grossSales: calcChange(currentData.grossSales || currentSummary.totalRevenue || 0, previousData.grossSales || previousSummary.totalRevenue || 0),
          netSales: calcChange(currentData.netSales || currentSummary.totalRevenue || 0, previousData.netSales || previousSummary.totalRevenue || 0),
        },
      };
    },
    enabled: !!dateFrom && !!dateTo,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
