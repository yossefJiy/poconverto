import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  Ban,
  Check,
  X,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAICapabilityAlerts, AICapabilityAlert } from "@/hooks/useAICapabilityAlerts";

export default function AgentAlerts() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedAction, setSelectedAction] = useState<any>(null);

  // Use the centralized alerts hook
  const {
    alerts,
    pendingActions,
    pendingActionsCount,
    deniedTodayCount,
    limitWarningsCount,
    totalCount,
  } = useAICapabilityAlerts();

  // Approve action mutation
  const approveMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const { error } = await supabase
        .from("ai_agent_actions")
        .update({ 
          status: "approved", 
          approved_at: new Date().toISOString(),
        })
        .eq("id", actionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-pending-actions"] });
      toast.success("הפעולה אושרה");
      setSelectedAction(null);
    },
    onError: () => toast.error("שגיאה באישור הפעולה"),
  });

  // Reject action mutation
  const rejectMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const { error } = await supabase
        .from("ai_agent_actions")
        .update({ status: "rejected" })
        .eq("id", actionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-pending-actions"] });
      toast.success("הפעולה נדחתה");
      setSelectedAction(null);
    },
    onError: () => toast.error("שגיאה בדחיית הפעולה"),
  });

  // Filter alerts by type for each tab
  const pendingAlerts = alerts.filter(a => a.type === "approval_needed");
  const deniedAlerts = alerts.filter(a => a.type === "denied_action");
  const limitAlerts = alerts.filter(a => a.type === "daily_limit");

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ai-pending-actions"] });
    queryClient.invalidateQueries({ queryKey: ["ai-denied-usage"] });
    queryClient.invalidateQueries({ queryKey: ["ai-limit-alerts"] });
    toast.success("הנתונים רועננו");
  };

  const renderAlertCard = (alert: AICapabilityAlert) => {
    const typeConfig = {
      approval_needed: { icon: Clock, color: "text-warning", bgColor: "bg-warning/10", borderColor: "border-warning" },
      denied_action: { icon: Ban, color: "text-destructive", bgColor: "bg-destructive/10", borderColor: "border-destructive" },
      daily_limit: { icon: AlertCircle, color: "text-warning", bgColor: "bg-warning/10", borderColor: "border-warning" },
      dangerous_action: { icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/10", borderColor: "border-destructive" },
    };

    const config = typeConfig[alert.type] || typeConfig.approval_needed;
    const Icon = config.icon;

    // Find the original action for pending alerts
    const originalAction = alert.type === "approval_needed" 
      ? pendingActions.find((a: any) => `pending-${a.id}` === alert.id)
      : null;

    return (
      <div
        key={alert.id}
        className={cn(
          "glass rounded-xl p-4 border-r-4 transition-colors",
          config.borderColor,
          alert.type === "approval_needed" && "cursor-pointer hover:bg-muted/50"
        )}
        onClick={() => alert.type === "approval_needed" && originalAction && setSelectedAction(originalAction)}
      >
        <div className="flex items-start gap-4">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", config.bgColor)}>
            <Icon className={cn("w-5 h-5", config.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-medium">{alert.title}</h4>
              {alert.agentName && (
                <Badge variant="secondary">{alert.agentName}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{alert.message}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(alert.createdAt), "d בMMMM, HH:mm", { locale: he })}
            </p>
          </div>
          {alert.type === "approval_needed" && originalAction && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="text-success border-success/50 hover:bg-success/10"
                onClick={(e) => {
                  e.stopPropagation();
                  approveMutation.mutate(originalAction.id);
                }}
                disabled={approveMutation.isPending}
              >
                <Check className="w-4 h-4 ml-1" />
                אשר
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  rejectMutation.mutate(originalAction.id);
                }}
                disabled={rejectMutation.isPending}
              >
                <X className="w-4 h-4 ml-1" />
                דחה
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6" dir="rtl">
        <PageHeader 
          title="מרכז התראות AI"
          description="ניהול בקשות ממתינות, פעולות שנחסמו והתראות מכסה"
          actions={
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              רענן
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingActionsCount}</p>
                <p className="text-sm text-muted-foreground">ממתינות לאישור</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Ban className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deniedTodayCount}</p>
                <p className="text-sm text-muted-foreground">נחסמו היום</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{limitWarningsCount}</p>
                <p className="text-sm text-muted-foreground">אזהרות מכסה</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-sm text-muted-foreground">סה״כ התראות</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="w-4 h-4" />
              ממתינות
              {pendingActionsCount > 0 && (
                <Badge className="bg-warning text-warning-foreground h-5 min-w-5">
                  {pendingActionsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="denied" className="gap-2">
              <Ban className="w-4 h-4" />
              נחסמו
              {deniedTodayCount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground h-5 min-w-5">
                  {deniedTodayCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="limits" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              מכסות
              {limitWarningsCount > 0 && (
                <Badge className="bg-warning text-warning-foreground h-5 min-w-5">
                  {limitWarningsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Bell className="w-4 h-4" />
              הכל
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingAlerts.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success" />
                <h3 className="text-lg font-semibold mb-2">אין בקשות ממתינות</h3>
                <p className="text-muted-foreground">כל הפעולות אושרו או נדחו</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAlerts.map(renderAlertCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="denied" className="mt-6">
            {deniedAlerts.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success" />
                <h3 className="text-lg font-semibold mb-2">אין פעולות שנחסמו</h3>
                <p className="text-muted-foreground">כל הפעולות עברו בהצלחה</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deniedAlerts.map(renderAlertCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="limits" className="mt-6">
            {limitAlerts.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success" />
                <h3 className="text-lg font-semibold mb-2">אין אזהרות מכסה</h3>
                <p className="text-muted-foreground">כל הסוכנים בטווח השימוש התקין</p>
              </div>
            ) : (
              <div className="space-y-3">
                {limitAlerts.map(renderAlertCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {alerts.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success" />
                <h3 className="text-lg font-semibold mb-2">אין התראות</h3>
                <p className="text-muted-foreground">המערכת פועלת כרגיל</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(renderAlertCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Detail Dialog */}
        <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
          <DialogContent className="max-w-lg" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-warning" />
                פרטי בקשה לאישור
              </DialogTitle>
            </DialogHeader>
            {selectedAction && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">סוג פעולה:</span>
                    <Badge variant="secondary">{selectedAction.action_type}</Badge>
                  </div>
                  {selectedAction.agent?.name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">סוכן:</span>
                      <span className="font-medium">{selectedAction.agent.name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">תאריך:</span>
                    <span>{format(new Date(selectedAction.created_at), "d בMMMM yyyy, HH:mm", { locale: he })}</span>
                  </div>
                </div>

                {selectedAction.action_data && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">פרטי הפעולה:</p>
                    <ScrollArea className="h-[200px] rounded-lg border p-3 bg-muted/30">
                      <pre className="text-xs whitespace-pre-wrap" dir="ltr">
                        {JSON.stringify(selectedAction.action_data, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedAction(null)}
                  >
                    ביטול
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={() => rejectMutation.mutate(selectedAction.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <X className="w-4 h-4 ml-1" />
                    דחה
                  </Button>
                  <Button
                    className="bg-success text-success-foreground hover:bg-success/90"
                    onClick={() => approveMutation.mutate(selectedAction.id)}
                    disabled={approveMutation.isPending}
                  >
                    <Check className="w-4 h-4 ml-1" />
                    אשר פעולה
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
