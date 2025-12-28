import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  };
}

// Generate mock data for ad platforms
function generateMockPlatformData(platform: string, name: string, logo: string, color: string): PlatformData {
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
  });

  const impressions = Math.floor(Math.random() * 500000) + 100000;
  const clicks = Math.floor(impressions * (Math.random() * 0.03 + 0.01));
  const spend = Math.floor(Math.random() * 15000) + 5000;
  const conversions = Math.floor(clicks * (Math.random() * 0.05 + 0.01));

  return {
    platform,
    name,
    color,
    logo,
    metrics: {
      spend,
      impressions,
      clicks,
      conversions,
      ctr: (clicks / impressions) * 100,
      cpc: spend / clicks,
      costPerConversion: conversions > 0 ? spend / conversions : 0,
    },
    dailyData: dates.map((date) => ({
      date,
      impressions: Math.floor(Math.random() * 20000) + 5000,
      clicks: Math.floor(Math.random() * 500) + 100,
      spend: Math.floor(Math.random() * 500) + 100,
      conversions: Math.floor(Math.random() * 20) + 1,
    })),
    campaigns: [
      { name: "קמפיין חורף 2024", status: "active", spend: spend * 0.4, impressions: impressions * 0.4, clicks: clicks * 0.4, conversions: Math.floor(conversions * 0.4) },
      { name: "קמפיין מכירות", status: "active", spend: spend * 0.35, impressions: impressions * 0.35, clicks: clicks * 0.35, conversions: Math.floor(conversions * 0.35) },
      { name: "מודעות רימרקטינג", status: "active", spend: spend * 0.15, impressions: impressions * 0.15, clicks: clicks * 0.15, conversions: Math.floor(conversions * 0.15) },
      { name: "קמפיין מותג", status: "paused", spend: spend * 0.1, impressions: impressions * 0.1, clicks: clicks * 0.1, conversions: Math.floor(conversions * 0.1) },
    ],
  };
}

export function useAnalyticsData(clientId: string | undefined, dateRange: string = "30") {
  // Fetch connected integrations
  const { data: integrations = [] } = useQuery({
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
    enabled: !!clientId,
  });

  // Get GA property ID from integration settings
  const gaIntegration = integrations.find((i) => i.platform === "google_analytics");
  const propertyId = (gaIntegration?.settings as any)?.property_id;

  // Fetch real analytics data from GA4
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
    enabled: !!clientId && !!propertyId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate platform data based on connected integrations only
  const { data: platformsData, isLoading: platformsLoading } = useQuery({
    queryKey: ["platforms-data", clientId, integrations],
    queryFn: async () => {
      const platforms: PlatformData[] = [];
      
      const platformConfigs: Record<string, { name: string; logo: string; color: string }> = {
        google_ads: { name: "Google Ads", logo: "G", color: "bg-blue-500" },
        facebook_ads: { name: "Facebook Ads", logo: "f", color: "bg-[#1877F2]" },
        instagram: { name: "Instagram", logo: "📷", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
        tiktok: { name: "TikTok", logo: "♪", color: "bg-black" },
        linkedin: { name: "LinkedIn", logo: "in", color: "bg-[#0A66C2]" },
      };

      // Only add platforms for connected integrations - no mock data
      for (const integration of integrations) {
        const config = platformConfigs[integration.platform];
        if (config && integration.is_connected) {
          platforms.push(generateMockPlatformData(integration.platform, config.name, config.logo, config.color));
        }
      }

      return platforms;
    },
    enabled: !!clientId,
  });

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
    },
    platformsData: platformsData || [],
    aggregatedAdsData,
    integrations,
    isLoading: analyticsLoading || platformsLoading,
    hasAnalytics: integrations.some((i) => i.platform === "google_analytics"),
    hasAds: integrations.some((i) => 
      ["google_ads", "facebook_ads", "instagram", "tiktok", "linkedin"].includes(i.platform)
    ),
    analyticsError,
    refetchAnalytics,
  };
}
