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
  sort_order: number;
}

export type ModulesOrder = Record<string, number>;

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
        .select("module_name, is_globally_enabled, default_for_basic, default_for_premium, sort_order")
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as GlobalModuleSetting[];
    },
    refetchInterval: 60000,
  });

  const { data: clientData, isLoading } = useQuery({
    queryKey: ["client-modules-data", activeClientId, isSimulating],
    queryFn: async () => {
      if (!activeClientId) return null;
      
      const { data, error } = await supabase
        .from("clients")
        .select("modules_enabled, account_type, modules_order")
        .eq("id", activeClientId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!activeClientId,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Compute modules based on global settings and client data
  const modules = (() => {
    if (!clientData) return defaultModules;
    
    const clientModules = clientData.modules_enabled as Record<string, boolean> | null;
    const accountType = clientData.account_type || "basic_client";
    const isPremium = accountType === "premium_client";
    
    const finalModules: Record<string, boolean> = { ...defaultModules };
    
    for (const key of Object.keys(defaultModules) as (keyof ClientModules)[]) {
      const globalSetting = globalSettings.find(g => g.module_name === key);
      
      if (globalSetting) {
        if (!globalSetting.is_globally_enabled) {
          finalModules[key] = false;
        } else {
          const tierDefault = isPremium 
            ? globalSetting.default_for_premium 
            : globalSetting.default_for_basic;
          const clientValue = clientModules?.[key];
          finalModules[key] = clientValue === true || tierDefault;
        }
      } else {
        if (clientModules && key in clientModules) {
          finalModules[key] = clientModules[key];
        }
      }
    }
    
    return finalModules as unknown as ClientModules;
  })();

  // Compute module order: client order overrides global order
  const modulesOrder: ModulesOrder = (() => {
    const order: ModulesOrder = {};
    
    // Start with global order
    globalSettings.forEach(g => {
      order[g.module_name] = g.sort_order;
    });
    
    // Override with client order if exists
    if (clientData?.modules_order) {
      const clientOrder = clientData.modules_order as Record<string, number>;
      Object.entries(clientOrder).forEach(([key, value]) => {
        if (typeof value === 'number') {
          order[key] = value;
        }
      });
    }
    
    return order;
  })();

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
      queryClient.invalidateQueries({ queryKey: ["client-modules-data", selectedClient?.id] });
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
    modulesOrder,
    globalSettings,
    isLoading,
    isModuleEnabled,
    updateModules: updateModulesMutation.mutate,
    isUpdating: updateModulesMutation.isPending,
    isAdmin,
    selectedClient: isSimulating && simulatedClientId ? { id: simulatedClientId } : selectedClient,
  };
}
