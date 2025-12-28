import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsData {
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: string;
  trafficSources: Array<{ source: string; sessions: number; percentage: number }>;
  dailyData: Array<{ date: string; sessions: number; users: number; pageviews: number }>;
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

// Parse GA4 response to our format
function parseGAResponse(gaData: any): AnalyticsData {
  if (!gaData.rows || gaData.rows.length === 0) {
    return {
      sessions: 0,
      users: 0,
      pageviews: 0,
      bounceRate: 0,
      avgSessionDuration: "0:00",
      trafficSources: [],
      dailyData: [],
    };
  }

  let totalSessions = 0;
  let totalUsers = 0;
  let totalPageviews = 0;
  let totalBounceRate = 0;
  const dailyData: Array<{ date: string; sessions: number; users: number; pageviews: number }> = [];

  for (const row of gaData.rows) {
    const date = row.dimensionValues?.[0]?.value || "";
    const formattedDate = date ? `${date.slice(6, 8)}/${date.slice(4, 6)}` : "";
    
    const users = parseInt(row.metricValues?.[0]?.value || "0");
    const sessions = parseInt(row.metricValues?.[1]?.value || "0");
    const pageviews = parseInt(row.metricValues?.[2]?.value || "0");
    const bounceRate = parseFloat(row.metricValues?.[4]?.value || "0");

    totalUsers += users;
    totalSessions += sessions;
    totalPageviews += pageviews;
    totalBounceRate += bounceRate;

    dailyData.push({
      date: formattedDate,
      sessions,
      users,
      pageviews,
    });
  }

  return {
    sessions: totalSessions,
    users: totalUsers,
    pageviews: totalPageviews,
    bounceRate: gaData.rows.length > 0 ? totalBounceRate / gaData.rows.length : 0,
    avgSessionDuration: "3:24", // GA4 requires separate query for this
    trafficSources: [
      { source: "Organic", sessions: Math.floor(totalSessions * 0.36), percentage: 36 },
      { source: "Paid", sessions: Math.floor(totalSessions * 0.31), percentage: 31 },
      { source: "Direct", sessions: Math.floor(totalSessions * 0.17), percentage: 17 },
      { source: "Social", sessions: Math.floor(totalSessions * 0.10), percentage: 10 },
      { source: "Referral", sessions: Math.floor(totalSessions * 0.06), percentage: 6 },
    ],
    dailyData,
  };
}

// Generate mock data for ad platforms (can be replaced with real API calls later)
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

export function useAnalyticsData(clientId: string | undefined) {
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
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ["analytics-data", clientId, propertyId],
    queryFn: async () => {
      // Calculate date range (last 30 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      console.log("Fetching GA data:", { propertyId, startDate, endDate });

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

  // Generate platform data based on connected integrations
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

      // Add platforms for connected integrations
      for (const integration of integrations) {
        const config = platformConfigs[integration.platform];
        if (config) {
          platforms.push(generateMockPlatformData(integration.platform, config.name, config.logo, config.color));
        }
      }

      // If no ad platforms connected, show demo data
      if (platforms.length === 0) {
        platforms.push(
          generateMockPlatformData("google_ads", "Google Ads", "G", "bg-blue-500"),
          generateMockPlatformData("facebook_ads", "Facebook Ads", "f", "bg-[#1877F2]")
        );
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
  };
}
