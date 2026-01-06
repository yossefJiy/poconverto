import { useClient } from "@/hooks/useClient";
import { useAuth } from "@/hooks/useAuth";
import { useRoleSimulation } from "@/hooks/useRoleSimulation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientModules {
  dashboard: boolean;
  projects: boolean;
  analytics: boolean;
  ecommerce: boolean;
  google_shopping: boolean;
  marketing: boolean;
  kpis: boolean;
  competitors: boolean;
  social: boolean;
  content_studio: boolean;
  campaigns: boolean;
  programmatic: boolean;
  ab_tests: boolean;
  tasks: boolean;
  leads: boolean;
  billing: boolean;
  approvals: boolean;
  team: boolean;
  features: boolean;
  insights: boolean;
  ai_agent: boolean;
  ai_insights: boolean;
  reports: boolean;
  agency: boolean;
}

interface GlobalModuleSetting {
  module_name: string;
  is_globally_enabled: boolean;
  default_for_basic: boolean;
  default_for_premium: boolean;
}

const defaultModules: ClientModules = {
  dashboard: true,
  projects: true,
  analytics: true,
  ecommerce: false,
  google_shopping: false,
  marketing: true,
  kpis: true,
  competitors: false,
  social: true,
  content_studio: true,
  campaigns: true,
  programmatic: false,
  ab_tests: false,
  tasks: true,
  leads: true,
  billing: true,
  approvals: true,
  team: true,
  features: true,
  insights: true,
  ai_agent: true,
  ai_insights: false,
  reports: true,
  agency: false,
};

export function useClientModules() {
  const { selectedClient } = useClient();
  const { role } = useAuth();
  const { isSimulating, simulatedClientId } = useRoleSimulation();
  const queryClient = useQueryClient();

  // Use simulated client ID when in simulation mode, otherwise use selected client
  const activeClientId = isSimulating && simulatedClientId 
    ? simulatedClientId 
    : selectedClient?.id;

  // Fetch global module settings
  const { data: globalSettings = [] } = useQuery({
    queryKey: ["global-module-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_module_settings")
        .select("module_name, is_globally_enabled, default_for_basic, default_for_premium");
      
      if (error) throw error;
      return data as GlobalModuleSetting[];
    },
    refetchInterval: 60000,
  });

  const { data: modules = defaultModules, isLoading } = useQuery({
    queryKey: ["client-modules", activeClientId, isSimulating, globalSettings],
    queryFn: async () => {
      if (!activeClientId) return defaultModules;
      
      // Fetch client data including account_type
      const { data: clientData, error } = await supabase
        .from("clients")
        .select("modules_enabled, account_type")
        .eq("id", activeClientId)
        .single();
      
      if (error) throw error;
      
      const clientModules = clientData?.modules_enabled as Record<string, boolean> | null;
      const accountType = clientData?.account_type || "basic_client";
      const isPremium = accountType === "premium_client";
      
      // Build final modules based on hierarchy:
      // 1. If global is OFF → module is disabled (overrides everything)
      // 2. If global is ON → start with default for account type, then client settings can ADD modules
      const finalModules: Record<string, boolean> = { ...defaultModules };
      
      for (const key of Object.keys(defaultModules) as (keyof ClientModules)[]) {
        const globalSetting = globalSettings.find(g => g.module_name === key);
        
        if (globalSetting) {
          if (!globalSetting.is_globally_enabled) {
            // Global is OFF → force disabled
            finalModules[key] = false;
          } else {
            // Global is ON → use tier default, but client can add
            const tierDefault = isPremium 
              ? globalSetting.default_for_premium 
              : globalSetting.default_for_basic;
            
            // Client settings can enable modules beyond tier default
            const clientValue = clientModules?.[key];
            finalModules[key] = clientValue === true || tierDefault;
          }
        } else {
          // No global setting exists, use client setting or default
          if (clientModules && key in clientModules) {
            finalModules[key] = clientModules[key];
          }
        }
      }
      
      return finalModules as unknown as ClientModules;
    },
    enabled: !!activeClientId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const updateModulesMutation = useMutation({
    mutationFn: async (newModules: Partial<ClientModules>) => {
      if (!selectedClient) throw new Error("No client selected");
      
      const updatedModules = { ...modules, ...newModules };
      
      const { error } = await supabase
        .from("clients")
        .update({ modules_enabled: updatedModules })
        .eq("id", selectedClient.id);
      
      if (error) throw error;
      return updatedModules;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-modules", selectedClient?.id] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
    },
  });

  const isModuleEnabled = (moduleName: keyof ClientModules): boolean => {
    // When simulating, strictly use the simulated client's modules
    if (isSimulating && simulatedClientId) {
      return modules[moduleName] ?? false;
    }
    if (!selectedClient) return true; // Show all when no client selected
    return modules[moduleName] ?? true;
  };

  const isAdmin = !isSimulating && (role === "admin" || role === "super_admin" || role === "agency_manager");

  return {
    modules,
    isLoading,
    isModuleEnabled,
    updateModules: updateModulesMutation.mutate,
    isUpdating: updateModulesMutation.isPending,
    isAdmin,
    selectedClient: isSimulating && simulatedClientId ? { id: simulatedClientId } : selectedClient,
  };
}
