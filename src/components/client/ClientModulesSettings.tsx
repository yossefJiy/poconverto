import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientModules } from "@/hooks/useClientModules";

interface ClientModulesSettingsProps {
  clientId: string;
  modules: ClientModules;
  syncFrequency?: string;
}

const moduleConfig = [
  { key: "dashboard", label: "דשבורד", icon: LayoutDashboard, color: "text-blue-500", bgColor: "bg-blue-500/20", description: "מסך סיכום ראשי" },
  { key: "analytics", label: "אנליטיקס", icon: BarChart3, color: "text-green-500", bgColor: "bg-green-500/20", description: "נתונים מ-Google Analytics" },
  { key: "ecommerce", label: "איקומרס", icon: ShoppingBag, color: "text-purple-500", bgColor: "bg-purple-500/20", description: "חנות, מלאי והזמנות מ-Shopify" },
  { key: "marketing", label: "שיווק", icon: Target, color: "text-pink-500", bgColor: "bg-pink-500/20", description: "פרסונות, מסרים ומטרות" },
  { key: "campaigns", label: "קמפיינים", icon: Megaphone, color: "text-orange-500", bgColor: "bg-orange-500/20", description: "ניהול קמפיינים פרסומיים" },
  { key: "tasks", label: "משימות", icon: CheckSquare, color: "text-yellow-500", bgColor: "bg-yellow-500/20", description: "רשימת משימות וניהול פרויקטים" },
  { key: "team", label: "צוות משויך", icon: Users, color: "text-cyan-500", bgColor: "bg-cyan-500/20", description: "חברי צוות המשויכים ללקוח" },
] as const;

export function ClientModulesSettings({
  clientId,
  modules: initialModules,
  syncFrequency: initialSyncFrequency = "daily",
}: ClientModulesSettingsProps) {
  const queryClient = useQueryClient();
  const [modules, setModules] = useState<ClientModules>(initialModules);
  const [syncFrequency, setSyncFrequency] = useState(initialSyncFrequency);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setModules(initialModules);
    setSyncFrequency(initialSyncFrequency);
  }, [initialModules, initialSyncFrequency]);

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-modules"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      queryClient.invalidateQueries({ queryKey: ["sync-schedule"] });
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
            {moduleConfig.map(({ key, label, icon: Icon, color, bgColor, description }) => (
              <div 
                key={key}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <Label htmlFor={`module-${key}`} className="font-medium cursor-pointer">
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={`module-${key}`}
                  checked={modules[key as keyof ClientModules]}
                  onCheckedChange={(v) => handleModuleToggle(key as keyof ClientModules, v)}
                  disabled={key === "dashboard"} // Dashboard is always on
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
