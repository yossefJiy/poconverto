import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useClient } from './useClient';
import { toast } from 'sonner';

export interface RealtimeNotification {
  id: string;
  type: 'task' | 'request' | 'credit' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const { selectedClient } = useClient();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: Omit<RealtimeNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: RealtimeNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
    
    // Show toast for important notifications
    toast.info(notification.title, {
      description: notification.message,
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen to new tasks
    const tasksChannel = supabase
      .channel('tasks-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: selectedClient ? `client_id=eq.${selectedClient.id}` : undefined,
        },
        (payload) => {
          addNotification({
            type: 'task',
            title: 'משימה חדשה',
            message: (payload.new as { title?: string }).title || 'משימה חדשה נוספה',
            data: payload.new as Record<string, unknown>,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: selectedClient ? `client_id=eq.${selectedClient.id}` : undefined,
        },
        (payload) => {
          const newData = payload.new as { status?: string; title?: string };
          const oldData = payload.old as { status?: string };
          
          if (newData.status === 'completed' && oldData.status !== 'completed') {
            addNotification({
              type: 'task',
              title: 'משימה הושלמה',
              message: newData.title || 'משימה סומנה כהושלמה',
              data: payload.new as Record<string, unknown>,
            });
          }
        }
      )
      .subscribe();

    // Listen to task requests
    const requestsChannel = supabase
      .channel('requests-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_requests',
          filter: selectedClient ? `client_id=eq.${selectedClient.id}` : undefined,
        },
        (payload) => {
          addNotification({
            type: 'request',
            title: 'בקשה חדשה',
            message: (payload.new as { title?: string }).title || 'בקשת משימה חדשה התקבלה',
            data: payload.new as Record<string, unknown>,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'task_requests',
        },
        (payload) => {
          const newData = payload.new as { status?: string; title?: string };
          const oldData = payload.old as { status?: string };
          
          if (newData.status !== oldData.status) {
            const statusLabels: Record<string, string> = {
              approved: 'אושרה',
              rejected: 'נדחתה',
              converted: 'הומרה למשימה',
            };
            
            addNotification({
              type: 'request',
              title: `בקשה ${statusLabels[newData.status || ''] || 'עודכנה'}`,
              message: newData.title || 'סטטוס הבקשה עודכן',
              data: payload.new as Record<string, unknown>,
            });
          }
        }
      )
      .subscribe();

    // Listen to credit changes
    const creditsChannel = supabase
      .channel('credits-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'client_credits',
          filter: selectedClient ? `client_id=eq.${selectedClient.id}` : undefined,
        },
        (payload) => {
          const newData = payload.new as { used_credits?: number; total_credits?: number };
          const oldData = payload.old as { used_credits?: number };
          
          if (newData.used_credits !== oldData.used_credits) {
            const remaining = (newData.total_credits || 0) - (newData.used_credits || 0);
            const percentUsed = newData.total_credits 
              ? Math.round((newData.used_credits || 0) / newData.total_credits * 100)
              : 0;
            
            if (percentUsed >= 90) {
              addNotification({
                type: 'credit',
                title: 'התראת קרדיטים',
                message: `נותרו ${remaining} קרדיטים (${100 - percentUsed}%)`,
                data: payload.new as Record<string, unknown>,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(creditsChannel);
    };
  }, [user, selectedClient, addNotification]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
  };
}
