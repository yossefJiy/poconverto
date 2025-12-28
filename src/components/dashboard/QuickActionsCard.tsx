import { Link } from "react-router-dom";
import { 
  BarChart3, 
  Megaphone, 
  Target, 
  CheckSquare,
  ShoppingBag,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClientModules } from "@/hooks/useClientModules";

interface QuickActionsCardProps {
  isModuleEnabled: (key: keyof ClientModules) => boolean;
}

export function QuickActionsCard({ isModuleEnabled }: QuickActionsCardProps) {
  const actions = [
    { key: "analytics", label: "צפה באנליטיקס", icon: BarChart3, path: "/analytics" },
    { key: "ecommerce", label: "חנות ומלאי", icon: ShoppingBag, path: "/ecommerce" },
    { key: "campaigns", label: "ניהול קמפיינים", icon: Megaphone, path: "/campaigns" },
    { key: "marketing", label: "שיווק ופרסונות", icon: Target, path: "/marketing" },
    { key: "tasks", label: "ניהול משימות", icon: CheckSquare, path: "/tasks" },
    { key: "team", label: "צוות משויך", icon: Users, path: "/team" },
  ];

  const visibleActions = actions.filter(action => isModuleEnabled(action.key as keyof ClientModules));

  if (visibleActions.length === 0) return null;

  return (
    <Card className="glass border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="w-4 h-4 text-primary" />
          פעולות מהירות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleActions.map(({ key, label, icon: Icon, path }) => (
          <Button 
            key={key}
            variant="outline" 
            className="w-full justify-start h-9 text-sm" 
            asChild
          >
            <Link to={path}>
              <Icon className="w-4 h-4 ml-2" />
              {label}
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
