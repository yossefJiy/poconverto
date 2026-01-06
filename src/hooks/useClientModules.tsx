import { useClient } from "@/hooks/useClient";
import { useAuth } from "@/hooks/useAuth";
import { useRoleSimulation } from "@/hooks/useRoleSimulation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientModules {
  dashboard: boolean;
  analytics: boolean;
  ecommerce: boolean;
  marketing: boolean;
  campaigns: boolean;
  tasks: boolean;
  team: boolean;
  features: boolean;
  insights: boolean;
  ai_agent: boolean;
  reports: boolean;
  leads: boolean;
  billing: boolean;
  approvals: boolean;
}

const defaultModules: ClientModules = {
  dashboard: true,
  analytics: true,
  ecommerce: false,
  marketing: true,
  campaigns: true,
  tasks: true,
  team: true,
  features: true,
  insights: true,
  ai_agent: true,
  reports: true,
  leads: true,
  billing: true,
  approvals: true,
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

  const { data: modules = defaultModules, isLoading } = useQuery({
    queryKey: ["client-modules", activeClientId, isSimulating],
    queryFn: async () => {
      if (!activeClientId) return defaultModules;
      
      const { data, error } = await supabase
        .from("clients")
        .select("modules_enabled")
        .eq("id", activeClientId)
        .single();
      
      if (error) throw error;
      const modulesData = data?.modules_enabled as Record<string, boolean> | null;
      return modulesData ? { ...defaultModules, ...modulesData } : defaultModules;
    },
    enabled: !!activeClientId,
    // Refetch every 30 seconds to keep permissions dynamic
    refetchInterval: 30000,
    // Also refetch when window regains focus
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
