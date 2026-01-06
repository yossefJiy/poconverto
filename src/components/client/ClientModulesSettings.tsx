import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Settings, 
  BarChart3,
  ShoppingBag,
  Target,
  Megaphone,
  CheckSquare,
  Users,
  LayoutDashboard,
  Loader2,
  Save,
  RefreshCw,
  TrendingUp,
  Bot,
  Lightbulb,
  FileText,
  Sparkles,
  Shield,
  ChevronDown,
  ChevronUp,
  UserCheck,
  FolderKanban,
  Crosshair,
  UserSearch,
  Share2,
  Palette,
  Zap,
  FlaskConical,
  ShoppingCart,
  ClipboardCheck,
  LayoutGrid,
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientModules } from "@/hooks/useClientModules";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";

interface ClientModulesSettingsProps {
  clientId: string;
  modules: ClientModules;
  syncFrequency?: string;
}

const MODULE_CATEGORIES = [
  {
    key: "core",
    label: "ליבה",
    icon: LayoutDashboard,
    modules: ["dashboard", "projects", "tasks", "team"],
  },
  {
    key: "marketing",
    label: "שיווק",
    icon: Target,
    modules: ["marketing", "kpis", "competitors", "social", "content_studio"],
  },
  {
    key: "campaigns",
    label: "קמפיינים",
    icon: Megaphone,
    modules: ["campaigns", "programmatic", "ab_tests"],
  },
  {
    key: "ecommerce",
    label: "איקומרס",
    icon: ShoppingCart,
    modules: ["ecommerce", "google_shopping"],
  },
  {
    key: "data",
    label: "נתונים",
    icon: BarChart3,
    modules: ["analytics", "insights", "reports"],
  },
  {
    key: "ai",
    label: "AI",
    icon: Bot,
    modules: ["ai_agent", "ai_insights"],
  },
  {
    key: "business",
    label: "עסקי",
    icon: FileText,
    modules: ["leads", "billing", "approvals"],
  },
  {
    key: "agency",
    label: "סוכנות",
    icon: LayoutGrid,
    modules: ["agency"],
  },
] as const;

