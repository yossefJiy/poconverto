import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Ban, Shield } from "lucide-react";

export interface AICapabilityAlert {
  id: string;
  type: "daily_limit" | "dangerous_action" | "denied_action" | "approval_needed";
  title: string;
  message: string;
  agentId: string | null;
  agentName: string | null;
  capabilityName: string | null;
  clientId: string | null;
  createdAt: string;
  isRead: boolean;
}

export function useAICapabilityAlerts() {
  const queryClient = useQueryClient();
  const [alerts, setAlerts] = useState<AICapabilityAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch pending actions that need approval
  const { data: pendingActions = [] } = useQuery({
    queryKey: ["ai-pending-actions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agent_actions")
        .select(`
          *,
          agent:agent_id (name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch recent denied actions
  const { data: deniedUsage = [] } = useQuery({
    queryKey: ["ai-denied-usage"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from("ai_capability_usage")
        .select(`
          *,
          agent:agent_id (name),
          capability:capability_id (display_name, is_dangerous)
        `)
        .eq("was_allowed", false)
        .gte("executed_at", today.toISOString())
        .order("executed_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  // Fetch agents approaching daily limits
  const { data: limitAlerts = [] } = useQuery({
    queryKey: ["ai-limit-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agent_permissions")
        .select(`
          *,
          agent:agent_id (name),
          capability:capability_id (display_name)
        `)
        .not("max_daily_uses", "is", null)
        .order("current_daily_uses", { ascending: false });
      
      if (error) throw error;
      
      // Filter to those at 80% or more of daily limit
      return (data || []).filter(p => {
        if (!p.max_daily_uses) return false;
        const percent = (p.current_daily_uses || 0) / p.max_daily_uses * 100;
        return percent >= 80;
      });
    },
    refetchInterval: 60000,
  });

  // Subscribe to realtime updates for capability usage
  useEffect(() => {
    const channel = supabase
      .channel('ai-capability-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_capability_usage',
        },
        async (payload) => {
          const usage = payload.new as any;
          
          // If action was denied, show toast
          if (!usage.was_allowed) {
            // Fetch capability info
            const { data: capability } = await supabase
              .from("ai_capability_definitions")
              .select("display_name, is_dangerous")
              .eq("id", usage.capability_id)
              .single();

            const { data: agent } = await supabase
              .from("ai_agents")
              .select("name")
              .eq("id", usage.agent_id)
              .single();

            toast.error(
              <div className="flex items-center gap-2" dir="rtl">
                <Ban className="w-5 h-5 text-red-500" />
                <div className="flex-1">
                  <p className="font-medium">פעולה נחסמה</p>
                  <p className="text-sm text-muted-foreground">
                    {agent?.name || "סוכן"} ניסה לבצע: {capability?.display_name || "פעולה"}
                  </p>
                </div>
              </div>,
              { duration: 6000 }
            );
            
            queryClient.invalidateQueries({ queryKey: ["ai-denied-usage"] });
          }
          
          // Check if dangerous action was performed
          if (usage.was_allowed) {
            const { data: capability } = await supabase
              .from("ai_capability_definitions")
              .select("display_name, is_dangerous")
              .eq("id", usage.capability_id)
              .single();
              
            if (capability?.is_dangerous) {
              const { data: agent } = await supabase
                .from("ai_agents")
                .select("name")
                .eq("id", usage.agent_id)
                .single();

              toast.warning(
                <div className="flex items-center gap-2" dir="rtl">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <div className="flex-1">
                    <p className="font-medium">פעולה רגישה בוצעה</p>
                    <p className="text-sm text-muted-foreground">
                      {agent?.name || "סוכן"} ביצע: {capability?.display_name}
                    </p>
                  </div>
                </div>,
                { duration: 8000 }
              );
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_agent_actions',
        },
        (payload) => {
          const action = payload.new as any;
          
          if (action.status === "pending") {
            toast.info(
              <div className="flex items-center gap-2" dir="rtl">
                <Shield className="w-5 h-5 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium">נדרש אישור</p>
                  <p className="text-sm text-muted-foreground">
                    פעולה {action.action_type} ממתינה לאישור
                  </p>
                </div>
              </div>,
              {
                duration: 10000,
                action: {
                  label: "צפה",
                  onClick: () => window.location.href = "/agent-alerts",
                },
              }
            );
            
            queryClient.invalidateQueries({ queryKey: ["ai-pending-actions"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Build alerts list
  useEffect(() => {
    const newAlerts: AICapabilityAlert[] = [];

    // Pending actions needing approval
    pendingActions.forEach((action: any) => {
      newAlerts.push({
        id: `pending-${action.id}`,
        type: "approval_needed",
        title: "נדרש אישור",
        message: `פעולה ${action.action_type} ממתינה לאישור`,
        agentId: action.agent_id,
        agentName: action.agent?.name,
        capabilityName: action.action_type,
        clientId: action.client_id,
        createdAt: action.created_at,
        isRead: false,
      });
    });

    // Denied actions
    deniedUsage.forEach((usage: any) => {
      newAlerts.push({
        id: `denied-${usage.id}`,
        type: "denied_action",
        title: "פעולה נחסמה",
        message: usage.error_message || `${usage.capability?.display_name || "פעולה"} נחסמה`,
        agentId: usage.agent_id,
        agentName: usage.agent?.name,
        capabilityName: usage.capability?.display_name,
        clientId: usage.client_id,
        createdAt: usage.executed_at,
        isRead: false,
      });
    });

    // Limit alerts
    limitAlerts.forEach((perm: any) => {
      const percent = (perm.current_daily_uses || 0) / perm.max_daily_uses * 100;
      newAlerts.push({
        id: `limit-${perm.id}`,
        type: "daily_limit",
        title: percent >= 100 ? "הגבלה יומית הגיעה!" : "מתקרב להגבלה יומית",
        message: `${perm.agent?.name || "סוכן"} הגיע ל-${percent.toFixed(0)}% מהמכסה ל-${perm.capability?.display_name}`,
        agentId: perm.agent_id,
        agentName: perm.agent?.name,
        capabilityName: perm.capability?.display_name,
        clientId: perm.client_id,
        createdAt: perm.updated_at,
        isRead: false,
      });
    });

    // Sort by date
    newAlerts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setAlerts(newAlerts);
    setUnreadCount(newAlerts.length);
  }, [pendingActions, deniedUsage, limitAlerts]);

  const pendingActionsCount = pendingActions.length;
  const deniedTodayCount = deniedUsage.length;
  const limitWarningsCount = limitAlerts.length;
  const totalCount = pendingActionsCount + deniedTodayCount + limitWarningsCount;

  return {
    alerts,
    unreadCount,
    totalCount,
    pendingActions,
    pendingActionsCount,
    deniedTodayCount,
    limitWarningsCount,
    markAsRead: (alertId: string) => {
      setAlerts(prev => 
        prev.map(a => a.id === alertId ? { ...a, isRead: true } : a)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    },
    clearAll: () => {
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
      setUnreadCount(0);
    },
  };
}
