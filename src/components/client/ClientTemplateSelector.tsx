import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingCart, Building2, Briefcase, Rocket, MapPin, Settings, 
  Check, ArrowRight 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientTemplate {
  id: string;
  name: string;
  industry: string;
  description: string;
  icon: string;
  modules_enabled: Record<string, boolean>;
  default_settings: Record<string, unknown>;
  integrations_suggested: string[];
  sort_order: number;
}

interface ClientTemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelect: (template: ClientTemplate) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingCart,
  Building2,
  Briefcase,
  Rocket,
  MapPin,
  Settings,
};

const industryColors: Record<string, string> = {
  "e-commerce": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "b2b": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "services": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "saas": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  "local": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  "custom": "bg-muted text-muted-foreground",
};

export function ClientTemplateSelector({ selectedTemplateId, onSelect }: ClientTemplateSelectorProps) {
  const { data: templates, isLoading } = useQuery({
    queryKey: ["client-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_templates")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as ClientTemplate[];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates?.map((template) => {
        const IconComponent = iconMap[template.icon] || Settings;
        const isSelected = selectedTemplateId === template.id;
        const enabledModules = Object.entries(template.modules_enabled)
          .filter(([, enabled]) => enabled)
          .map(([key]) => key);

        return (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
              isSelected 
                ? "ring-2 ring-primary border-primary bg-primary/5" 
                : "hover:border-primary/50"
            )}
            onClick={() => onSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={cn(
                  "p-3 rounded-xl",
                  industryColors[template.industry] || industryColors.custom
                )}>
                  <IconComponent className="h-6 w-6" />
                </div>
                {isSelected && (
                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
              <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">מודולים כלולים:</p>
                  <div className="flex flex-wrap gap-1">
                    {enabledModules.slice(0, 4).map((module) => (
                      <Badge key={module} variant="secondary" className="text-xs">
                        {module}
                      </Badge>
                    ))}
                    {enabledModules.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{enabledModules.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
                {template.integrations_suggested.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">אינטגרציות מומלצות:</p>
                    <p className="text-xs text-muted-foreground">
                      {template.integrations_suggested.join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
