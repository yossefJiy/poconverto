import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SecurityFinding {
  id: string;
  internal_id: string;
  category: string;
  name: string;
  description: string;
  details?: string;
  remediation_difficulty: string;
  level: "info" | "warn" | "error";
  link?: string;
  ignore: boolean;
  ignore_reason?: string;
}

interface SecurityScanResult {
  findings: SecurityFinding[];
  lastScan?: string;
}

export function useSecurityIssues() {
  const { data, isLoading, refetch } = useQuery<SecurityScanResult>({
    queryKey: ["security-scan-results"],
    queryFn: async () => {
      // Fetch from code_health_issues table with category='security'
      const { data: issues, error } = await supabase
        .from("code_health_issues")
        .select("*")
        .eq("category", "security")
        .is("resolved_at", null)
        .is("ignored_at", null);

      if (error) {
        console.error("Error fetching security issues:", error);
        return { findings: [] };
      }

      // Map to SecurityFinding format
      const findings: SecurityFinding[] = (issues || []).map((issue) => ({
        id: issue.id,
        internal_id: issue.id,
        category: issue.category,
        name: issue.title,
        description: issue.description || "",
        details: typeof issue.details === "object" ? JSON.stringify(issue.details) : undefined,
        remediation_difficulty: "medium",
        level: issue.severity === "critical" ? "error" : issue.severity === "warning" ? "warn" : "info",
        link: "https://docs.lovable.dev/features/security",
        ignore: false,
      }));

      return {
        findings,
        lastScan: issues?.[0]?.created_at,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    findings: data?.findings || [],
    lastScan: data?.lastScan,
    isLoading,
    refetch,
    totalCount: data?.findings.length || 0,
    errorCount: data?.findings.filter((f) => f.level === "error").length || 0,
    warningCount: data?.findings.filter((f) => f.level === "warn").length || 0,
    infoCount: data?.findings.filter((f) => f.level === "info").length || 0,
  };
}
