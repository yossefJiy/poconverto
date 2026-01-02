import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export function useAgentAlerts() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch alerts count
  const { data: alertsCount = 0 } = useQuery({
    queryKey: ["agent-alerts-count", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("chat_messages")
        .select("id, content, conversation:chat_conversations!inner(client_id)", { count: "exact", head: true })
        .eq("role", "assistant");
      
      if (selectedClient) {
        query = query.eq("conversation.client_id", selectedClient.id);
      }
      
      const { count, error } = await query;
      if (error) throw error;
      
      return count || 0;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch today's alerts for unread count
  const { data: todayAlerts = [] } = useQuery({
    queryKey: ["agent-alerts-today", selectedClient?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let query = supabase
        .from("chat_messages")
        .select(`
          id,
          content,
          created_at,
          conversation:chat_conversations!inner(client_id, agent_type)
        `)
        .eq("role", "assistant")
        .gte("created_at", today.toISOString());
      
      if (selectedClient) {
        query = query.eq("conversation.client_id", selectedClient.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Filter for alert messages
      const alertMessages = (data || []).filter((msg: any) => {
        const content = msg.content || "";
        return content.includes("🚨") || 
               content.includes("התראה:") || 
               content.includes("חריגה") ||
               content.includes("אזהרה") ||
               content.includes("⚠️");
      });
      
      return alertMessages;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set unread count based on today's alerts
  useEffect(() => {
    setUnreadCount(todayAlerts.length);
  }, [todayAlerts]);

  // Subscribe to realtime updates for new chat messages
  useEffect(() => {
    const channel = supabase
      .channel('agent-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const content = payload.new?.content || "";
          const isAlert = content.includes("🚨") || 
                         content.includes("התראה:") || 
                         content.includes("חריגה") ||
                         content.includes("אזהרה") ||
                         content.includes("⚠️");
          
          if (isAlert && payload.new?.role === "assistant") {
            // Show push notification
            toast.warning(
              <div className="flex items-center gap-2" dir="rtl">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <div className="flex-1">
                  <p className="font-medium">התראה חדשה מסוכן AI</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {content.slice(0, 100)}...
                  </p>
                </div>
              </div>,
              {
                duration: 8000,
                action: {
                  label: "צפה",
                  onClick: () => window.location.href = "/agent-alerts",
                },
              }
            );
            
            // Update unread count
            setUnreadCount(prev => prev + 1);
            
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["agent-alerts"] });
            queryClient.invalidateQueries({ queryKey: ["agent-alerts-today"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, selectedClient?.id]);

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Send browser notification for critical alerts
  const sendBrowserNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: "agent-alert",
      });
    }
  };

  return {
    unreadCount,
    todayAlerts,
    totalAlerts: alertsCount,
    clearUnread: () => setUnreadCount(0),
    sendBrowserNotification,
  };
}
