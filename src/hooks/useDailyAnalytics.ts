import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";

export interface MarketingMetrics {
  date: string;
  platform: string;
  campaign_id: string;
  campaign_name: string;
  breakdown_key: string | null;
  spend_reporting: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversion_value_reporting: number;
}

export interface SiteMetrics {
  date: string;
  store_platform: string;
  orders: number;
  gross_sales: number;
  discounts: number;
  refunds: number;
  net_sales: number;
  net_sales_reporting: number;
}

export interface OfflineRevenue {
  id: string;
  date: string;
  source: string;
  amount_reporting: number;
  notes: string | null;
}

export interface DailyAnalyticsSummary {
  totalRevenue: number;
  onlineRevenue: number;
  offlineRevenue: number;
  totalAdSpend: number;
  spendByPlatform: Record<string, number>;
  metaBreakdown: Record<string, number>;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalConversionValue: number;
  totalOrders: number;
  mer: number;
  aov: number;
}

function summarize(
  marketing: MarketingMetrics[],
  site: SiteMetrics[],
  offline: OfflineRevenue[]
): DailyAnalyticsSummary {
  const onlineRevenue = site.reduce((s, r) => s + (r.net_sales_reporting || 0), 0);
  const offlineRev = offline.reduce((s, r) => s + (r.amount_reporting || 0), 0);
  const totalAdSpend = marketing.reduce((s, r) => s + (r.spend_reporting || 0), 0);

  const spendByPlatform: Record<string, number> = {};
  const metaBreakdown: Record<string, number> = {};
  let totalImpressions = 0, totalClicks = 0, totalConversions = 0, totalConversionValue = 0;

  for (const r of marketing) {
    spendByPlatform[r.platform] = (spendByPlatform[r.platform] || 0) + (r.spend_reporting || 0);
    totalImpressions += r.impressions || 0;
    totalClicks += r.clicks || 0;
    totalConversions += r.conversions || 0;
    totalConversionValue += r.conversion_value_reporting || 0;

    if (r.platform === 'meta_ads' && r.breakdown_key) {
      metaBreakdown[r.breakdown_key] = (metaBreakdown[r.breakdown_key] || 0) + (r.spend_reporting || 0);
    }
  }

  const totalOrders = site.reduce((s, r) => s + (r.orders || 0), 0);
  const totalRevenue = onlineRevenue + offlineRev;
  const mer = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;
  const aov = totalOrders > 0 ? onlineRevenue / totalOrders : 0;

  return {
    totalRevenue,
    onlineRevenue,
    offlineRevenue: offlineRev,
    totalAdSpend,
    spendByPlatform,
    metaBreakdown,
    totalImpressions,
    totalClicks,
    totalConversions,
    totalConversionValue,
    totalOrders,
    mer,
    aov,
  };
}

export function useDailyAnalytics(dateFrom: string, dateTo: string) {
  const { selectedClient } = useClient();
  const clientId = selectedClient?.id;

  const marketingQuery = useQuery({
    queryKey: ["daily-marketing", clientId, dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_marketing_metrics")
        .select("date, platform, campaign_id, campaign_name, breakdown_key, spend_reporting, impressions, clicks, conversions, conversion_value_reporting")
        .eq("client_id", clientId!)
        .gte("date", dateFrom)
        .lte("date", dateTo)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data || []) as MarketingMetrics[];
    },
    enabled: !!clientId,
  });

  const siteQuery = useQuery({
    queryKey: ["daily-site", clientId, dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_site_metrics")
        .select("date, store_platform, orders, gross_sales, discounts, refunds, net_sales, net_sales_reporting")
        .eq("client_id", clientId!)
        .gte("date", dateFrom)
        .lte("date", dateTo)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data || []) as SiteMetrics[];
    },
    enabled: !!clientId,
  });

  const offlineQuery = useQuery({
    queryKey: ["daily-offline", clientId, dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_offline_revenue")
        .select("id, date, source, amount_reporting, notes")
        .eq("client_id", clientId!)
        .gte("date", dateFrom)
        .lte("date", dateTo)
        .order("date", { ascending: true });
      if (error) throw error;
      return (data || []) as OfflineRevenue[];
    },
    enabled: !!clientId,
  });

  const isLoading = marketingQuery.isLoading || siteQuery.isLoading || offlineQuery.isLoading;

  const summary = summarize(
    marketingQuery.data || [],
    siteQuery.data || [],
    offlineQuery.data || []
  );

  return {
    marketing: marketingQuery.data || [],
    site: siteQuery.data || [],
    offline: offlineQuery.data || [],
    summary,
    isLoading,
    refetch: () => {
      marketingQuery.refetch();
      siteQuery.refetch();
      offlineQuery.refetch();
    },
  };
}

export function useCampaignPerformance(dateFrom: string, dateTo: string, platform?: string) {
  const { selectedClient } = useClient();
  const clientId = selectedClient?.id;

  return useQuery({
    queryKey: ["campaign-performance", clientId, dateFrom, dateTo, platform],
    queryFn: async () => {
      let query = supabase
        .from("daily_marketing_metrics")
        .select("campaign_id, campaign_name, platform, breakdown_key, spend_reporting, impressions, clicks, conversions, conversion_value_reporting")
        .eq("client_id", clientId!)
        .gte("date", dateFrom)
        .lte("date", dateTo);

      if (platform) {
        query = query.eq("platform", platform);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by campaign
      const campaignMap = new Map<string, {
        campaign_id: string;
        campaign_name: string;
        platform: string;
        spend: number;
        impressions: number;
        clicks: number;
        conversions: number;
        conversion_value: number;
      }>();

      for (const row of data || []) {
        const key = `${row.campaign_id}_${row.platform}`;
        const existing = campaignMap.get(key);
        if (existing) {
          existing.spend += row.spend_reporting || 0;
          existing.impressions += row.impressions || 0;
          existing.clicks += row.clicks || 0;
          existing.conversions += row.conversions || 0;
          existing.conversion_value += row.conversion_value_reporting || 0;
        } else {
          campaignMap.set(key, {
            campaign_id: row.campaign_id,
            campaign_name: row.campaign_name,
            platform: row.platform,
            spend: row.spend_reporting || 0,
            impressions: row.impressions || 0,
            clicks: row.clicks || 0,
            conversions: row.conversions || 0,
            conversion_value: row.conversion_value_reporting || 0,
          });
        }
      }

      return Array.from(campaignMap.values()).sort((a, b) => b.spend - a.spend);
    },
    enabled: !!clientId,
  });
}
