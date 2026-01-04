import { useMemo, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const { isModuleEnabled } = useClientModules();
  const {
    pendingActions,
    pendingActionsCount,
    deniedTodayCount,
    limitWarningsCount,
    totalCount,
  } = useAICapabilityAlerts();

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

  const totalAlerts = totalCount;

  const pendingPreview = useMemo(() => pendingActions.slice(0, 3), [pendingActions]);

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

        {/* Alerts indicator when menu is open */}
        {isMenuOpen && totalAlerts > 0 && (
          <div className="bg-card rounded-lg shadow-lg p-3 border mb-2 text-right w-64">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm">
                {pendingActionsCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-warning">
                        <Clock className="w-4 h-4" />
                        <span>{pendingActionsCount}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>בקשות ממתינות לאישור</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {deniedTodayCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span>{deniedTodayCount}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>פעולות שנחסמו היום</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {limitWarningsCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-warning">
                        <AlertCircle className="w-4 h-4" />
                        <span>{limitWarningsCount}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>מתקרבים להגבלת שימוש יומית</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setAlertsOpen(true);
                }}
              >
                פירוט
              </Button>
            </div>

            {pendingPreview.length > 0 && (
              <div className="mt-2 space-y-1">
                {pendingPreview.map((a: any) => (
                  <p key={a.id} className="text-xs text-muted-foreground truncate">
                    {a.action_data?.title || a.action_data?.campaign_name || a.action_type}
                  </p>
                ))}
              </div>
            )}
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
                  totalAlerts > 0 &&
                    !isMenuOpen &&
                    "animate-pulse-glow glow ring-2 ring-warning/40",
                )}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-right">
              <p>{isMenuOpen ? "סגור תפריט" : "פתח סוכני AI"}</p>
              {totalAlerts > 0 && !isMenuOpen && (
                <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                  <p>ממתינות: {pendingActionsCount}</p>
                  <p>נחסמו היום: {deniedTodayCount}</p>
                  <p>אזהרות מכסה: {limitWarningsCount}</p>
                  <p className="pt-1">לחץ על הנקודה כדי לראות פירוט</p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>

          {/* Total Alerts Badge */}
          {totalAlerts > 0 && !isMenuOpen && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs flex items-center justify-center rounded-full bg-warning text-warning-foreground">
              {totalAlerts > 99 ? "99+" : totalAlerts}
            </Badge>
          )}

          {/* Pending Actions Indicator */}
          {pendingActionsCount > 0 && !isMenuOpen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`${pendingActionsCount} בקשות AI ממתינות לאישור`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAlertsOpen(true);
                  }}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-warning/60 animate-ping"
                  />
                  <span className="relative w-full h-full flex items-center justify-center rounded-full bg-warning text-warning-foreground">
                    <Clock className="w-3 h-3" />
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-right">
                <p>{pendingActionsCount} בקשות ממתינות לאישור</p>
                <p className="text-xs text-muted-foreground">לחץ לפירוט</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Alerts / Pending approvals dialog */}
      <Dialog open={alertsOpen} onOpenChange={setAlertsOpen}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle>התראות ובקשות AI</DialogTitle>
            <DialogDescription>
              כרגע יש {pendingActionsCount} בקשות ממתינות לאישור, {deniedTodayCount} פעולות שנחסמו היום,
              ו-{limitWarningsCount} אזהרות מכסה.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <p className="font-medium">ממתינות לאישור</p>
              </div>
              <Badge className="bg-warning text-warning-foreground">
                {pendingActionsCount}
              </Badge>
            </div>

            {pendingActionsCount === 0 ? (
              <p className="text-sm text-muted-foreground">אין בקשות ממתינות כרגע.</p>
            ) : (
              <div className="space-y-2">
                {pendingActions.slice(0, 10).map((action: any) => {
                  const title =
                    action.action_data?.title ||
                    action.action_data?.campaign_name ||
                    `פעולה ממתינה: ${action.action_type}`;
                  const details = action.action_data?.suggested_change || action.action_data?.description;

                  return (
                    <div key={action.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-snug">{title}</p>
                          {details && (
                            <p className="mt-1 text-sm text-muted-foreground leading-snug">
                              {details}
                            </p>
                          )}
                        </div>
                        <Badge className="bg-warning text-warning-foreground">ממתין</Badge>
                      </div>
                    </div>
                  );
                })}

                {pendingActionsCount > 10 && (
                  <p className="text-xs text-muted-foreground">מוצגות 10 האחרונות.</p>
                )}

                <Button asChild variant="link" className="p-0 h-auto">
                  <a href="/agent-alerts">פתח מסך התראות</a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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

