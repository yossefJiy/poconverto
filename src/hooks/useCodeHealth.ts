import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CodeHealthStats {
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  totalOpen: number;
  lastCheckDate: string | null;
}

export function useCodeHealth() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["code-health-stats"],
    queryFn: async (): Promise<CodeHealthStats> => {
      // Get open issues count by severity
      const { data: issues, error: issuesError } = await supabase
        .from("code_health_issues")
        .select("severity")
        .is("resolved_at", null)
        .is("ignored_at", null);

      if (issuesError) throw issuesError;

      // Get last report date
      const { data: lastReport, error: reportError } = await supabase
        .from("code_health_reports")
        .select("report_date")
        .order("report_date", { ascending: false })
        .limit(1)
        .single();

      const criticalCount = issues?.filter(i => i.severity === "critical").length || 0;
      const warningCount = issues?.filter(i => i.severity === "warning").length || 0;
      const infoCount = issues?.filter(i => i.severity === "info").length || 0;

      return {
        criticalCount,
        warningCount,
        infoCount,
        totalOpen: (issues?.length || 0),
        lastCheckDate: lastReport?.report_date || null,
      };
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return { stats, isLoading };
}
