import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface TrafficSource {
  source: string;
  sessions: number;
  users: number;
  percentage: number;
}

interface TopPage {
  path: string;
  pageviews: number;
  avgDuration: string;
  bounceRate: number;
}

interface DeviceData {
  device: string;
  sessions: number;
  users: number;
  percentage: number;
}

interface CountryData {
  country: string;
  sessions: number;
  users: number;
  percentage: number;
}

interface DailyData {
  date: string;
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgDuration: number;
}

interface EcommerceData {
  addToCarts: number;
  checkouts: number;
  purchases: number;
  purchaseRevenue: number;
  transactions: number;
  sessions: number;
  conversionRates: {
    addToCartRate: string;
    checkoutRate: string;
    purchaseRate: string;
    overallConversionRate: string;
  };
}

interface AnalyticsData {
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: string;
  trafficSources: TrafficSource[];
  topPages: TopPage[];
  devices: DeviceData[];
  countries: CountryData[];
  dailyData: DailyData[];
  ecommerce?: EcommerceData;
}

interface PlatformData {
  platform: string;
  name: string;
  color: string;
  logo: string;
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    costPerConversion: number;
  };
  dailyData: Array<{
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
    conversions: number;
  }>;
  campaigns: Array<{
    name: string;
    status: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>;
}

// Format seconds to mm:ss
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Parse GA4 response to our format
function parseGAResponse(gaData: any): AnalyticsData {
  const emptyResult: AnalyticsData = {
    sessions: 0,
    users: 0,
    pageviews: 0,
    bounceRate: 0,
    avgSessionDuration: "0:00",
    trafficSources: [],
    topPages: [],
    devices: [],
    countries: [],
    dailyData: [],
    ecommerce: undefined,
  };

  if (!gaData || gaData.error) {
    console.error("GA data error:", gaData?.error);
    return emptyResult;
  }

  // Parse daily metrics
  let totalSessions = 0;
  let totalUsers = 0;
  let totalPageviews = 0;
  let totalBounceRate = 0;
  let totalAvgDuration = 0;
  const dailyData: DailyData[] = [];

  if (gaData.dailyMetrics?.rows) {
    for (const row of gaData.dailyMetrics.rows) {
      const date = row.dimensionValues?.[0]?.value || "";
      const formattedDate = date ? `${date.slice(6, 8)}/${date.slice(4, 6)}` : "";
      
      const users = parseInt(row.metricValues?.[0]?.value || "0");
      const sessions = parseInt(row.metricValues?.[1]?.value || "0");
      const pageviews = parseInt(row.metricValues?.[2]?.value || "0");
      const bounceRate = parseFloat(row.metricValues?.[4]?.value || "0") * 100;
      const avgDuration = parseFloat(row.metricValues?.[5]?.value || "0");

      totalUsers += users;
      totalSessions += sessions;
      totalPageviews += pageviews;
      totalBounceRate += bounceRate;
      totalAvgDuration += avgDuration;

      dailyData.push({
        date: formattedDate,
        sessions,
        users,
        pageviews,
        bounceRate,
        avgDuration,
      });
    }
  }

  const rowCount = gaData.dailyMetrics?.rows?.length || 1;

  // Parse traffic sources
  const trafficSources: TrafficSource[] = [];
  if (gaData.trafficSources?.rows) {
    const totalTrafficSessions = gaData.trafficSources.rows.reduce(
      (sum: number, row: any) => sum + parseInt(row.metricValues?.[0]?.value || "0"),
      0
    );
    
    for (const row of gaData.trafficSources.rows.slice(0, 6)) {
      const sessions = parseInt(row.metricValues?.[0]?.value || "0");
      const users = parseInt(row.metricValues?.[1]?.value || "0");
      trafficSources.push({
        source: row.dimensionValues?.[0]?.value || "Unknown",
        sessions,
        users,
        percentage: totalTrafficSessions > 0 ? Math.round((sessions / totalTrafficSessions) * 100) : 0,
      });
    }
  }

  // Parse top pages
  const topPages: TopPage[] = [];
  if (gaData.topPages?.rows) {
    for (const row of gaData.topPages.rows.slice(0, 10)) {
      topPages.push({
        path: row.dimensionValues?.[0]?.value || "/",
        pageviews: parseInt(row.metricValues?.[0]?.value || "0"),
        avgDuration: formatDuration(parseFloat(row.metricValues?.[1]?.value || "0")),
        bounceRate: parseFloat(row.metricValues?.[2]?.value || "0") * 100,
      });
    }
  }

  // Parse devices
  const devices: DeviceData[] = [];
  if (gaData.devices?.rows) {
    const totalDeviceSessions = gaData.devices.rows.reduce(
      (sum: number, row: any) => sum + parseInt(row.metricValues?.[0]?.value || "0"),
      0
    );
    
    for (const row of gaData.devices.rows) {
      const sessions = parseInt(row.metricValues?.[0]?.value || "0");
      const users = parseInt(row.metricValues?.[1]?.value || "0");
      devices.push({
        device: row.dimensionValues?.[0]?.value || "Unknown",
        sessions,
        users,
        percentage: totalDeviceSessions > 0 ? Math.round((sessions / totalDeviceSessions) * 100) : 0,
      });
    }
  }

  // Parse countries
  const countries: CountryData[] = [];
  if (gaData.countries?.rows) {
    const totalCountrySessions = gaData.countries.rows.reduce(
      (sum: number, row: any) => sum + parseInt(row.metricValues?.[0]?.value || "0"),
      0
    );
    
    for (const row of gaData.countries.rows.slice(0, 10)) {
      const sessions = parseInt(row.metricValues?.[0]?.value || "0");
      const users = parseInt(row.metricValues?.[1]?.value || "0");
      countries.push({
        country: row.dimensionValues?.[0]?.value || "Unknown",
        sessions,
        users,
        percentage: totalCountrySessions > 0 ? Math.round((sessions / totalCountrySessions) * 100) : 0,
      });
    }
  }

  // Parse ecommerce data if available
  let ecommerce: EcommerceData | undefined;
  if (gaData.ecommerce) {
    ecommerce = {
      addToCarts: gaData.ecommerce.totals?.addToCarts || 0,
      checkouts: gaData.ecommerce.totals?.checkouts || 0,
      purchases: gaData.ecommerce.totals?.purchases || 0,
      purchaseRevenue: gaData.ecommerce.totals?.purchaseRevenue || 0,
      transactions: gaData.ecommerce.totals?.transactions || 0,
      sessions: gaData.ecommerce.totals?.sessions || 0,
      conversionRates: {
        addToCartRate: gaData.ecommerce.conversionRates?.addToCartRate || '0.00',
        checkoutRate: gaData.ecommerce.conversionRates?.checkoutRate || '0.00',
        purchaseRate: gaData.ecommerce.conversionRates?.purchaseRate || '0.00',
        overallConversionRate: gaData.ecommerce.conversionRates?.overallConversionRate || '0.00',
      },
    };
    console.log('[GA] Parsed ecommerce data:', ecommerce);
  }

  return {
    sessions: totalSessions,
    users: totalUsers,
    pageviews: totalPageviews,
    bounceRate: rowCount > 0 ? totalBounceRate / rowCount : 0,
    avgSessionDuration: formatDuration(rowCount > 0 ? totalAvgDuration / rowCount : 0),
    trafficSources,
    topPages,
    devices,
    countries,
    dailyData,
    ecommerce,
  };
}

