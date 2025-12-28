import { useClient } from "@/hooks/useClient";
import { useAuth } from "@/hooks/useAuth";
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
}

const defaultModules: ClientModules = {
  dashboard: true,
  analytics: true,
  ecommerce: false,
  marketing: true,
  campaigns: true,
  tasks: true,
  team: true,
};

export function useClientModules() {
  const { selectedClient } = useClient();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const { data: modules = defaultModules, isLoading } = useQuery({
    queryKey: ["client-modules", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return defaultModules;
      
      const { data, error } = await supabase
        .from("clients")
        .select("modules_enabled")
        .eq("id", selectedClient.id)
        .single();
      
      if (error) throw error;
      const modulesData = data?.modules_enabled as Record<string, boolean> | null;
      return modulesData ? { ...defaultModules, ...modulesData } : defaultModules;
    },
    enabled: !!selectedClient,
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
    if (!selectedClient) return true; // Show all when no client selected
    return modules[moduleName] ?? true;
  };

  const isAdmin = role === "admin" || role === "manager";

  return {
    modules,
    isLoading,
    isModuleEnabled,
    updateModules: updateModulesMutation.mutate,
    isUpdating: updateModulesMutation.isPending,
    isAdmin,
    selectedClient,
  };
}
