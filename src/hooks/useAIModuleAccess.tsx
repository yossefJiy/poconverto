import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { useAuth } from "@/hooks/useAuth";

export interface AIModuleSettings {
  id: string;
  client_id: string;
  module_name: string;
  is_enabled: boolean;
  allowed_capabilities: string[];
  restricted_for_users: string[];
  allowed_for_users: string[];
  settings: Record<string, any>;
}

export interface AITeamPermission {
  id: string;
  team_member_id: string;
  client_id: string;
  module_name: string;
  can_use_ai: boolean;
  can_approve_actions: boolean;
  max_daily_requests: number;
  current_daily_requests: number;
}

interface UseAIModuleAccessReturn {
  isEnabled: boolean;
  canUseAI: boolean;
  canApprove: boolean;
  capabilities: string[];
  settings: Record<string, any>;
  isLoading: boolean;
  moduleSettings: AIModuleSettings | null;
  teamPermission: AITeamPermission | null;
}

export function useAIModuleAccess(moduleName: string): UseAIModuleAccessReturn {
  const { selectedClient } = useClient();
  const { user } = useAuth();

  // Fetch module settings for the current client
  const { data: moduleSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["ai-module-settings", selectedClient?.id, moduleName],
    queryFn: async () => {
      if (!selectedClient?.id) return null;
      
      const { data, error } = await supabase
        .from("ai_module_settings")
        .select("*")
        .eq("client_id", selectedClient.id)
        .eq("module_name", moduleName)
        .maybeSingle();
      
      if (error) throw error;
      return data as AIModuleSettings | null;
    },
    enabled: !!selectedClient?.id,
  });

  // Fetch team member ID for current user
  const { data: teamMember } = useQuery({
    queryKey: ["team-member-for-user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from("team")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch team permission for the current user and module
  const { data: teamPermission, isLoading: permissionLoading } = useQuery({
    queryKey: ["ai-team-permission", teamMember?.id, selectedClient?.id, moduleName],
    queryFn: async () => {
      if (!teamMember?.id || !selectedClient?.id) return null;
      
      const { data, error } = await supabase
        .from("ai_team_permissions")
        .select("*")
        .eq("team_member_id", teamMember.id)
        .eq("client_id", selectedClient.id)
        .eq("module_name", moduleName)
        .maybeSingle();
      
      if (error) throw error;
      return data as AITeamPermission | null;
    },
    enabled: !!teamMember?.id && !!selectedClient?.id,
  });

  // Default: AI is enabled if no settings exist (backwards compatible)
  const isEnabled = moduleSettings?.is_enabled ?? true;
  
  // Check if user is explicitly restricted
  const isUserRestricted = user?.id && moduleSettings?.restricted_for_users?.includes(user.id);
  
  // Check if user is explicitly allowed (if allowed_for_users is set and not empty)
  const hasAllowList = moduleSettings?.allowed_for_users && moduleSettings.allowed_for_users.length > 0;
  const isUserInAllowList = user?.id && moduleSettings?.allowed_for_users?.includes(user.id);
  
  // User can use AI if:
  // 1. Module is enabled
  // 2. User is not restricted
  // 3. Either no allow list exists, or user is in the allow list
  // 4. Team permission allows it (if exists)
  const canUseAI = isEnabled && 
    !isUserRestricted && 
    (!hasAllowList || isUserInAllowList) &&
    (teamPermission?.can_use_ai ?? true);
  
  // Can approve actions
  const canApprove = teamPermission?.can_approve_actions ?? false;
  
  // Get allowed capabilities
  const capabilities = moduleSettings?.allowed_capabilities ?? [];
  
  // Get settings
  const settings = moduleSettings?.settings ?? {};

  return {
    isEnabled,
    canUseAI,
    canApprove,
    capabilities,
    settings,
    isLoading: settingsLoading || permissionLoading,
    moduleSettings,
    teamPermission,
  };
}

// Hook to check all modules at once
export function useAllAIModulesAccess() {
  const { selectedClient } = useClient();

  const { data: allSettings = [], isLoading } = useQuery({
    queryKey: ["ai-all-module-settings", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      
      const { data, error } = await supabase
        .from("ai_module_settings")
        .select("*")
        .eq("client_id", selectedClient.id);
      
      if (error) throw error;
      return data as AIModuleSettings[];
    },
    enabled: !!selectedClient?.id,
  });

  const isModuleAIEnabled = (moduleName: string): boolean => {
    const setting = allSettings.find(s => s.module_name === moduleName);
    return setting?.is_enabled ?? true; // Default to enabled
  };

  return {
    allSettings,
    isLoading,
    isModuleAIEnabled,
  };
}
