import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Shield,
  LayoutDashboard,
  Building2,
  Megaphone,
  CheckSquare,
  Users,
  BarChart3,
  Plug,
  Languages,
  Palette,
  Settings,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PRDSection as PRDSectionType, PRDFeature } from "@/data/prdFeatures";
import { getSectionStats } from "@/data/prdFeatures";

const iconMap: Record<string, LucideIcon> = {
  Shield,
  LayoutDashboard,
  Building2,
  Megaphone,
  CheckSquare,
  Users,
  BarChart3,
  Plug,
  Languages,
  Palette,
  Settings,
  FileText,
};

interface PRDSectionProps {
  section: PRDSectionType;
  defaultOpen?: boolean;
}

const priorityColors = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-muted text-muted-foreground border-muted-foreground/30",
};

const priorityLabels = {
  critical: "קריטי",
  high: "גבוה",
  medium: "בינוני",
  low: "נמוך",
};

function FeatureItem({ feature }: { feature: PRDFeature }) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
      "hover:bg-muted/50 group",
      feature.completed && "opacity-70"
    )}>
      <Checkbox 
        checked={feature.completed} 
        disabled 
        className="mt-0.5 h-5 w-5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "font-medium text-sm",
            feature.completed && "line-through text-muted-foreground"
          )}>
            {feature.name}
          </span>
          <Badge 
            variant="outline" 
            className={cn("text-[10px] px-1.5 py-0", priorityColors[feature.priority])}
          >
            {priorityLabels[feature.priority]}
          </Badge>
        </div>
        <p className={cn(
          "text-xs text-muted-foreground mt-0.5",
          feature.completed && "line-through"
        )}>
          {feature.description}
        </p>
      </div>
      {feature.completed && (
        <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-[10px]">
          ✓
        </Badge>
      )}
    </div>
  );
}

export function PRDSectionCard({ section, defaultOpen = false }: PRDSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const stats = getSectionStats(section);
  
  // Dynamically get the icon
  const IconComponent = iconMap[section.icon] || FileText;

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      "border-border/50 hover:border-border",
      isOpen && "ring-1 ring-primary/20"
    )}>
      <CardHeader 
        className="cursor-pointer p-4 hover:bg-muted/30 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-base">{section.name}</h3>
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-left min-w-[100px]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{stats.completed}/{stats.total}</span>
                <span className="font-medium">{stats.percentage}%</span>
              </div>
              <Progress value={stats.percentage} className="h-1.5" />
            </div>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="p-4 pt-0 border-t border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mt-3">
            {section.features.map((feature) => (
              <FeatureItem key={feature.id} feature={feature} />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
