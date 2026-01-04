import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { 
  LayoutDashboard, 
  BarChart3, 
  ShoppingBag, 
  Target, 
  Megaphone, 
  CheckSquare, 
  Users,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface DefaultModules {
  dashboard: boolean;
  analytics: boolean;
  ecommerce: boolean;
  marketing: boolean;
  campaigns: boolean;
  tasks: boolean;
  team: boolean;
}

// Alias for backward compatibility
export type ClientModules = DefaultModules;

export const defaultModulesConfig: DefaultModules = {
  dashboard: true,
  analytics: true,
  ecommerce: false,
  marketing: true,
  campaigns: true,
  tasks: true,
  team: true,
};

interface DefaultModulesSelectorProps {
  modules: DefaultModules;
  onChange: (modules: DefaultModules) => void;
}

const moduleConfig = [
  { key: "dashboard", label: "דשבורד", icon: LayoutDashboard, description: "סקירה כללית", alwaysOn: true },
  { key: "analytics", label: "אנליטיקס", icon: BarChart3, description: "נתוני תנועה" },
  { key: "ecommerce", label: "איקומרס", icon: ShoppingBag, description: "חנות ומלאי" },
  { key: "marketing", label: "שיווק", icon: Target, description: "פרסונות ואסטרטגיה" },
  { key: "campaigns", label: "קמפיינים", icon: Megaphone, description: "ניהול קמפיינים" },
  { key: "tasks", label: "משימות", icon: CheckSquare, description: "ניהול משימות" },
  { key: "team", label: "צוות", icon: Users, description: "צוות משויך" },
];

export function DefaultModulesSelector({ modules, onChange }: DefaultModulesSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (key: keyof DefaultModules, value: boolean) => {
    if (key === "dashboard") return; // Dashboard is always on
    onChange({ ...modules, [key]: value });
  };

  const enabledCount = Object.values(modules).filter(Boolean).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <span className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            מודולים פעילים ({enabledCount}/{moduleConfig.length})
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
          {moduleConfig.map(({ key, label, icon: Icon, description, alwaysOn }) => (
            <div 
              key={key}
              className={cn(
                "flex items-center justify-between p-2 rounded-lg transition-colors",
                modules[key as keyof DefaultModules] ? "bg-primary/5" : "bg-background/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch
                checked={modules[key as keyof DefaultModules]}
                onCheckedChange={(v) => handleToggle(key as keyof DefaultModules, v)}
                disabled={alwaysOn}
              />
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
