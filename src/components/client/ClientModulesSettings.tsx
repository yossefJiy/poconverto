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

interface ClientModulesSettingsProps {
  clientId: string;
  modules: ClientModules;
  syncFrequency?: string;
}

const moduleConfig = [
  { key: "dashboard", label: "דשבורד", icon: LayoutDashboard, color: "text-blue-500", bgColor: "bg-blue-500/20", description: "מסך סיכום ראשי", hasAI: false },
  { key: "analytics", label: "אנליטיקס", icon: BarChart3, color: "text-green-500", bgColor: "bg-green-500/20", description: "נתונים מ-Google Analytics", hasAI: true },
  { key: "ecommerce", label: "איקומרס", icon: ShoppingBag, color: "text-purple-500", bgColor: "bg-purple-500/20", description: "חנות, מלאי והזמנות מ-Shopify", hasAI: true },
  { key: "marketing", label: "שיווק", icon: Target, color: "text-pink-500", bgColor: "bg-pink-500/20", description: "פרסונות, מסרים ומטרות", hasAI: true },
  { key: "campaigns", label: "קמפיינים", icon: Megaphone, color: "text-orange-500", bgColor: "bg-orange-500/20", description: "ניהול קמפיינים פרסומיים", hasAI: true },
  { key: "tasks", label: "משימות", icon: CheckSquare, color: "text-yellow-500", bgColor: "bg-yellow-500/20", description: "רשימת משימות וניהול פרויקטים", hasAI: true },
  { key: "team", label: "צוות משויך", icon: Users, color: "text-cyan-500", bgColor: "bg-cyan-500/20", description: "חברי צוות המשויכים ללקוח", hasAI: false },
  { key: "insights", label: "תובנות", icon: TrendingUp, color: "text-indigo-500", bgColor: "bg-indigo-500/20", description: "ניתוח ביצועים והיסטוריה", hasAI: true },
  { key: "ai_agent", label: "סוכן AI", icon: Bot, color: "text-violet-500", bgColor: "bg-violet-500/20", description: "עוזר AI חכם לתובנות והמלצות", hasAI: true },
  { key: "features", label: "בקשות פיצ'רים", icon: Lightbulb, color: "text-amber-500", bgColor: "bg-amber-500/20", description: "ניהול בקשות פיצ'רים מלקוחות", hasAI: false },
  { key: "reports", label: "דוחות", icon: FileText, color: "text-teal-500", bgColor: "bg-teal-500/20", description: "יצירת והפקת דוחות", hasAI: true },
] as const;

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

export function ClientModulesSettings({
  clientId,
  modules: initialModules,
  syncFrequency: initialSyncFrequency = "daily",
}: ClientModulesSettingsProps) {
  const queryClient = useQueryClient();
  const [modules, setModules] = useState<ClientModules>(initialModules);
  const [syncFrequency, setSyncFrequency] = useState(initialSyncFrequency);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedAIModules, setExpandedAIModules] = useState<Set<string>>(new Set());
  const [aiSettings, setAiSettings] = useState<Record<string, AIModuleSetting>>({});

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

  useEffect(() => {
    setModules(initialModules);
    setSyncFrequency(initialSyncFrequency);
  }, [initialModules, initialSyncFrequency]);

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

  const updateMutation = useMutation({
    mutationFn: async () => {
      const modulesJson = modules as unknown as Record<string, boolean>;
      const { error } = await supabase
        .from("clients")
        .update({ modules_enabled: modulesJson })
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-modules"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      queryClient.invalidateQueries({ queryKey: ["sync-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["ai-module-settings"] });
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

        {/* Module Toggles */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">מודולים זמינים</h4>
          
          <div className="grid gap-3">
            {moduleConfig.map(({ key, label, icon: Icon, color, bgColor, description, hasAI }) => {
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
      </CardContent>
    </Card>
  );
}
