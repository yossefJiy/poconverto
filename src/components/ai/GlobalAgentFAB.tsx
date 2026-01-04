import { useState } from "react";
import { 
  Bot, 
  X,
  Target,
  BarChart3,
  ShoppingCart,
  ListTodo,
  Users,
  TrendingUp,
  Lightbulb,
  FileText,
  MessageSquare,
  Sparkles,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ModularAgentChat, moduleAgentConfig } from "./ModularAgentChat";
import { useClientModules } from "@/hooks/useClientModules";
import { useAICapabilityAlerts } from "@/hooks/useAICapabilityAlerts";

const moduleIcons: Record<string, any> = {
  marketing: Target,
  analytics: BarChart3,
  ecommerce: ShoppingCart,
  tasks: ListTodo,
  team: Users,
  campaigns: TrendingUp,
  insights: Lightbulb,
  reports: FileText,
};

export function GlobalAgentFAB() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const { isModuleEnabled } = useClientModules();
  const { unreadCount, pendingActionsCount } = useAICapabilityAlerts();

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

  return (
    <>
      {/* Floating Action Button */}
      {/* Floating Action Button - bottom LEFT */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col-reverse items-center gap-3">
        {/* Module buttons - show when menu is open */}
        <div className={cn(
          "flex flex-col gap-2 transition-all duration-300",
          isMenuOpen 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 translate-y-4 pointer-events-none"
        )}>
          {enabledModules.slice(0, 6).map((module, idx) => {
            const config = moduleAgentConfig[module];
            const Icon = config.icon;
            return (
              <Button
                key={module}
                variant="secondary"
                size="icon"
                className={cn(
                  "w-12 h-12 rounded-full shadow-lg transition-all duration-200",
                  config.bgColor,
                  "hover:scale-110"
                )}
                style={{ 
                  transitionDelay: `${idx * 50}ms`,
                  opacity: isMenuOpen ? 1 : 0,
                  transform: isMenuOpen ? 'scale(1)' : 'scale(0.8)'
                }}
                onClick={() => handleSelectModule(module)}
                title={config.label}
              >
                <Icon className={cn("w-5 h-5", config.color)} />
              </Button>
            );
          })}
        </div>

        {/* Main FAB */}
        <div className="relative">
          <Button
            size="icon"
            className={cn(
              "w-14 h-14 rounded-full shadow-elevated transition-all duration-300",
              isMenuOpen 
                ? "bg-muted hover:bg-muted/80 rotate-45" 
                : "bg-gradient-to-r from-primary to-accent hover:shadow-glow",
              unreadCount > 0 && !isMenuOpen && "animate-pulse"
            )}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </Button>
          
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
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse border-2 border-background" />
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
    </>
  );
}
