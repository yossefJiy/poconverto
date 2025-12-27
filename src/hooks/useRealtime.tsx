import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useClient } from './useClient';

interface Notification {
  id: string;
  type: 'task' | 'campaign' | 'integration' | 'goal';
  action: 'created' | 'updated' | 'deleted' | 'completed';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

export function useRealtime() {
  const { selectedClient } = useClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
    
    toast(notification.title, {
      description: notification.description,
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

  useEffect(() => {
    if (!selectedClient?.id) return;

    // Subscribe to tasks changes
    const tasksChannel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `client_id=eq.${selectedClient.id}`,
        },
        (payload) => {
          const event = payload.eventType;
          const task = payload.new as any;
          
          if (event === 'INSERT') {
            addNotification({
              type: 'task',
              action: 'created',
              title: 'משימה חדשה',
              description: task.title,
            });
          } else if (event === 'UPDATE' && task.status === 'completed') {
            addNotification({
              type: 'task',
              action: 'completed',
              title: 'משימה הושלמה',
              description: task.title,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to campaigns changes
    const campaignsChannel = supabase
      .channel('campaigns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `client_id=eq.${selectedClient.id}`,
        },
        (payload) => {
          const event = payload.eventType;
          const campaign = payload.new as any;
          
          if (event === 'INSERT') {
            addNotification({
              type: 'campaign',
              action: 'created',
              title: 'קמפיין חדש',
              description: campaign.name,
            });
          } else if (event === 'UPDATE') {
            addNotification({
              type: 'campaign',
              action: 'updated',
              title: 'קמפיין עודכן',
              description: campaign.name,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to integrations changes
    const integrationsChannel = supabase
      .channel('integrations-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'integrations',
          filter: `client_id=eq.${selectedClient.id}`,
        },
        (payload) => {
          const integration = payload.new as any;
          if (integration.last_sync_at) {
            addNotification({
              type: 'integration',
              action: 'updated',
              title: 'סנכרון הושלם',
              description: `${integration.platform} סונכרן בהצלחה`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(campaignsChannel);
      supabase.removeChannel(integrationsChannel);
    };
  }, [selectedClient?.id, addNotification]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
