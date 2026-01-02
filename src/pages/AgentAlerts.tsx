import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bell,
  AlertTriangle,
  Target,
  BarChart3,
  ShoppingCart,
  ListTodo,
  Users,
  TrendingUp,
  Lightbulb,
  FileText,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Alert types configuration
const alertModuleConfig: Record<string, { icon: any; label: string; color: string; bgColor: string }> = {
  marketing: { icon: Target, label: "שיווק", color: "text-blue-500", bgColor: "bg-blue-500/10" },
  analytics: { icon: BarChart3, label: "אנליטיקס", color: "text-green-500", bgColor: "bg-green-500/10" },
  ecommerce: { icon: ShoppingCart, label: "איקומרס", color: "text-orange-500", bgColor: "bg-orange-500/10" },
  tasks: { icon: ListTodo, label: "משימות", color: "text-purple-500", bgColor: "bg-purple-500/10" },
  campaigns: { icon: TrendingUp, label: "קמפיינים", color: "text-pink-500", bgColor: "bg-pink-500/10" },
  team: { icon: Users, label: "צוות", color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
  insights: { icon: Lightbulb, label: "תובנות", color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  reports: { icon: FileText, label: "דוחות", color: "text-amber-500", bgColor: "bg-amber-500/10" },
};

interface AgentAlert {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
  metadata: {
    moduleType?: string;
    clientId?: string;
    isAlert?: boolean;
  } | null;
  conversation?: {
    agent_type: string;
    client_id: string | null;
    title: string | null;
    client?: {
      name: string;
    };
  };
}

export default function AgentAlerts() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [filterModule, setFilterModule] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<AgentAlert | null>(null);

  // Fetch all alerts (messages containing alert keywords)
  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ["agent-alerts", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("chat_messages")
        .select(`
          id,
          conversation_id,
          role,
          content,
          created_at,
          metadata,
          conversation:chat_conversations!inner(
            agent_type,
            client_id,
            title,
            client:clients(name)
          )
        `)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(100);
      
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
      
      return alertMessages as AgentAlert[];
    },
  });

  // Get module type from agent_type
  const getModuleFromAgentType = (agentType: string) => {
    return agentType?.replace("module_", "") || "insights";
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (filterModule === "all") return true;
    const module = getModuleFromAgentType(alert.conversation?.agent_type || "");
    return module === filterModule;
  });

  // Group alerts by date
  const groupedAlerts: Record<string, AgentAlert[]> = {};
  filteredAlerts.forEach(alert => {
    const date = format(new Date(alert.created_at), "yyyy-MM-dd");
    if (!groupedAlerts[date]) {
      groupedAlerts[date] = [];
    }
    groupedAlerts[date].push(alert);
  });

  // Get alert summary text
  const getAlertSummary = (content: string) => {
    const lines = content.split("\n").filter(l => l.trim());
    const firstAlertLine = lines.find(l => 
      l.includes("🚨") || l.includes("התראה") || l.includes("חריגה") || l.includes("⚠️")
    );
    return firstAlertLine?.slice(0, 150) || lines[0]?.slice(0, 150) || "התראה מסוכן AI";
  };

  // Stats
  const todayAlerts = alerts.filter(a => 
    format(new Date(a.created_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  ).length;

  const moduleStats = Object.entries(alertModuleConfig).map(([key, config]) => ({
    key,
    ...config,
    count: alerts.filter(a => getModuleFromAgentType(a.conversation?.agent_type || "") === key).length,
  })).filter(m => m.count > 0);

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6" dir="rtl">
        <PageHeader 
          title="מרכז התראות AI"
          description="כל ההתראות והחריגות שזוהו על ידי סוכני AI"
          actions={
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("w-4 h-4 ml-2", isLoading && "animate-spin")} />
              רענן
            </Button>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{alerts.length}</p>
                <p className="text-sm text-muted-foreground">סה״כ התראות</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayAlerts}</p>
                <p className="text-sm text-muted-foreground">התראות היום</p>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl p-4 col-span-2">
            <p className="text-sm font-medium mb-2">לפי מודול</p>
            <div className="flex flex-wrap gap-2">
              {moduleStats.length > 0 ? moduleStats.map(stat => {
                const Icon = stat.icon;
                return (
                  <Badge 
                    key={stat.key} 
                    variant="secondary" 
                    className={cn("gap-1", stat.bgColor)}
                  >
                    <Icon className={cn("w-3 h-3", stat.color)} />
                    {stat.label}: {stat.count}
                  </Badge>
                );
              }) : (
                <span className="text-sm text-muted-foreground">אין התראות</span>
              )}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">סינון:</span>
          </div>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המודולים</SelectItem>
              {Object.entries(alertModuleConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <config.icon className={cn("w-4 h-4", config.color)} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Alerts List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success" />
            <h3 className="text-lg font-semibold mb-2">אין התראות</h3>
            <p className="text-muted-foreground">
              סוכני AI לא זיהו חריגות או התראות
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedAlerts).map(([date, dateAlerts]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {format(new Date(date), "EEEE, d בMMMM yyyy", { locale: he })}
                  </h3>
                  <Badge variant="secondary">{dateAlerts.length}</Badge>
                </div>
                
                <div className="space-y-2">
                  {dateAlerts.map(alert => {
                    const moduleType = getModuleFromAgentType(alert.conversation?.agent_type || "");
                    const moduleConfig = alertModuleConfig[moduleType] || alertModuleConfig.insights;
                    const ModuleIcon = moduleConfig.icon;
                    
                    return (
                      <div 
                        key={alert.id} 
                        className={cn(
                          "glass rounded-xl p-4 border-r-4 cursor-pointer hover:bg-muted/50 transition-colors",
                          "border-warning"
                        )}
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            moduleConfig.bgColor
                          )}>
                            <ModuleIcon className={cn("w-5 h-5", moduleConfig.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="gap-1 text-warning border-warning/30">
                                <AlertTriangle className="w-3 h-3" />
                                התראה
                              </Badge>
                              <Badge variant="secondary" className={moduleConfig.bgColor}>
                                {moduleConfig.label}
                              </Badge>
                              {alert.conversation?.client && (
                                <Badge variant="outline">
                                  {(alert.conversation.client as any)?.name}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm line-clamp-2">
                              {getAlertSummary(alert.content)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(alert.created_at), "HH:mm", { locale: he })}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alert Detail Dialog */}
        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                פרטי התראה
              </DialogTitle>
            </DialogHeader>
            {selectedAlert && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const moduleType = getModuleFromAgentType(selectedAlert.conversation?.agent_type || "");
                    const moduleConfig = alertModuleConfig[moduleType] || alertModuleConfig.insights;
                    return (
                      <Badge className={cn("gap-1", moduleConfig.bgColor)}>
                        <moduleConfig.icon className={cn("w-3 h-3", moduleConfig.color)} />
                        {moduleConfig.label}
                      </Badge>
                    );
                  })()}
                  <Badge variant="outline">
                    {format(new Date(selectedAlert.created_at), "d בMMMM yyyy, HH:mm", { locale: he })}
                  </Badge>
                  {selectedAlert.conversation?.client && (
                    <Badge variant="secondary">
                      לקוח: {(selectedAlert.conversation.client as any)?.name}
                    </Badge>
                  )}
                </div>
                
                <ScrollArea className="h-[400px] rounded-lg border p-4 bg-muted/30">
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap" dir="rtl">
                    {selectedAlert.content}
                  </div>
                </ScrollArea>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                    סגור
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
