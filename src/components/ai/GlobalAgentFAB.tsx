import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Target,
  BarChart3,
  ShoppingCart,
  ListTodo,
  Users,
  TrendingUp,
  Lightbulb,
  FileText,
  Sparkles,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ModularAgentChat, moduleAgentConfig } from "./ModularAgentChat";
import { useClientModules } from "@/hooks/useClientModules";
import { useAICapabilityAlerts } from "@/hooks/useAICapabilityAlerts";

// Unique icons for each module with better visual distinction (semantic tokens only)
const moduleIconsEnhanced: Record<string, { icon: any; gradient: string; description: string }> = {
  marketing: {
    icon: Target,
    gradient: "from-primary to-accent",
    description: "ניתוח קמפיינים, קופי שיווקי, אסטרטגיה",
  },
  analytics: {
    icon: BarChart3,
    gradient: "from-success to-primary",
    description: "סיכום ביצועים, מגמות, השוואות",
  },
  ecommerce: {
    icon: ShoppingCart,
    gradient: "from-warning to-jiy-gold",
    description: "מכירות, מלאי, המרות",
  },
  tasks: {
    icon: ListTodo,
    gradient: "from-accent to-info",
    description: "תיעדוף, תכנון, משימות חדשות",
  },
  team: {
    icon: Users,
    gradient: "from-info to-success",
    description: "עומס צוות, חלוקת עבודה",
  },
  campaigns: {
    icon: TrendingUp,
    gradient: "from-jiy-gold to-primary",
    description: "סטטוס קמפיינים, אופטימיזציה",
  },
  insights: {
    icon: Lightbulb,
    gradient: "from-warning to-accent",
    description: "תובנות AI, הזדמנויות, המלצות",
  },
  reports: {
    icon: FileText,
    gradient: "from-muted to-secondary",
    description: "דוחות, סיכומים, הצגות",
  },
};

export function GlobalAgentFAB() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(true);

  const { isModuleEnabled } = useClientModules();
  const {
    pendingActionsCount,
    deniedTodayCount,
    limitWarningsCount,
    totalCount,
  } = useAICapabilityAlerts();

  // Stop pulsing after 30 seconds
  useEffect(() => {
    if (totalCount > 0) {
      setShouldPulse(true);
      const timer = setTimeout(() => setShouldPulse(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [totalCount]);

  // Get enabled modules
  const enabledModules = Object.keys(moduleAgentConfig).filter((key) => {
    const moduleKey = key as keyof typeof moduleAgentConfig;
    return isModuleEnabled(moduleKey as any);
  });

  const handleSelectModule = (module: string) => {
    setSelectedModule(module);
    setIsMenuOpen(false);
  };

  const handleCloseChat = () => {
    setSelectedModule(null);
    setIsChatExpanded(false);
  };

  const handleOpenAlerts = () => {
    setShouldPulse(false);
    navigate("/agent-alerts");
  };

  const totalAlerts = totalCount;

  return (
    <TooltipProvider delayDuration={300}>
      {/* Floating Action Button - bottom LEFT */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col-reverse items-center gap-3">
        {/* Module buttons - show when menu is open */}
        <div
          className={cn(
            "flex flex-col gap-2 transition-all duration-300",
            isMenuOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none",
          )}
        >
          {enabledModules.slice(0, 8).map((module, idx) => {
            const config = moduleAgentConfig[module];
            const enhanced = moduleIconsEnhanced[module];
            const Icon = enhanced?.icon || config.icon;

            return (
              <Tooltip key={module}>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className={cn(
                      "w-12 h-12 rounded-full shadow-lg transition-all duration-200",
                      "bg-gradient-to-br hover:scale-110 border-0",
                      enhanced?.gradient || "from-muted to-secondary",
                    )}
                    style={{
                      transitionDelay: `${idx * 50}ms`,
                      opacity: isMenuOpen ? 1 : 0,
                      transform: isMenuOpen ? "scale(1)" : "scale(0.8)",
                    }}
                    onClick={() => handleSelectModule(module)}
                  >
                    <Icon className="w-5 h-5 text-primary-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <div className="text-right">
                    <p className="font-semibold">{config.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {enhanced?.description || "סוכן AI"}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Alerts summary when menu is open */}
        {isMenuOpen && totalAlerts > 0 && (
          <div className="bg-card rounded-lg shadow-lg p-3 border mb-2 text-right w-48">
            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                {pendingActionsCount > 0 && (
                  <div className="flex items-center gap-1 text-warning">
                    <Clock className="w-4 h-4" />
                    <span>{pendingActionsCount}</span>
                  </div>
                )}
                {deniedTodayCount > 0 && (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span>{deniedTodayCount}</span>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={handleOpenAlerts}
              >
                פירוט
              </Button>
            </div>
          </div>
        )}

        {/* Main FAB */}
        <div className="relative">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={cn(
                  "w-14 h-14 rounded-full shadow-elevated transition-all duration-300",
                  isMenuOpen
                    ? "bg-muted hover:bg-muted/80 rotate-45"
                    : "bg-gradient-to-r from-primary to-accent hover:shadow-glow",
                  totalAlerts > 0 && !isMenuOpen && shouldPulse && "animate-pulse"
                )}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-right">
              <p>{isMenuOpen ? "סגור תפריט" : "פתח סוכני AI"}</p>
              {totalAlerts > 0 && !isMenuOpen && (
                <p className="text-xs text-muted-foreground mt-1">
                  {totalAlerts} התראות ממתינות
                </p>
              )}
            </TooltipContent>
          </Tooltip>

          {/* Total Alerts Badge */}
          {totalAlerts > 0 && !isMenuOpen && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs flex items-center justify-center rounded-full bg-warning text-warning-foreground">
              {totalAlerts > 99 ? "99+" : totalAlerts}
            </Badge>
          )}

          {/* Pending Actions Indicator - clickable to navigate */}
          {pendingActionsCount > 0 && !isMenuOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`${pendingActionsCount} בקשות AI ממתינות לאישור`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAlerts();
                  }}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background"
                >
                  <span className="relative w-full h-full flex items-center justify-center rounded-full bg-warning text-warning-foreground">
                    <Clock className="w-3 h-3" />
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-right">
                <p>{pendingActionsCount} בקשות ממתינות לאישור</p>
                <p className="text-xs text-muted-foreground">לחץ לפתיחת מסך התראות</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Chat Panel - positioned to the right of the FAB */}
      {selectedModule && (
        <div className="fixed bottom-6 left-24 z-40">
          <ModularAgentChat
            moduleType={selectedModule as keyof typeof moduleAgentConfig}
            isOpen={true}
            onClose={handleCloseChat}
            isExpanded={isChatExpanded}
            onToggleExpand={() => setIsChatExpanded(!isChatExpanded)}
          />
        </div>
      )}

      {/* Backdrop when menu is open */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/50 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </TooltipProvider>
  );
}

