import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  Clock,
  RefreshCw,
  Loader2,
  Send
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface NotificationHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string;
}

interface NotificationRecord {
  id: string;
  task_id: string;
  client_id: string | null;
  notification_type: 'email' | 'sms';
  recipient: string;
  status: 'pending' | 'sent' | 'failed';
  subject: string | null;
  message: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  tasks?: { title: string } | null;
  clients?: { name: string } | null;
}

export function NotificationHistoryDialog({ 
  open, 
  onOpenChange,
  taskId 
}: NotificationHistoryDialogProps) {
  const [testingReminder, setTestingReminder] = useState(false);

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notification-history', taskId],
    queryFn: async () => {
      let query = supabase
        .from('notification_history')
        .select(`
          *,
          tasks(title),
          clients(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as NotificationRecord[];
    },
    enabled: open,
  });

  const testReminder = async (taskIdToTest: string) => {
    setTestingReminder(true);
    try {
      const { data, error } = await supabase.functions.invoke('task-reminder', {
        body: { test: true, taskId: taskIdToTest }
      });

      if (error) throw error;

      if (data.results?.emailsSent > 0 || data.results?.smsSent > 0) {
        toast.success(`נשלח בהצלחה! מיילים: ${data.results.emailsSent}, SMS: ${data.results.smsSent}`);
      } else if (data.results?.errors?.length > 0) {
        toast.error(`שגיאות: ${data.results.errors.join(', ')}`);
      } else {
        toast.info('לא נמצאו הגדרות לשליחה במשימה זו');
      }

      refetch();
    } catch (error) {
      console.error('Test reminder error:', error);
      toast.error('שגיאה בשליחת תזכורת בדיקה');
    } finally {
      setTestingReminder(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-success/10 text-success gap-1"><CheckCircle2 className="w-3 h-3" />נשלח</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive gap-1"><XCircle className="w-3 h-3" />נכשל</Badge>;
      default:
        return <Badge className="bg-warning/10 text-warning gap-1"><Clock className="w-3 h-3" />ממתין</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'email' ? (
      <Mail className="w-4 h-4 text-primary" />
    ) : (
      <Phone className="w-4 h-4 text-success" />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>היסטוריית התראות</span>
            <div className="flex items-center gap-2">
              {taskId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => testReminder(taskId)}
                  disabled={testingReminder}
                  className="gap-2"
                >
                  {testingReminder ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  שלח בדיקה
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refetch()}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                רענן
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>אין היסטוריית התראות</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications?.map((notification) => (
                <div 
                  key={notification.id}
                  className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getTypeIcon(notification.notification_type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStatusBadge(notification.status)}
                          <span className="text-sm font-medium truncate">
                            {notification.tasks?.title || 'משימה לא ידועה'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.notification_type === 'email' ? 'מייל' : 'SMS'} ל: {notification.recipient}
                        </p>
                        {notification.clients?.name && (
                          <p className="text-xs text-muted-foreground">
                            לקוח: {notification.clients.name}
                          </p>
                        )}
                        {notification.error_message && (
                          <p className="text-xs text-destructive mt-1">
                            שגיאה: {notification.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-left text-xs text-muted-foreground whitespace-nowrap">
                      {notification.sent_at ? (
                        <div>
                          <div>נשלח:</div>
                          <div>{format(new Date(notification.sent_at), 'dd/MM/yyyy HH:mm')}</div>
                        </div>
                      ) : (
                        <div>
                          <div>נוצר:</div>
                          <div>{format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm')}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