// Note: Mock data generation removed - all data comes from server-side APIs only

export function useAnalyticsData(clientId: string | undefined, dateRange: string = "30") {
  const { session, loading: authLoading } = useAuth();
  
  // Fetch connected integrations - only after auth is ready
  const { data: integrations = [], refetch: refetchIntegrations } = useQuery({
    queryKey: ["integrations", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_connected", true);
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && !authLoading && !!session,
    staleTime: 8 * 60 * 60 * 1000, // 8 hours - don't refetch on every page visit
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
  });

  // Get GA property ID from integration settings
  const gaIntegration = integrations.find((i) => i.platform === "google_analytics");
  const propertyId = (gaIntegration?.settings as any)?.property_id;

  // Fetch real analytics data from GA4 - only after auth is ready
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useQuery({
    queryKey: ["analytics-data", clientId, propertyId, dateRange],
    queryFn: async () => {
      // Calculate date range
      const endDate = new Date().toISOString().split('T')[0];
      const daysAgo = parseInt(dateRange) || 30;
      const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      console.log("Fetching GA data:", { propertyId, startDate, endDate, dateRange });

      const { data, error } = await supabase.functions.invoke("google-analytics", {
        body: {
          propertyId,
          startDate,
          endDate,
        },
      });

      if (error) {
        console.error("GA function error:", error);
        throw error;
      }

      if (data.error) {
        console.error("GA API error:", data.error);
        throw new Error(data.error);
      }

      console.log("GA data received:", data);
      return parseGAResponse(data);
    },
    enabled: !!clientId && !!propertyId && !authLoading && !!session,
    retry: 1,
    staleTime: 8 * 60 * 60 * 1000, // 8 hours - don't refetch on every page visit
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
  });

  // Platform data is now fetched directly by each card component (GoogleAdsCard, FacebookAdsCard, etc.)
  // This removes the dependency on mock data and ensures real server-side data only
  const platformsData: PlatformData[] = [];
  const platformsLoading = false;

  // Calculate aggregated ads data
  const aggregatedAdsData = platformsData?.reduce(
    (acc, platform) => ({
      spend: acc.spend + platform.metrics.spend,
      impressions: acc.impressions + platform.metrics.impressions,
      clicks: acc.clicks + platform.metrics.clicks,
      conversions: acc.conversions + platform.metrics.conversions,
      ctr: 0,
      cpc: 0,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0 }
  ) || { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0 };

  if (aggregatedAdsData.impressions > 0) {
    aggregatedAdsData.ctr = (aggregatedAdsData.clicks / aggregatedAdsData.impressions) * 100;
  }
  if (aggregatedAdsData.clicks > 0) {
    aggregatedAdsData.cpc = aggregatedAdsData.spend / aggregatedAdsData.clicks;
  }

  return {
    analyticsData: analyticsData || {
      sessions: 0,
      users: 0,
      pageviews: 0,
      bounceRate: 0,
      avgSessionDuration: "0:00",
      trafficSources: [],
      topPages: [],
      devices: [],
      countries: [],
      dailyData: [],
      ecommerce: undefined,
    },
    platformsData: platformsData || [],
    aggregatedAdsData,
    integrations,
    isLoading: authLoading || analyticsLoading || platformsLoading,
    isAuthLoading: authLoading,
    hasSession: !!session,
    hasAnalytics: integrations.some((i) => i.platform === "google_analytics"),
    hasAds: integrations.some((i) => 
      ["google_ads", "facebook_ads", "instagram", "tiktok", "linkedin"].includes(i.platform)
    ),
    analyticsError,
    refetchAll: async () => {
      await refetchIntegrations();
      await refetchAnalytics();
    },
  };
}
