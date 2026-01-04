import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AICapabilityUsageStats } from "./AICapabilityUsageStats";
import {
  Bot,
  Shield,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Search,
  Filter,
  Clock,
  Ban,
  ShieldCheck,
  ShieldAlert,
  Target,
  BarChart3,
  ShoppingCart,
  ListTodo,
  Megaphone,
  Settings,
  Zap,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";

// Types
type CapabilityCategory = "system" | "integrations" | "content" | "analytics" | "tasks" | "campaigns" | "ecommerce";

interface CapabilityDefinition {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  category: CapabilityCategory;
  is_active: boolean;
  is_dangerous: boolean;
  requires_confirmation: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface AIAgent {
  id: string;
  name: string;
  description?: string | null;
  agent_type: string;
  client_id?: string | null;
  is_active?: boolean;
}

interface Client {
  id: string;
  name: string;
}

interface AgentPermission {
  id: string;
  agent_id: string;
  capability_id: string;
  client_id: string | null;
  domain: string | null;
  is_allowed: boolean;
  requires_approval: boolean;
  max_daily_uses: number | null;
  current_daily_uses: number;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  capability?: CapabilityDefinition;
  agent?: AIAgent;
  client?: Client;
}

const categoryIcons: Record<string, typeof Shield> = {
  system: Settings,
  integrations: Zap,
  content: MessageSquare,
  analytics: BarChart3,
  tasks: ListTodo,
  campaigns: Megaphone,
  ecommerce: ShoppingCart,
};

const categoryLabels: Record<string, string> = {
  system: "מערכת",
  integrations: "אינטגרציות",
  content: "תוכן AI",
  analytics: "אנליטיקס",
  tasks: "משימות",
  campaigns: "קמפיינים",
  ecommerce: "איקומרס",
};

const domainOptions = [
  { value: "marketing", label: "שיווק" },
  { value: "sales", label: "מכירות" },
  { value: "support", label: "תמיכה" },
  { value: "operations", label: "תפעול" },
  { value: "finance", label: "כספים" },
  { value: "hr", label: "משאבי אנוש" },
];

export function AIAgentPermissionsManager() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("capabilities");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [permissionDialog, setPermissionDialog] = useState(false);
  const [capabilityDialog, setCapabilityDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; permission: AgentPermission | null }>({ 
    open: false, 
    permission: null 
  });
  const [selectedPermission, setSelectedPermission] = useState<AgentPermission | null>(null);

  // Form state for permission
  const [formAgentId, setFormAgentId] = useState("");
  const [formCapabilityId, setFormCapabilityId] = useState("");
  const [formClientId, setFormClientId] = useState<string | null>(null);
  const [formDomain, setFormDomain] = useState<string | null>(null);
  const [formIsAllowed, setFormIsAllowed] = useState(true);
  const [formRequiresApproval, setFormRequiresApproval] = useState(false);
  const [formMaxDailyUses, setFormMaxDailyUses] = useState<number | null>(null);
  const [formNotes, setFormNotes] = useState("");

  // Form state for capability
  const [capFormName, setCapFormName] = useState("");
  const [capFormDisplayName, setCapFormDisplayName] = useState("");
  const [capFormDescription, setCapFormDescription] = useState("");
  const [capFormCategory, setCapFormCategory] = useState<CapabilityCategory>("system");
  const [capFormIsDangerous, setCapFormIsDangerous] = useState(false);
  const [capFormRequiresConfirmation, setCapFormRequiresConfirmation] = useState(false);
  const [editingCapability, setEditingCapability] = useState<CapabilityDefinition | null>(null);

  // Fetch capabilities
  const { data: capabilities = [], isLoading: capabilitiesLoading } = useQuery({
    queryKey: ["ai-capability-definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_capability_definitions")
        .select("*")
        .order("category", { ascending: true })
        .order("display_name", { ascending: true });
      if (error) throw error;
      return data as CapabilityDefinition[];
    },
  });

  // Fetch agents
  const { data: agents = [] } = useQuery({
    queryKey: ["ai-agents-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("id, name, description, agent_type, client_id, is_active")
        .order("name");
      if (error) throw error;
      return data as AIAgent[];
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Client[];
    },
  });

  // Fetch permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["ai-agent-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agent_permissions")
        .select(`
          *,
          capability:ai_capability_definitions(*),
          agent:ai_agents(id, name, agent_type),
          client:clients(id, name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AgentPermission[];
    },
  });

  // Save capability mutation
  const saveCapabilityMutation = useMutation({
    mutationFn: async (cap: Partial<CapabilityDefinition>) => {
      if (editingCapability) {
        const { error } = await supabase
          .from("ai_capability_definitions")
          .update({
            name: cap.name,
            display_name: cap.display_name,
            description: cap.description,
            category: cap.category,
            is_dangerous: cap.is_dangerous,
            requires_confirmation: cap.requires_confirmation,
          })
          .eq("id", editingCapability.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ai_capability_definitions")
          .insert({
            name: cap.name,
            display_name: cap.display_name,
            description: cap.description,
            category: cap.category,
            is_dangerous: cap.is_dangerous,
            requires_confirmation: cap.requires_confirmation,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-capability-definitions"] });
      toast.success("היכולת נשמרה בהצלחה");
      closeCapabilityDialog();
    },
    onError: (err: any) => toast.error(err.message || "שגיאה בשמירה"),
  });

  // Save permission mutation
  const savePermissionMutation = useMutation({
    mutationFn: async (perm: Partial<AgentPermission>) => {
      if (selectedPermission) {
        const { error } = await supabase
          .from("ai_agent_permissions")
          .update({
            is_allowed: perm.is_allowed,
            requires_approval: perm.requires_approval,
            max_daily_uses: perm.max_daily_uses,
            notes: perm.notes,
          })
          .eq("id", selectedPermission.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ai_agent_permissions")
          .insert({
            agent_id: perm.agent_id,
            capability_id: perm.capability_id,
            client_id: perm.client_id || null,
            domain: perm.domain || null,
            is_allowed: perm.is_allowed,
            requires_approval: perm.requires_approval,
            max_daily_uses: perm.max_daily_uses,
            notes: perm.notes,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-agent-permissions"] });
      toast.success("ההרשאה נשמרה בהצלחה");
      closePermissionDialog();
    },
    onError: (err: any) => toast.error(err.message || "שגיאה בשמירה"),
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ai_agent_permissions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-agent-permissions"] });
      toast.success("ההרשאה נמחקה");
      setDeleteDialog({ open: false, permission: null });
    },
    onError: () => toast.error("שגיאה במחיקה"),
  });

  // Toggle capability active status
  const toggleCapabilityMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("ai_capability_definitions")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-capability-definitions"] });
      toast.success("סטטוס היכולת עודכן");
    },
  });

  const openPermissionDialog = (permission?: AgentPermission) => {
    setSelectedPermission(permission || null);
    if (permission) {
      setFormAgentId(permission.agent_id);
      setFormCapabilityId(permission.capability_id);
      setFormClientId(permission.client_id);
      setFormDomain(permission.domain);
      setFormIsAllowed(permission.is_allowed);
      setFormRequiresApproval(permission.requires_approval);
      setFormMaxDailyUses(permission.max_daily_uses);
      setFormNotes(permission.notes || "");
    } else {
      resetPermissionForm();
    }
    setPermissionDialog(true);
  };

  const closePermissionDialog = () => {
    setPermissionDialog(false);
    setSelectedPermission(null);
    resetPermissionForm();
  };

  const resetPermissionForm = () => {
    setFormAgentId("");
    setFormCapabilityId("");
    setFormClientId(null);
    setFormDomain(null);
    setFormIsAllowed(true);
    setFormRequiresApproval(false);
    setFormMaxDailyUses(null);
    setFormNotes("");
  };

  const openCapabilityDialog = (capability?: CapabilityDefinition) => {
    setEditingCapability(capability || null);
    if (capability) {
      setCapFormName(capability.name);
      setCapFormDisplayName(capability.display_name);
      setCapFormDescription(capability.description || "");
      setCapFormCategory(capability.category);
      setCapFormIsDangerous(capability.is_dangerous);
      setCapFormRequiresConfirmation(capability.requires_confirmation);
    } else {
      resetCapabilityForm();
    }
    setCapabilityDialog(true);
  };

  const closeCapabilityDialog = () => {
    setCapabilityDialog(false);
    setEditingCapability(null);
    resetCapabilityForm();
  };

  const resetCapabilityForm = () => {
    setCapFormName("");
    setCapFormDisplayName("");
    setCapFormDescription("");
    setCapFormCategory("system");
    setCapFormIsDangerous(false);
    setCapFormRequiresConfirmation(false);
  };

  const handleSavePermission = () => {
    if (!formAgentId || !formCapabilityId) {
      toast.error("נא לבחור סוכן ויכולת");
      return;
    }
    savePermissionMutation.mutate({
      agent_id: formAgentId,
      capability_id: formCapabilityId,
      client_id: formClientId,
      domain: formDomain,
      is_allowed: formIsAllowed,
      requires_approval: formRequiresApproval,
      max_daily_uses: formMaxDailyUses,
      notes: formNotes,
    });
  };

  const handleSaveCapability = () => {
    if (!capFormName.trim() || !capFormDisplayName.trim()) {
      toast.error("נא להזין שם ושם תצוגה");
      return;
    }
    saveCapabilityMutation.mutate({
      name: capFormName,
      display_name: capFormDisplayName,
      description: capFormDescription,
      category: capFormCategory,
      is_dangerous: capFormIsDangerous,
      requires_confirmation: capFormRequiresConfirmation,
    });
  };

  // Filter capabilities
  const filteredCapabilities = capabilities.filter((cap) => {
    const matchesSearch =
      !searchTerm ||
      cap.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cap.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cap.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || cap.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group capabilities by category
  const groupedCapabilities = filteredCapabilities.reduce((acc, cap) => {
    if (!acc[cap.category]) {
      acc[cap.category] = [];
    }
    acc[cap.category].push(cap);
    return acc;
  }, {} as Record<string, CapabilityDefinition[]>);

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capabilities" className="gap-2">
            <Shield className="w-4 h-4" />
            יכולות ({capabilities.length})
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <ShieldCheck className="w-4 h-4" />
            הרשאות ({permissions.length})
          </TabsTrigger>
          <TabsTrigger value="matrix" className="gap-2">
            <Target className="w-4 h-4" />
            מטריקס
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            שימוש
          </TabsTrigger>
        </TabsList>

        {/* Capabilities Tab */}
        <TabsContent value="capabilities" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>יכולות סוכני AI</CardTitle>
                  <CardDescription>
                    קטלוג כל הפונקציות והיכולות הזמינות לסוכני AI
                  </CardDescription>
                </div>
                <Button onClick={() => openCapabilityDialog()}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף יכולת
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="חיפוש יכולות..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select
                  value={categoryFilter || "all"}
                  onValueChange={(v) => setCategoryFilter(v === "all" ? null : v)}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="w-4 h-4 ml-2" />
                    <SelectValue placeholder="קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הקטגוריות</SelectItem>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Capabilities List */}
              {capabilitiesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-6">
                    {Object.entries(groupedCapabilities).map(([category, caps]) => {
                      const Icon = categoryIcons[category] || Shield;
                      return (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">{categoryLabels[category] || category}</h3>
                            <Badge variant="secondary">{caps.length}</Badge>
                          </div>
                          <div className="grid gap-2">
                            {caps.map((cap) => (
                              <div
                                key={cap.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border",
                                  !cap.is_active && "opacity-50 bg-muted"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    {cap.is_dangerous && (
                                      <ShieldAlert className="w-4 h-4 text-destructive" />
                                    )}
                                    {cap.requires_confirmation && !cap.is_dangerous && (
                                      <Clock className="w-4 h-4 text-warning" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium">{cap.display_name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {cap.description}
                                    </p>
                                    <code className="text-xs text-muted-foreground">
                                      {cap.name}
                                    </code>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {cap.is_dangerous && (
                                    <Badge variant="destructive" className="gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      מסוכן
                                    </Badge>
                                  )}
                                  {cap.requires_confirmation && (
                                    <Badge variant="secondary" className="gap-1">
                                      <Clock className="w-3 h-3" />
                                      דורש אישור
                                    </Badge>
                                  )}
                                  <Switch
                                    checked={cap.is_active}
                                    onCheckedChange={(checked) =>
                                      toggleCapabilityMutation.mutate({ id: cap.id, is_active: checked })
                                    }
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openCapabilityDialog(cap)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>הרשאות סוכנים</CardTitle>
                  <CardDescription>
                    ניהול הרשאות לפי סוכן, לקוח ותחום
                  </CardDescription>
                </div>
                <Button onClick={() => openPermissionDialog()}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף הרשאה
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : permissions.length === 0 ? (
                <div className="text-center py-10">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">אין הרשאות מוגדרות</p>
                  <Button onClick={() => openPermissionDialog()} className="mt-4">
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף הרשאה ראשונה
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>סוכן</TableHead>
                        <TableHead>יכולת</TableHead>
                        <TableHead>לקוח</TableHead>
                        <TableHead>תחום</TableHead>
                        <TableHead>סטטוס</TableHead>
                        <TableHead>הגבלה יומית</TableHead>
                        <TableHead>פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissions.map((perm) => (
                        <TableRow key={perm.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Bot className="w-4 h-4 text-primary" />
                              <span className="font-medium">{perm.agent?.name || "לא ידוע"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {perm.capability?.display_name || "לא ידוע"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {perm.client ? (
                              <Badge variant="secondary">{perm.client.name}</Badge>
                            ) : (
                              <span className="text-muted-foreground">גלובלי</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {perm.domain ? (
                              <Badge variant="outline">
                                {domainOptions.find((d) => d.value === perm.domain)?.label || perm.domain}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">הכל</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {perm.is_allowed ? (
                                <Badge className="bg-green-500/10 text-green-600 gap-1">
                                  <Check className="w-3 h-3" />
                                  מותר
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <Ban className="w-3 h-3" />
                                  חסום
                                </Badge>
                              )}
                              {perm.requires_approval && (
                                <Badge variant="secondary" className="gap-1">
                                  <Clock className="w-3 h-3" />
                                  דורש אישור
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {perm.max_daily_uses ? (
                              <span>
                                {perm.current_daily_uses}/{perm.max_daily_uses}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">ללא הגבלה</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openPermissionDialog(perm)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => setDeleteDialog({ open: true, permission: perm })}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matrix Tab */}
        <TabsContent value="matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>מטריקס הרשאות</CardTitle>
              <CardDescription>
                תצוגה מרוכזת של כל ההרשאות לפי סוכן ויכולת
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="w-full">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px] sticky right-0 bg-background">סוכן</TableHead>
                        {capabilities.slice(0, 10).map((cap) => (
                          <TableHead key={cap.id} className="text-center min-w-[80px]">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs">{cap.display_name}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agents.map((agent) => {
                        const agentPermissions = permissions.filter((p) => p.agent_id === agent.id);
                        return (
                          <TableRow key={agent.id}>
                            <TableCell className="sticky right-0 bg-background">
                              <div className="flex items-center gap-2">
                                <Bot className="w-4 h-4 text-primary" />
                                <span className="font-medium">{agent.name}</span>
                              </div>
                            </TableCell>
                            {capabilities.slice(0, 10).map((cap) => {
                              const perm = agentPermissions.find((p) => p.capability_id === cap.id);
                              return (
                                <TableCell key={cap.id} className="text-center">
                                  {perm ? (
                                    perm.is_allowed ? (
                                      <div className="flex justify-center">
                                        <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                          <Check className="w-4 h-4 text-green-500" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex justify-center">
                                        <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
                                          <X className="w-4 h-4 text-destructive" />
                                        </div>
                                      </div>
                                    )
                                  ) : (
                                    <div className="flex justify-center">
                                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                        <span className="text-xs text-muted-foreground">-</span>
                                      </div>
                                    </div>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
              {capabilities.length > 10 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  מציג 10 יכולות ראשונות מתוך {capabilities.length}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <AICapabilityUsageStats />
        </TabsContent>
      </Tabs>

      {/* Permission Dialog */}
      <Dialog open={permissionDialog} onOpenChange={setPermissionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedPermission ? "עריכת הרשאה" : "הוספת הרשאה"}
            </DialogTitle>
            <DialogDescription>
              הגדר הרשאות יכולת לסוכן ספציפי
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>סוכן *</Label>
                <Select
                  value={formAgentId}
                  onValueChange={setFormAgentId}
                  disabled={!!selectedPermission}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סוכן" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>יכולת *</Label>
                <Select
                  value={formCapabilityId}
                  onValueChange={setFormCapabilityId}
                  disabled={!!selectedPermission}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר יכולת" />
                  </SelectTrigger>
                  <SelectContent>
                    {capabilities.map((cap) => (
                      <SelectItem key={cap.id} value={cap.id}>
                        {cap.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>לקוח (אופציונלי)</Label>
                <Select
                  value={formClientId || "global"}
                  onValueChange={(v) => setFormClientId(v === "global" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="כל הלקוחות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">כל הלקוחות (גלובלי)</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>תחום (אופציונלי)</Label>
                <Select
                  value={formDomain || "all"}
                  onValueChange={(v) => setFormDomain(v === "all" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="כל התחומים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל התחומים</SelectItem>
                    {domainOptions.map((domain) => (
                      <SelectItem key={domain.value} value={domain.value}>
                        {domain.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">מותר</p>
                <p className="text-sm text-muted-foreground">האם הסוכן יכול להשתמש ביכולת זו</p>
              </div>
              <Switch
                checked={formIsAllowed}
                onCheckedChange={setFormIsAllowed}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">דורש אישור</p>
                <p className="text-sm text-muted-foreground">הפעולה תמתין לאישור לפני ביצוע</p>
              </div>
              <Switch
                checked={formRequiresApproval}
                onCheckedChange={setFormRequiresApproval}
              />
            </div>

            <div className="space-y-2">
              <Label>הגבלת שימוש יומי</Label>
              <Input
                type="number"
                placeholder="ללא הגבלה"
                value={formMaxDailyUses || ""}
                onChange={(e) => setFormMaxDailyUses(e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>

            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea
                placeholder="הערות נוספות..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePermissionDialog}>
              ביטול
            </Button>
            <Button onClick={handleSavePermission} disabled={savePermissionMutation.isPending}>
              {savePermissionMutation.isPending && (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              )}
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Capability Dialog */}
      <Dialog open={capabilityDialog} onOpenChange={setCapabilityDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCapability ? "עריכת יכולת" : "הוספת יכולת חדשה"}
            </DialogTitle>
            <DialogDescription>
              הגדר יכולת חדשה לסוכני AI
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>מזהה (באנגלית) *</Label>
                <Input
                  placeholder="create_task"
                  value={capFormName}
                  onChange={(e) => setCapFormName(e.target.value)}
                  disabled={!!editingCapability}
                />
              </div>
              <div className="space-y-2">
                <Label>שם תצוגה *</Label>
                <Input
                  placeholder="יצירת משימה"
                  value={capFormDisplayName}
                  onChange={(e) => setCapFormDisplayName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>תיאור</Label>
              <Textarea
                placeholder="תיאור היכולת..."
                value={capFormDescription}
                onChange={(e) => setCapFormDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <Select value={capFormCategory} onValueChange={(v) => setCapFormCategory(v as CapabilityCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <div>
                <p className="font-medium text-destructive">פעולה מסוכנת</p>
                <p className="text-sm text-muted-foreground">מחיקת נתונים, שינויים בלתי הפיכים</p>
              </div>
              <Switch
                checked={capFormIsDangerous}
                onCheckedChange={setCapFormIsDangerous}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="font-medium">דורש אישור</p>
                <p className="text-sm text-muted-foreground">ברירת מחדל - לדרוש אישור לפני ביצוע</p>
              </div>
              <Switch
                checked={capFormRequiresConfirmation}
                onCheckedChange={setCapFormRequiresConfirmation}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCapabilityDialog}>
              ביטול
            </Button>
            <Button onClick={handleSaveCapability} disabled={saveCapabilityMutation.isPending}>
              {saveCapabilityMutation.isPending && (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              )}
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Permission Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, permission: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת הרשאה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק הרשאה זו? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteDialog.permission && deletePermissionMutation.mutate(deleteDialog.permission.id)
              }
            >
              {deletePermissionMutation.isPending && (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              )}
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
