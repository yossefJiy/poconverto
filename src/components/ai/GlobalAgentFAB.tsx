import { useState } from "react";
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

// Unique icons for each module with better visual distinction
const moduleIconsEnhanced: Record<string, { icon: any; gradient: string; description: string }> = {
  marketing: {
    icon: Target,
    gradient: "from-blue-500 to-cyan-400",
    description: "ניתוח קמפיינים, קופי שיווקי, אסטרטגיה",
  },
  analytics: {
    icon: BarChart3,
    gradient: "from-green-500 to-emerald-400",
    description: "סיכום ביצועים, מגמות, השוואות",
  },
  ecommerce: {
    icon: ShoppingCart,
    gradient: "from-orange-500 to-amber-400",
    description: "מכירות, מלאי, המרות",
  },
  tasks: {
    icon: ListTodo,
    gradient: "from-purple-500 to-violet-400",
    description: "תיעדוף, תכנון, משימות חדשות",
  },
  team: {
    icon: Users,
    gradient: "from-cyan-500 to-teal-400",
    description: "עומס צוות, חלוקת עבודה",
  },
  campaigns: {
    icon: TrendingUp,
    gradient: "from-pink-500 to-rose-400",
    description: "סטטוס קמפיינים, אופטימיזציה",
  },
  insights: {
    icon: Lightbulb,
    gradient: "from-yellow-500 to-orange-400",
    description: "תובנות AI, הזדמנויות, המלצות",
  },
  reports: {
    icon: FileText,
    gradient: "from-amber-500 to-yellow-400",
    description: "דוחות, סיכומים, הצגות",
  },
};

export function GlobalAgentFAB() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const { isModuleEnabled } = useClientModules();
  const { unreadCount, pendingActionsCount, deniedTodayCount } = useAICapabilityAlerts();

  // Get enabled modules
  const enabledModules = Object.keys(moduleAgentConfig).filter(key => {
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

  const totalAlerts = unreadCount + pendingActionsCount;

  return (
    <TooltipProvider delayDuration={300}>
      {/* Floating Action Button - bottom LEFT */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col-reverse items-center gap-3">
        {/* Module buttons - show when menu is open */}
        <div className={cn(
          "flex flex-col gap-2 transition-all duration-300",
          isMenuOpen 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 translate-y-4 pointer-events-none"
        )}>
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
                      enhanced?.gradient || "from-gray-500 to-gray-400"
                    )}
                    style={{ 
                      transitionDelay: `${idx * 50}ms`,
                      opacity: isMenuOpen ? 1 : 0,
                      transform: isMenuOpen ? 'scale(1)' : 'scale(0.8)'
                    }}
                    onClick={() => handleSelectModule(module)}
                  >
                    <Icon className="w-5 h-5 text-white" />
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

        {/* Alerts indicator when menu is open */}
        {isMenuOpen && totalAlerts > 0 && (
          <div className="bg-card rounded-lg shadow-lg p-3 border mb-2 text-right">
            <div className="flex items-center gap-2 text-sm">
              {pendingActionsCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Clock className="w-4 h-4" />
                      <span>{pendingActionsCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>פעולות ממתינות לאישור</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {deniedTodayCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>{deniedTodayCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>פעולות שנחסמו היום</p>
                  </TooltipContent>
                </Tooltip>
              )}
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
                  totalAlerts > 0 && !isMenuOpen && "animate-pulse"
                )}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Sparkles className="w-6 h-6" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{isMenuOpen ? "סגור תפריט" : "פתח סוכני AI"}</p>
              {totalAlerts > 0 && !isMenuOpen && (
                <p className="text-xs text-muted-foreground">
                  {totalAlerts} התראות ממתינות
                </p>
              )}
            </TooltipContent>
          </Tooltip>
          
          {/* Alert Badge */}
          {unreadCount > 0 && !isMenuOpen && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs flex items-center justify-center rounded-full"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          
          {/* Pending Actions Indicator */}
          {pendingActionsCount > 0 && !isMenuOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-pulse border-2 border-background flex items-center justify-center">
                  <Clock className="w-2.5 h-2.5 text-white" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{pendingActionsCount} פעולות ממתינות לאישור</p>
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
