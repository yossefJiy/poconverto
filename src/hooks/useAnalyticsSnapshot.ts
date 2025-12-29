import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnalyticsSnapshot {
  id: string;
  client_id: string;
  platform: string;
  snapshot_date: string;
  metrics: Record<string, any>;
  data: Record<string, any>;
  updated_at: string;
  created_at: string;
}

export function useAnalyticsSnapshot(clientId: string | undefined, platform: string) {
  return useQuery({
    queryKey: ["analytics-snapshot", clientId, platform],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from("analytics_snapshots")
        .select("*")
        .eq("client_id", clientId)
        .eq("platform", platform)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error(`Error fetching ${platform} snapshot:`, error);
        return null;
      }
      
      return data as AnalyticsSnapshot | null;
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function formatSnapshotDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