const moduleConfig: Record<string, { label: string; icon: any; color: string; bgColor: string; description: string; hasAI: boolean }> = {
  // ליבה
  dashboard: { label: "דשבורד", icon: LayoutDashboard, color: "text-blue-500", bgColor: "bg-blue-500/20", description: "מסך סיכום ראשי", hasAI: false },
  projects: { label: "פרויקטים", icon: FolderKanban, color: "text-purple-500", bgColor: "bg-purple-500/20", description: "ניהול פרויקטים", hasAI: false },
  tasks: { label: "משימות", icon: CheckSquare, color: "text-yellow-500", bgColor: "bg-yellow-500/20", description: "רשימת משימות וניהול פרויקטים", hasAI: true },
  team: { label: "צוות משויך", icon: Users, color: "text-cyan-500", bgColor: "bg-cyan-500/20", description: "חברי צוות המשויכים ללקוח", hasAI: false },
  // מרקטינג
  marketing: { label: "שיווק", icon: Target, color: "text-pink-500", bgColor: "bg-pink-500/20", description: "פרסונות, מסרים ומטרות", hasAI: true },
  kpis: { label: "יעדים", icon: Crosshair, color: "text-yellow-500", bgColor: "bg-yellow-500/20", description: "מעקב יעדים ו-KPIs", hasAI: false },
  competitors: { label: "מתחרים", icon: UserSearch, color: "text-cyan-500", bgColor: "bg-cyan-500/20", description: "ניתוח מתחרים", hasAI: true },
  social: { label: "סושיאל", icon: Share2, color: "text-indigo-500", bgColor: "bg-indigo-500/20", description: "ניהול רשתות חברתיות", hasAI: true },
  content_studio: { label: "סטודיו תוכן", icon: Palette, color: "text-rose-500", bgColor: "bg-rose-500/20", description: "יצירה ועריכת תוכן", hasAI: true },
  // קמפיינים
  campaigns: { label: "קמפיינים", icon: Megaphone, color: "text-orange-500", bgColor: "bg-orange-500/20", description: "ניהול קמפיינים פרסומיים", hasAI: true },
  programmatic: { label: "פרוגרמטי", icon: Zap, color: "text-lime-500", bgColor: "bg-lime-500/20", description: "פרסום פרוגרמטי", hasAI: true },
  ab_tests: { label: "A/B Tests", icon: FlaskConical, color: "text-emerald-500", bgColor: "bg-emerald-500/20", description: "בדיקות A/B", hasAI: true },
  // איקומרס
  ecommerce: { label: "איקומרס", icon: ShoppingBag, color: "text-purple-500", bgColor: "bg-purple-500/20", description: "חנות, מלאי והזמנות מ-Shopify", hasAI: true },
  google_shopping: { label: "Google Shopping", icon: ShoppingCart, color: "text-red-500", bgColor: "bg-red-500/20", description: "ניהול Google Shopping", hasAI: true },
  // נתונים
  analytics: { label: "אנליטיקס", icon: BarChart3, color: "text-green-500", bgColor: "bg-green-500/20", description: "נתונים מ-Google Analytics", hasAI: true },
  insights: { label: "תובנות", icon: TrendingUp, color: "text-indigo-500", bgColor: "bg-indigo-500/20", description: "ניתוח ביצועים והיסטוריה", hasAI: true },
  reports: { label: "דוחות", icon: FileText, color: "text-teal-500", bgColor: "bg-teal-500/20", description: "יצירת והפקת דוחות", hasAI: true },
  // AI
  ai_agent: { label: "סוכן AI", icon: Bot, color: "text-violet-500", bgColor: "bg-violet-500/20", description: "עוזר AI חכם לתובנות והמלצות", hasAI: true },
  ai_insights: { label: "AI Insights", icon: Bot, color: "text-violet-400", bgColor: "bg-violet-400/20", description: "תובנות מבוססות AI", hasAI: true },
  // עסקי
  leads: { label: "לידים", icon: UserCheck, color: "text-rose-500", bgColor: "bg-rose-500/20", description: "ניהול לידים ופניות", hasAI: true },
  billing: { label: "חיובים", icon: FileText, color: "text-emerald-500", bgColor: "bg-emerald-500/20", description: "חשבוניות והצעות מחיר", hasAI: false },
  approvals: { label: "אישורים", icon: ClipboardCheck, color: "text-sky-500", bgColor: "bg-sky-500/20", description: "תהליכי אישור ואותוריזציה", hasAI: false },
  // סוכנות (master only)
  agency: { label: "סוכנות", icon: LayoutGrid, color: "text-fuchsia-500", bgColor: "bg-fuchsia-500/20", description: "ניהול סוכנות (מאסטר בלבד)", hasAI: false },
};

// AI Capabilities that can be toggled per module
const aiCapabilities = [
  { key: "content_generation", label: "יצירת תוכן", description: "יצירת טקסטים שיווקיים" },
  { key: "analysis", label: "ניתוח נתונים", description: "ניתוח ביצועים והמלצות" },
  { key: "suggestions", label: "הצעות חכמות", description: "הצעות אוטומטיות לשיפור" },
  { key: "automation", label: "אוטומציות", description: "פעולות אוטומטיות" },
] as const;

interface AIModuleSetting {
  id?: string;
  module_name: string;
  is_enabled: boolean;
  allowed_capabilities: string[];
}

interface TeamAIPermission {
  id?: string;
  team_member_id: string;
  module_name: string;
  can_use_ai: boolean;
  max_daily_requests: number;
}

type ModulesOrder = Record<string, number>;

