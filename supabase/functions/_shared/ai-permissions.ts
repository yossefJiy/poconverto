import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  dailyUsageRemaining?: number;
}

/**
 * Check if AI is enabled for a specific module and client
 */
export async function checkAIModulePermission(
  clientId: string | null,
  moduleName: string,
  userId?: string
): Promise<PermissionCheckResult> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase credentials not available for permission check');
    return { allowed: true }; // Allow if we can't check
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Check module-level AI settings
    if (clientId) {
      const { data: moduleSettings } = await supabase
        .from('ai_module_settings')
        .select('is_enabled, restricted_for_users, allowed_for_users')
        .eq('client_id', clientId)
        .eq('module_name', moduleName)
        .single();

      if (moduleSettings) {
        // Check if module AI is disabled
        if (moduleSettings.is_enabled === false) {
          return { 
            allowed: false, 
            reason: `AI is disabled for ${moduleName} module` 
          };
        }

        // Check user-specific restrictions
        if (userId) {
          const restrictedUsers = moduleSettings.restricted_for_users || [];
          if (restrictedUsers.includes(userId)) {
            return { 
              allowed: false, 
              reason: 'User is restricted from using AI in this module' 
            };
          }

          const allowedUsers = moduleSettings.allowed_for_users || [];
          if (allowedUsers.length > 0 && !allowedUsers.includes(userId)) {
            return { 
              allowed: false, 
              reason: 'User is not in the allowed list for AI in this module' 
            };
          }
        }
      }
    }

    // Check team member daily limits if userId is provided
    if (userId && clientId) {
      const { data: teamMember } = await supabase
        .from('team')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (teamMember) {
        const { data: teamPermission } = await supabase
          .from('ai_team_permissions')
          .select('*')
          .eq('team_member_id', teamMember.id)
          .eq('module_name', moduleName)
          .single();

        if (teamPermission) {
          // Check if AI is disabled for this team member
          if (teamPermission.can_use_ai === false) {
            return { 
              allowed: false, 
              reason: 'AI is disabled for this team member' 
            };
          }

          // Check daily usage limit
          const today = new Date().toISOString().split('T')[0];
          const lastReset = teamPermission.last_reset_at;
          
          let currentUsage = teamPermission.current_daily_requests || 0;
          
          // Reset counter if it's a new day
          if (lastReset !== today) {
            await supabase
              .from('ai_team_permissions')
              .update({ 
                current_daily_requests: 0, 
                last_reset_at: today 
              })
              .eq('id', teamPermission.id);
            currentUsage = 0;
          }

          const maxDaily = teamPermission.max_daily_requests || 50;
          if (currentUsage >= maxDaily) {
            return { 
              allowed: false, 
              reason: 'Daily AI request limit reached',
              dailyUsageRemaining: 0
            };
          }

          return {
            allowed: true,
            dailyUsageRemaining: maxDaily - currentUsage
          };
        }
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking AI permissions:', error);
    return { allowed: true }; // Allow if permission check fails
  }
}

/**
 * Increment the daily usage counter for a team member
 */
export async function incrementAIUsage(
  userId: string,
  moduleName: string
): Promise<void> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: teamMember } = await supabase
      .from('team')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (teamMember) {
      const { data: existing } = await supabase
        .from('ai_team_permissions')
        .select('id, current_daily_requests')
        .eq('team_member_id', teamMember.id)
        .eq('module_name', moduleName)
        .single();

      if (existing) {
        await supabase
          .from('ai_team_permissions')
          .update({ 
            current_daily_requests: (existing.current_daily_requests || 0) + 1 
          })
          .eq('id', existing.id);
      }
    }
  } catch (error) {
    console.error('Error incrementing AI usage:', error);
  }
}
