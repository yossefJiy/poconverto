import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, Lightbulb, Wrench } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PriorityCategoryBadgeProps {
  category: "revenue" | "growth" | "innovation" | "maintenance" | null | undefined;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const categoryConfig = {
  revenue: {
    label: "הכנסה",
    shortLabel: "₪",
    icon: DollarSign,
    color: "bg-success/20 text-success border-success/30",
    description: "משימה שמכניסה כסף ישירות",
    group: "stability",
  },
  growth: {
    label: "צמיחה",
    shortLabel: "↗",
    icon: TrendingUp,
    color: "bg-info/20 text-info border-info/30",
    description: "פוטנציאל רווח עתידי",
    group: "innovation",
  },
  innovation: {
    label: "חדשנות",
    shortLabel: "💡",
    icon: Lightbulb,
    color: "bg-warning/20 text-warning border-warning/30",
    description: "פרויקט חדשני / יזמות",
    group: "innovation",
  },
  maintenance: {
    label: "תחזוקה",
    shortLabel: "🔧",
    icon: Wrench,
    color: "bg-muted text-muted-foreground border-border",
    description: "משימות תחזוקה שוטפות",
    group: "stability",
  },
};

export function PriorityCategoryBadge({ 
  category, 
  size = "md", 
  showLabel = true,
  className 
}: PriorityCategoryBadgeProps) {
  if (!category) return null;
  
  const config = categoryConfig[category];
  if (!config) return null;

  const sizeClasses = {
    sm: "h-5 text-xs px-1.5",
    md: "h-6 text-sm px-2",
    lg: "h-7 text-sm px-3",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-4 h-4",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full border font-medium",
            config.color,
            sizeClasses[size],
            className
          )}
        >
          <config.icon className={iconSizes[size]} />
          {showLabel && <span>{config.label}</span>}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{config.label}</p>
        <p className="text-xs text-muted-foreground">{config.description}</p>
        <p className="text-xs mt-1">
          {config.group === "stability" ? "🛡️ יציבות (70%)" : "🚀 יזמות (30%)"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// Helper to get category from a task
export function getTaskPriorityGroup(category: string | null | undefined): "stability" | "innovation" | null {
  if (!category) return null;
  const config = categoryConfig[category as keyof typeof categoryConfig];
  return config?.group as "stability" | "innovation" || null;
}