export function ClientModulesSettings({
  clientId,
  modules: initialModules,
  syncFrequency: initialSyncFrequency = "daily",
}: ClientModulesSettingsProps) {
  const queryClient = useQueryClient();
  const [modules, setModules] = useState<ClientModules>(initialModules);
  const [syncFrequency, setSyncFrequency] = useState(initialSyncFrequency);
  const [modulesOrder, setModulesOrder] = useState<ModulesOrder>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedAIModules, setExpandedAIModules] = useState<Set<string>>(new Set());
  const [aiSettings, setAiSettings] = useState<Record<string, AIModuleSetting>>({});
  const [teamAIPermissions, setTeamAIPermissions] = useState<Record<string, TeamAIPermission>>({});
  const [showTeamPermissions, setShowTeamPermissions] = useState(false);
  const [showOrderSettings, setShowOrderSettings] = useState(false);

  // Fetch client data including modules_order and account_type
  const { data: clientSettings } = useQuery({
    queryKey: ['client-settings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('modules_order, modules_enabled, account_type')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch global module settings for defaults and order
  const { data: globalSettings = [] } = useQuery({
    queryKey: ['global-module-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_module_settings')
        .select('module_name, is_globally_enabled, default_for_basic, default_for_premium, sort_order')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch AI module settings
  const { data: aiModuleSettings } = useQuery({
    queryKey: ['ai-module-settings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_module_settings')
        .select('*')
        .eq('client_id', clientId);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch client team members
  const { data: clientTeam = [] } = useQuery({
    queryKey: ['client-team', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_team')
        .select('*, team:team_member_id(id, name, departments)')
        .eq('client_id', clientId);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch team AI permissions
  const { data: existingTeamPermissions = [] } = useQuery({
    queryKey: ['ai-team-permissions', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_team_permissions')
        .select('*')
        .eq('client_id', clientId);
      if (error) throw error;
      return data || [];
    },
  });

  // Initialize modules from global defaults + client overrides
  useEffect(() => {
    if (globalSettings.length > 0 && clientSettings) {
      const isPremium = clientSettings.account_type === 'premium_client';
      const clientModules = clientSettings.modules_enabled as Record<string, boolean> | null;
      
      const computedModules: Record<string, boolean> = {};
      
      for (const key of Object.keys(moduleConfig)) {
        const globalSetting = globalSettings.find(g => g.module_name === key);
        
        if (globalSetting) {
          if (!globalSetting.is_globally_enabled) {
            computedModules[key] = false;
          } else {
            // Check if client has explicit setting
            if (clientModules && key in clientModules) {
              computedModules[key] = clientModules[key];
            } else {
              // Use tier default
              computedModules[key] = isPremium 
                ? globalSetting.default_for_premium 
                : globalSetting.default_for_basic;
            }
          }
        } else {
          // No global setting - use client value or initialModules
          if (clientModules && key in clientModules) {
            computedModules[key] = clientModules[key];
          } else {
            computedModules[key] = initialModules[key as keyof ClientModules] ?? true;
          }
        }
      }
      
      setModules(computedModules as unknown as ClientModules);
    }
  }, [globalSettings, clientSettings, initialModules]);

  // Initialize modules order from client settings
  useEffect(() => {
    if (clientSettings?.modules_order) {
      setModulesOrder(clientSettings.modules_order as ModulesOrder);
    }
  }, [clientSettings]);

  useEffect(() => {
    if (aiModuleSettings) {
      const settingsMap: Record<string, AIModuleSetting> = {};
      aiModuleSettings.forEach((setting) => {
        settingsMap[setting.module_name] = {
          id: setting.id,
          module_name: setting.module_name,
          is_enabled: setting.is_enabled ?? true,
          allowed_capabilities: setting.allowed_capabilities || [],
        };
      });
      setAiSettings(settingsMap);
    }
  }, [aiModuleSettings]);

  useEffect(() => {
    if (existingTeamPermissions) {
      const permMap: Record<string, TeamAIPermission> = {};
      existingTeamPermissions.forEach((perm) => {
        const key = `${perm.team_member_id}_${perm.module_name}`;
        permMap[key] = {
          id: perm.id,
          team_member_id: perm.team_member_id,
          module_name: perm.module_name,
          can_use_ai: perm.can_use_ai ?? true,
          max_daily_requests: perm.max_daily_requests ?? 50,
        };
      });
      setTeamAIPermissions(permMap);
    }
  }, [existingTeamPermissions]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const modulesJson = modules as unknown as Record<string, boolean>;
      
      // Filter out empty order values
      const filteredOrder = Object.fromEntries(
        Object.entries(modulesOrder).filter(([_, v]) => v !== undefined && v !== null)
      );
      
      const { error } = await supabase
        .from("clients")
        .update({ 
          modules_enabled: modulesJson,
          modules_order: filteredOrder 
        })
        .eq("id", clientId);
      if (error) throw error;

      // Update sync schedule if exists
      const { data: existingSchedule } = await supabase
        .from("sync_schedules")
        .select("id")
        .eq("client_id", clientId)
        .single();

      if (existingSchedule) {
        await supabase
          .from("sync_schedules")
          .update({ sync_frequency: syncFrequency })
          .eq("client_id", clientId);
      } else {
        await supabase
          .from("sync_schedules")
          .insert({ client_id: clientId, sync_frequency: syncFrequency });
      }

      // Save AI module settings
      for (const [moduleName, setting] of Object.entries(aiSettings)) {
        if (setting.id) {
          await supabase
            .from("ai_module_settings")
            .update({
              is_enabled: setting.is_enabled,
              allowed_capabilities: setting.allowed_capabilities,
            })
            .eq("id", setting.id);
        } else {
          await supabase
            .from("ai_module_settings")
            .insert({
              client_id: clientId,
              module_name: moduleName,
              is_enabled: setting.is_enabled,
              allowed_capabilities: setting.allowed_capabilities,
            });
        }
      }

      // Save team AI permissions
      for (const [key, perm] of Object.entries(teamAIPermissions)) {
        if (perm.id) {
          await supabase
            .from("ai_team_permissions")
            .update({
              can_use_ai: perm.can_use_ai,
              max_daily_requests: perm.max_daily_requests,
            })
            .eq("id", perm.id);
        } else {
          await supabase
            .from("ai_team_permissions")
            .insert({
              client_id: clientId,
              team_member_id: perm.team_member_id,
              module_name: perm.module_name,
              can_use_ai: perm.can_use_ai,
              max_daily_requests: perm.max_daily_requests,
            });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-modules"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      queryClient.invalidateQueries({ queryKey: ["sync-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["ai-module-settings"] });
      queryClient.invalidateQueries({ queryKey: ["ai-team-permissions"] });
      toast.success("ההגדרות נשמרו בהצלחה");
      setHasChanges(false);
    },
    onError: () => toast.error("שגיאה בשמירת הגדרות"),
  });

  const handleModuleToggle = (key: keyof ClientModules, value: boolean) => {
    setModules(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSyncFrequencyChange = (value: string) => {
    setSyncFrequency(value);
    setHasChanges(true);
  };

  const handleAIToggle = (moduleName: string, enabled: boolean) => {
    setAiSettings(prev => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        module_name: moduleName,
        is_enabled: enabled,
        allowed_capabilities: prev[moduleName]?.allowed_capabilities || [],
      },
    }));
    setHasChanges(true);
  };

  const handleCapabilityToggle = (moduleName: string, capability: string, enabled: boolean) => {
    setAiSettings(prev => {
      const current = prev[moduleName] || { module_name: moduleName, is_enabled: true, allowed_capabilities: [] };
      const newCapabilities = enabled
        ? [...current.allowed_capabilities, capability]
        : current.allowed_capabilities.filter(c => c !== capability);
      return {
        ...prev,
        [moduleName]: {
          ...current,
          allowed_capabilities: newCapabilities,
        },
      };
    });
    setHasChanges(true);
  };

  const toggleAIExpansion = (key: string) => {
    setExpandedAIModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleOrderChange = (moduleName: string, order: number | null) => {
    setModulesOrder(prev => {
      if (order === null) {
        const { [moduleName]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [moduleName]: order };
    });
    setHasChanges(true);
  };

  const getEffectiveOrder = (moduleName: string): number => {
    if (modulesOrder[moduleName] !== undefined) {
      return modulesOrder[moduleName];
    }
    const globalSetting = globalSettings.find(g => g.module_name === moduleName);
    return globalSetting?.sort_order ?? 999;
  };

  const handleTeamPermissionToggle = (teamMemberId: string, moduleName: string, canUse: boolean) => {
    const key = `${teamMemberId}_${moduleName}`;
    setTeamAIPermissions(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        team_member_id: teamMemberId,
        module_name: moduleName,
        can_use_ai: canUse,
        max_daily_requests: prev[key]?.max_daily_requests ?? 50,
      },
    }));
    setHasChanges(true);
  };

  const handleTeamDailyLimitChange = (teamMemberId: string, moduleName: string, limit: number) => {
    const key = `${teamMemberId}_${moduleName}`;
    setTeamAIPermissions(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        team_member_id: teamMemberId,
        module_name: moduleName,
        can_use_ai: prev[key]?.can_use_ai ?? true,
        max_daily_requests: limit,
      },
    }));
    setHasChanges(true);
  };

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            הגדרות מודולים
          </span>
          {hasChanges && (
            <Button 
              size="sm" 
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              שמור שינויים
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sync Frequency */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            תדירות סנכרון נתונים
          </h4>
          <Select value={syncFrequency} onValueChange={handleSyncFrequencyChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="בחר תדירות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">כל שעה</SelectItem>
              <SelectItem value="daily">יומי</SelectItem>
              <SelectItem value="weekly">שבועי</SelectItem>
              <SelectItem value="manual">ידני בלבד</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Module Toggles - Grouped by Category */}
        <div className="space-y-6">
          <h4 className="font-medium text-sm text-muted-foreground">מודולים זמינים</h4>
          
          {MODULE_CATEGORIES.map((category) => {
            const CategoryIcon = category.icon;
            const categoryModules = category.modules.filter(key => moduleConfig[key]);
            if (categoryModules.length === 0) return null;

            return (
              <div key={category.key} className="space-y-3">
                {/* Category Header */}
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CategoryIcon className="w-4 h-4" />
                  {category.label}
                </div>

                {/* Category Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryModules.map((key) => {
                    const config = moduleConfig[key];
                    if (!config) return null;
                    const { label, icon: Icon, color, bgColor, description, hasAI } = config;
                    const isModuleEnabled = modules[key as keyof ClientModules];
                    const aiSetting = aiSettings[key];
                    const isAIEnabled = aiSetting?.is_enabled ?? true;
                    const isExpanded = expandedAIModules.has(key);

                    return (
                      <div 
                        key={key}
                        className="rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
                              <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Label htmlFor={`module-${key}`} className="font-medium cursor-pointer">
                                  {label}
                                </Label>
                                {hasAI && isModuleEnabled && (
                                  <Badge variant={isAIEnabled ? "default" : "secondary"} className="text-xs">
                                    <Sparkles className="w-3 h-3 ml-1" />
                                    AI
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={modulesOrder[key] ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleOrderChange(key, val ? parseInt(val) : null);
                              }}
                              placeholder={String(getEffectiveOrder(key))}
                              className="w-14 h-8 text-xs text-center"
                              min={1}
                              max={99}
                              title="סדר תצוגה"
                            />
                            {hasAI && isModuleEnabled && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAIExpansion(key)}
                                className="text-muted-foreground"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            )}
                            <Switch
                              id={`module-${key}`}
                              checked={isModuleEnabled}
                              onCheckedChange={(v) => handleModuleToggle(key as keyof ClientModules, v)}
                              disabled={key === "dashboard"}
                            />
                          </div>
                        </div>

                        {/* AI Settings Expansion */}
                        {hasAI && isModuleEnabled && isExpanded && (
                          <div className="border-t border-border/50 p-4 bg-muted/30 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">הגדרות AI למודול</span>
                              </div>
                              <Switch
                                checked={isAIEnabled}
                                onCheckedChange={(v) => handleAIToggle(key, v)}
                              />
                            </div>

                            {isAIEnabled && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">יכולות מאושרות:</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {aiCapabilities.map(cap => (
                                    <label
                                      key={cap.key}
                                      className="flex items-center gap-2 p-2 rounded-md bg-background/50 cursor-pointer hover:bg-background/80"
                                    >
                                      <Switch
                                        checked={aiSetting?.allowed_capabilities?.includes(cap.key) ?? false}
                                        onCheckedChange={(v) => handleCapabilityToggle(key, cap.key, v)}
                                        className="scale-75"
                                      />
                                      <div>
                                        <span className="text-sm">{cap.label}</span>
                                        <p className="text-xs text-muted-foreground">{cap.description}</p>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Team AI Permissions Section */}
        {clientTeam.length > 0 && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowTeamPermissions(!showTeamPermissions)}
              className="w-full flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                הרשאות AI לפי איש צוות
              </span>
              {showTeamPermissions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showTeamPermissions && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                {clientTeam.map((ct: any) => {
                  const team = ct.team;
                  if (!team) return null;

                  return (
                    <div key={ct.id} className="space-y-2 p-3 rounded-lg bg-background/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                          {team.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-medium">{team.name}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(moduleConfig).filter(([_, m]) => m.hasAI).map(([key, config]) => {
                          const permKey = `${team.id}_${key}`;
                          const perm = teamAIPermissions[permKey];
                          const canUse = perm?.can_use_ai ?? true;

                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between p-2 rounded bg-muted/30"
                            >
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={canUse}
                                  onCheckedChange={(v) => handleTeamPermissionToggle(team.id, key, v)}
                                  className="scale-75"
                                />
                                <span className="text-sm">{config.label}</span>
                              </div>
                              {canUse && (
                                <Input
                                  type="number"
                                  value={perm?.max_daily_requests ?? 50}
                                  onChange={(e) => handleTeamDailyLimitChange(team.id, key, parseInt(e.target.value) || 50)}
                                  className="w-16 h-7 text-xs text-center"
                                  min={1}
                                  max={1000}
                                  title="מגבלה יומית"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
