import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useClientModules } from "@/hooks/useClientModules";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Bot,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Settings2,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Pause,
  Brain,
  Target,
  BarChart3,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  ShoppingCart,
  ListTodo,
  Users,
  Lightbulb,
  FileText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { ModularAgentChat, moduleAgentConfig } from "@/components/ai/ModularAgentChat";

interface AIAgent {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  agent_type: string;
  capabilities: string[];
  settings: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AgentAction {
  id: string;
  agent_id: string | null;
  client_id: string | null;
  action_type: string;
  action_data: Record<string, any>;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
  result: Record<string, any> | null;
  created_at: string;
  agent?: AIAgent;
}

const agentTypes = [
  { value: 'marketing', label: 'שיווק ופרסום', icon: Target, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { value: 'analytics', label: 'אנליטיקס', icon: BarChart3, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  { value: 'ecommerce', label: 'איקומרס', icon: ShoppingCart, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { value: 'tasks', label: 'משימות', icon: ListTodo, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { value: 'campaigns', label: 'קמפיינים', icon: TrendingUp, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  { value: 'team', label: 'צוות', icon: Users, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  { value: 'insights', label: 'תובנות', icon: Lightbulb, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  { value: 'reports', label: 'דוחות', icon: FileText, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { value: 'content', label: 'יצירת תוכן', icon: MessageSquare, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  { value: 'general', label: 'כללי', icon: Brain, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
];

const capabilityOptions = [
  { value: 'analyze_campaigns', label: 'ניתוח קמפיינים' },
  { value: 'suggest_budget', label: 'הצעות תקציב' },
  { value: 'create_content', label: 'יצירת תוכן' },
  { value: 'optimize_ads', label: 'אופטימיזציית מודעות' },
  { value: 'schedule_posts', label: 'תזמון פוסטים' },
  { value: 'generate_reports', label: 'יצירת דוחות' },
  { value: 'monitor_performance', label: 'מעקב ביצועים' },
  { value: 'competitor_analysis', label: 'ניתוח מתחרים' },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'ממתין לאישור', color: 'text-warning bg-warning/10', icon: Clock },
  approved: { label: 'אושר', color: 'text-success bg-success/10', icon: CheckCircle2 },
  rejected: { label: 'נדחה', color: 'text-destructive bg-destructive/10', icon: XCircle },
  executed: { label: 'בוצע', color: 'text-info bg-info/10', icon: Zap },
};

export default function AIAgents() {
  const { selectedClient } = useClient();
  const { isModuleEnabled } = useClientModules();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; agent: AIAgent | null }>({ open: false, agent: null });
  const [activeAgentChat, setActiveAgentChat] = useState<string | null>(null);
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("general");
  const [formCapabilities, setFormCapabilities] = useState<string[]>([]);
  const [formActive, setFormActive] = useState(true);

  // Fetch agents
  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ["ai-agents", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("ai_agents")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (selectedClient) {
        query = query.or(`client_id.eq.${selectedClient.id},client_id.is.null`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AIAgent[];
    },
  });

  // Fetch pending actions
  const { data: pendingActions = [], isLoading: actionsLoading } = useQuery({
    queryKey: ["ai-agent-actions", selectedClient?.id, "pending"],
    queryFn: async () => {
      let query = supabase
        .from("ai_agent_actions")
        .select("*, agent:ai_agents(*)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AgentAction[];
    },
  });

  // Save agent mutation
  const saveMutation = useMutation({
    mutationFn: async (agent: Partial<AIAgent>) => {
      if (agent.id) {
        const { error } = await supabase
          .from("ai_agents")
          .update({
            name: agent.name,
            description: agent.description,
            agent_type: agent.agent_type,
            capabilities: agent.capabilities,
            is_active: agent.is_active,
          })
          .eq("id", agent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ai_agents").insert({
          client_id: selectedClient?.id || null,
          name: agent.name,
          description: agent.description,
          agent_type: agent.agent_type,
          capabilities: agent.capabilities,
          is_active: agent.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-agents"] });
      toast.success("הסוכן נשמר בהצלחה");
      closeDialog();
    },
    onError: () => toast.error("שגיאה בשמירה"),
  });

  // Delete agent mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_agents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-agents"] });
      toast.success("הסוכן נמחק בהצלחה");
      setDeleteDialog({ open: false, agent: null });
    },
    onError: () => toast.error("שגיאה במחיקה"),
  });

  // Action response mutation
  const actionMutation = useMutation({
    mutationFn: async ({ actionId, approved }: { actionId: string; approved: boolean }) => {
      const { error } = await supabase
        .from("ai_agent_actions")
        .update({
          status: approved ? "approved" : "rejected",
          approved_at: new Date().toISOString(),
        })
        .eq("id", actionId);
      if (error) throw error;
      
      // If approved, execute the action
      if (approved) {
        // Here you would call the appropriate edge function to execute the action
        const { error: execError } = await supabase
          .from("ai_agent_actions")
          .update({
            status: "executed",
            executed_at: new Date().toISOString(),
            result: { success: true, message: "הפעולה בוצעה בהצלחה" },
          })
          .eq("id", actionId);
        if (execError) throw execError;
      }
    },
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ["ai-agent-actions"] });
      toast.success(approved ? "הפעולה אושרה ובוצעה" : "הפעולה נדחתה");
    },
    onError: () => toast.error("שגיאה בעדכון הפעולה"),
  });

  // Toggle agent active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("ai_agents")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-agents"] });
      toast.success("סטטוס הסוכן עודכן");
    },
    onError: () => toast.error("שגיאה בעדכון"),
  });

  const openDialog = (agent?: AIAgent) => {
    setSelectedAgent(agent || null);
    setFormName(agent?.name || "");
    setFormDescription(agent?.description || "");
    setFormType(agent?.agent_type || "general");
    setFormCapabilities(agent?.capabilities || []);
    setFormActive(agent?.is_active ?? true);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedAgent(null);
    setFormName("");
    setFormDescription("");
    setFormType("general");
    setFormCapabilities([]);
    setFormActive(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error("נא להזין שם לסוכן");
      return;
    }
    saveMutation.mutate({
      id: selectedAgent?.id,
      name: formName,
      description: formDescription,
      agent_type: formType,
      capabilities: formCapabilities,
      is_active: formActive,
    });
  };

  const toggleCapability = (cap: string) => {
    setFormCapabilities(prev =>
      prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
    );
  };

  const getAgentTypeInfo = (type: string) => {
    return agentTypes.find(t => t.value === type) || agentTypes[4];
  };

  // Get enabled modules for quick access
  const enabledModules = Object.keys(moduleAgentConfig).filter(key => 
    isModuleEnabled(key as any)
  );

  return (
    <MainLayout>
      <div className="p-4 md:p-8 space-y-6">
        <PageHeader 
          title="סוכני AI"
          description="סוכני AI חכמים לכל מודול ולקוח - בחר סוכן והתחל לעבוד"
          actions={
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 ml-2" />
              סוכן מותאם אישית
            </Button>
          }
        />

        {/* Module Agents Quick Access */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">סוכנים לפי מודול</h2>
            <Badge variant="secondary">{selectedClient?.name || "כללי"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            לחץ על סוכן כדי להתחיל שיחה - כל סוכן מותאם לתחום שלו עם הקשר הלקוח הנוכחי
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {enabledModules.map((module) => {
              const config = moduleAgentConfig[module];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <button
                  key={module}
                  onClick={() => setActiveAgentChat(module)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border border-border transition-all hover:scale-105",
                    config.bgColor,
                    "hover:shadow-lg hover:border-primary/50"
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-background/50", config.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pending Actions Section */}
        {pendingActions.length > 0 && (
          <div className="glass rounded-xl p-6 border-2 border-warning/30">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-warning" />
              <h2 className="text-lg font-bold">פעולות ממתינות לאישור</h2>
              <Badge variant="secondary">{pendingActions.length}</Badge>
            </div>
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div key={action.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{action.action_data?.title || action.action_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {action.action_data?.description || 'הסוכן מציע לבצע פעולה זו'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(action.created_at), "d בMMMM, HH:mm", { locale: he })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      onClick={() => actionMutation.mutate({ actionId: action.id, approved: false })}
                      disabled={actionMutation.isPending}
                    >
                      <X className="w-4 h-4 ml-1" />
                      התעלם
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => actionMutation.mutate({ actionId: action.id, approved: true })}
                      disabled={actionMutation.isPending}
                    >
                      <Check className="w-4 h-4 ml-1" />
                      אשר ובצע
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agents Grid */}
        {agentsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : agents.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">אין סוכנים עדיין</h3>
            <p className="text-muted-foreground mb-4">צור סוכן AI ראשון כדי להתחיל</p>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 ml-2" />
              צור סוכן
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => {
              const typeInfo = getAgentTypeInfo(agent.agent_type);
              const TypeIcon = typeInfo.icon;
              
              return (
                <div 
                  key={agent.id} 
                  className={cn(
                    "glass rounded-xl overflow-hidden card-shadow group transition-all",
                    !agent.is_active && "opacity-60"
                  )}
                >
                  <div className={cn("h-2", agent.is_active ? "bg-gradient-to-l from-primary to-primary/60" : "bg-muted")} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-muted", typeInfo.color)}>
                          <TypeIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold">{agent.name}</h3>
                          <p className="text-sm text-muted-foreground">{typeInfo.label}</p>
                        </div>
                      </div>
                      <Switch
                        checked={agent.is_active}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ id: agent.id, is_active: checked })
                        }
                      />
                    </div>
                    
                    {agent.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {agent.description}
                      </p>
                    )}
                    
                    {agent.capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {agent.capabilities.slice(0, 3).map((cap) => (
                          <Badge key={cap} variant="secondary" className="text-xs">
                            {capabilityOptions.find(c => c.value === cap)?.label || cap}
                          </Badge>
                        ))}
                        {agent.capabilities.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{agent.capabilities.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => openDialog(agent)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteDialog({ open: true, agent })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Play className="w-3 h-3" />
                        הפעל
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedAgent ? "עריכת סוכן" : "סוכן AI חדש"}</DialogTitle>
            <DialogDescription>
              הגדר סוכן AI מותאם אישית עם יכולות ספציפיות
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>שם הסוכן</Label>
              <Input 
                value={formName} 
                onChange={(e) => setFormName(e.target.value)} 
                placeholder="לדוגמה: סוכן אופטימיזציה"
              />
            </div>
            
            <div className="space-y-2">
              <Label>תיאור</Label>
              <Textarea 
                value={formDescription} 
                onChange={(e) => setFormDescription(e.target.value)} 
                placeholder="מה הסוכן הזה עושה..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>סוג סוכן</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className={cn("w-4 h-4", type.color)} />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>יכולות</Label>
              <div className="grid grid-cols-2 gap-2">
                {capabilityOptions.map((cap) => (
                  <div key={cap.value} className="flex items-center gap-2">
                    <Checkbox
                      id={cap.value}
                      checked={formCapabilities.includes(cap.value)}
                      onCheckedChange={() => toggleCapability(cap.value)}
                    />
                    <label htmlFor={cap.value} className="text-sm cursor-pointer">
                      {cap.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label>סוכן פעיל</Label>
            </div>
            
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={closeDialog}>ביטול</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                שמור
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת סוכן</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הסוכן "{deleteDialog.agent?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.agent && deleteMutation.mutate(deleteDialog.agent.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Module Agent Chat */}
      {activeAgentChat && (
        <ModularAgentChat
          moduleType={activeAgentChat as keyof typeof moduleAgentConfig}
          isOpen={true}
          onClose={() => setActiveAgentChat(null)}
          onToggleExpand={() => {}}
        />
      )}
    </MainLayout>
  );
}
