import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings,
  Save,
  Loader2,
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Target,
  Megaphone,
  CheckSquare,
  Users,
  TrendingUp,
  Bot,
  Lightbulb,
  FileText,
  Contact,
  Receipt,
  LayoutGrid,
  FolderKanban,
  Crosshair,
  UserSearch,
  Share2,
  Palette,
  Zap,
  FlaskConical,
  ShoppingCart,
  ClipboardCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface GlobalModuleSetting {
  id: string;
  module_name: string;
  display_name: string;
  is_globally_enabled: boolean;
  default_for_basic: boolean;
  default_for_premium: boolean;
  sort_order: number;
}

const moduleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  analytics: BarChart3,
  ecommerce: ShoppingBag,
  google_shopping: ShoppingCart,
  marketing: Target,
  kpis: Crosshair,
  competitors: UserSearch,
  social: Share2,
  content_studio: Palette,
  campaigns: Megaphone,
  programmatic: Zap,
  ab_tests: FlaskConical,
  tasks: CheckSquare,
  team: Users,
  insights: TrendingUp,
  ai_agent: Bot,
  ai_insights: Bot,
  features: Lightbulb,
  reports: FileText,
  leads: Contact,
  billing: Receipt,
  approvals: ClipboardCheck,
  agency: LayoutGrid,
};

const moduleColors: Record<string, string> = {
  dashboard: "text-blue-500",
  projects: "text-purple-500",
  analytics: "text-green-500",
  ecommerce: "text-orange-500",
  google_shopping: "text-red-500",
  marketing: "text-pink-500",
  kpis: "text-yellow-500",
  competitors: "text-cyan-500",
  social: "text-indigo-500",
  content_studio: "text-rose-500",
  campaigns: "text-amber-500",
  programmatic: "text-lime-500",
  ab_tests: "text-emerald-500",
  tasks: "text-teal-500",
  team: "text-slate-500",
  insights: "text-stone-500",
  ai_agent: "text-violet-500",
  ai_insights: "text-violet-400",
  features: "text-amber-500",
  reports: "text-gray-500",
  leads: "text-rose-500",
  billing: "text-emerald-500",
  approvals: "text-sky-500",
  agency: "text-fuchsia-500",
};

const MODULE_CATEGORIES = [
  { 
    key: 'core', 
    label: 'ליבה', 
    icon: LayoutDashboard,
    modules: ['dashboard', 'projects', 'tasks', 'team'] 
  },
  { 
    key: 'marketing', 
    label: 'מרקטינג', 
    icon: Target,
    modules: ['marketing', 'kpis', 'competitors', 'social', 'content_studio'] 
  },
  { 
    key: 'campaigns', 
    label: 'קמפיינים', 
    icon: Megaphone,
    modules: ['campaigns', 'programmatic', 'ab_tests'] 
  },
  { 
    key: 'ecommerce', 
    label: 'איקומרס', 
    icon: ShoppingBag,
    modules: ['ecommerce', 'google_shopping'] 
  },
  { 
    key: 'data', 
    label: 'נתונים', 
    icon: BarChart3,
    modules: ['analytics', 'insights', 'reports'] 
  },
  { 
    key: 'ai', 
    label: 'בינה מלאכותית', 
    icon: Bot,
    modules: ['ai_agent', 'ai_insights'] 
  },
  { 
    key: 'business', 
    label: 'ניהול עסקי', 
    icon: Receipt,
    modules: ['leads', 'billing', 'approvals'] 
  },
  { 
    key: 'agency', 
    label: 'סוכנות', 
    icon: LayoutGrid,
    modules: ['agency'] 
  }
];

export function GlobalModulesManager() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, GlobalModuleSetting>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: globalSettings = [], isLoading } = useQuery({
    queryKey: ["global-module-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_module_settings")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as GlobalModuleSetting[];
    },
  });

  useEffect(() => {
    if (globalSettings.length > 0) {
      const settingsMap: Record<string, GlobalModuleSetting> = {};
      globalSettings.forEach((s) => {
        settingsMap[s.module_name] = s;
      });
      setSettings(settingsMap);
    }
  }, [globalSettings]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      for (const [moduleName, setting] of Object.entries(settings)) {
        await supabase
          .from("global_module_settings")
          .update({
            is_globally_enabled: setting.is_globally_enabled,
            default_for_basic: setting.default_for_basic,
            default_for_premium: setting.default_for_premium,
          })
          .eq("module_name", moduleName);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-module-settings"] });
      queryClient.invalidateQueries({ queryKey: ["client-modules"] });
      toast.success("הגדרות גלובליות נשמרו בהצלחה");
      setHasChanges(false);
    },
    onError: () => toast.error("שגיאה בשמירת הגדרות"),
  });

  const handleToggle = (moduleName: string, field: keyof GlobalModuleSetting, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Card className="glass border-0">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            ניהול מודולים גלובלי
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
      <CardContent>
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            נהל איזה מודולים זמינים גלובלית ומה ברירת המחדל לפי סוג לקוח.
            ניתן לעקוף הגדרות אלו ברמת לקוח ספציפי.
          </p>

          {/* Category Cards */}
          <div className="space-y-4">
            {MODULE_CATEGORIES.map((category) => {
              const CategoryIcon = category.icon;
              const categoryModules = category.modules
                .map(m => settings[m])
                .filter(Boolean);

              if (categoryModules.length === 0) return null;

              return (
                <div 
                  key={category.key} 
                  className="border rounded-lg overflow-hidden animate-fade-in"
                >
                  {/* Category Header */}
                  <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-2">
                    <CategoryIcon className="w-4 h-4 text-primary" />
                    <span className="font-medium">{category.label}</span>
                    <Badge variant="secondary" className="mr-auto text-xs">
                      {categoryModules.length} מודולים
                    </Badge>
                  </div>

                  {/* Modules Grid */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryModules.map((setting) => {
                      const Icon = moduleIcons[setting.module_name] || Settings;
                      const color = moduleColors[setting.module_name] || "text-primary";

                      return (
                        <div 
                          key={setting.module_name}
                          className={`p-4 rounded-lg border bg-card transition-all ${
                            !setting.is_globally_enabled ? 'opacity-50' : ''
                          }`}
                        >
                          {/* Module Header */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                              <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{setting.display_name}</p>
                              <p className="text-xs text-muted-foreground">{setting.module_name}</p>
                            </div>
                            {setting.module_name === "agency" && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                על
                              </Badge>
                            )}
                          </div>

                          {/* Switches */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">גלובלי</span>
                              <Switch
                                checked={setting.is_globally_enabled}
                                onCheckedChange={(v) => handleToggle(setting.module_name, "is_globally_enabled", v)}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">בסיסי</span>
                              <Switch
                                checked={setting.default_for_basic}
                                onCheckedChange={(v) => handleToggle(setting.module_name, "default_for_basic", v)}
                                disabled={!setting.is_globally_enabled}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">פרמיום</span>
                              <Switch
                                checked={setting.default_for_premium}
                                onCheckedChange={(v) => handleToggle(setting.module_name, "default_for_premium", v)}
                                disabled={!setting.is_globally_enabled}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-muted/30 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">הסבר:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>גלובלי:</strong> אם כבוי - המודול לא יהיה זמין לאף לקוח</li>
              <li><strong>בסיסי:</strong> האם לקוח בסיסי יקבל גישה כברירת מחדל</li>
              <li><strong>פרמיום:</strong> האם לקוח פרמיום יקבל גישה כברירת מחדל</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
