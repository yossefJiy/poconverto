import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Target, 
  Megaphone, 
  CheckSquare, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Plug,
  Bell,
  Palette,
  BarChart3,
  ShoppingBag,
  Activity,
  Network,
  HeartPulse,
  Bot,
  TrendingUp,
  FileText,
  Shield,
  Building2,
  Crosshair,
  FolderKanban,
  LayoutGrid,
  UserSearch,
  Share2,
  Receipt,
  ClipboardCheck,
  Contact,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useClientModules, ClientModules } from "@/hooks/useClientModules";
import { useCodeHealth } from "@/hooks/useCodeHealth";
import { useRoleSimulation } from "@/hooks/useRoleSimulation";
import { useSidebar } from "@/contexts/SidebarContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClientSwitcher } from "./ClientSwitcher";
import { RoleSimulatorMenu } from "@/components/admin/RoleSimulatorMenu";
import { RoleSimulatorDialog } from "@/components/admin/RoleSimulatorDialog";
import logoIcon from "@/assets/logo-icon.svg";
import logoText from "@/assets/logo-text.svg";
import byJiyLogo from "@/assets/by-jiy-logo.svg";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  moduleKey?: keyof ClientModules;
}

const menuItems: MenuItem[] = [
  { icon: LayoutGrid, label: "סוכנות", path: "/agency", moduleKey: "dashboard" },
  { icon: LayoutDashboard, label: "דשבורד", path: "/dashboard", moduleKey: "dashboard" },
  { icon: FolderKanban, label: "פרויקטים", path: "/projects", moduleKey: "tasks" },
  { icon: BarChart3, label: "אנליטיקס", path: "/analytics", moduleKey: "analytics" },
  { icon: ShoppingBag, label: "איקומרס", path: "/ecommerce", moduleKey: "ecommerce" },
  { icon: ShoppingBag, label: "Google Shopping", path: "/google-shopping", moduleKey: "ecommerce" },
  { icon: Target, label: "שיווק", path: "/marketing", moduleKey: "marketing" },
  { icon: Crosshair, label: "יעדים", path: "/kpis", moduleKey: "marketing" },
  { icon: UserSearch, label: "מתחרים", path: "/competitors", moduleKey: "marketing" },
  { icon: Share2, label: "סושיאל", path: "/social", moduleKey: "marketing" },
  { icon: Palette, label: "סטודיו", path: "/content-studio", moduleKey: "marketing" },
  { icon: Megaphone, label: "קמפיינים", path: "/campaigns", moduleKey: "campaigns" },
  { icon: Megaphone, label: "פרוגרמטי", path: "/programmatic", moduleKey: "campaigns" },
  { icon: Target, label: "A/B Tests", path: "/ab-tests", moduleKey: "campaigns" },
  { icon: CheckSquare, label: "משימות", path: "/tasks", moduleKey: "tasks" },
  { icon: Contact, label: "לידים", path: "/leads", moduleKey: "leads" },
  { icon: Receipt, label: "חיובים", path: "/billing", moduleKey: "billing" },
  { icon: ClipboardCheck, label: "אישורים", path: "/approvals", moduleKey: "approvals" },
  { icon: Users, label: "צוות", path: "/team", moduleKey: "team" },
  { icon: TrendingUp, label: "תובנות", path: "/insights", moduleKey: "insights" },
  { icon: Bot, label: "AI Agents", path: "/ai-agents", moduleKey: "ai_agent" },
  { icon: Bot, label: "AI Insights", path: "/ai-insights", moduleKey: "ai_agent" },
  { icon: FileText, label: "דוחות", path: "/reports", moduleKey: "reports" },
];

const settingsItems = [
  { icon: User, label: "פרופיל", path: "/settings", section: "profile", adminOnly: false },
  { icon: Bell, label: "התראות", path: "/settings", section: "notifications", adminOnly: false },
  { icon: Plug, label: "חיבורים", path: "/analytics?integrations=open", adminOnly: false },
  { icon: Palette, label: "מראה", path: "/settings", section: "appearance", adminOnly: false },
  { icon: Shield, label: "הרשאות", path: "/permissions", adminOnly: true },
  { icon: Building2, label: "ניהול לקוחות", path: "/client-management", adminOnly: true },
  { icon: Activity, label: "סטטוס מערכת", path: "/status", adminOnly: true },
  { icon: HeartPulse, label: "בריאות קוד", path: "/code-health", adminOnly: true },
  { icon: Network, label: "ארכיטקטורה", path: "/system-diagram", adminOnly: true },
  { icon: BarChart3, label: "קרדיטים", path: "/credits", adminOnly: true },
];



export function Sidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, role } = useAuth();
  const { isModuleEnabled, selectedClient, isAdmin } = useClientModules();
  const { stats: codeHealthStats } = useCodeHealth();
  const { isSimulating, effectiveRole } = useRoleSimulation();
  const [roleSimDialogOpen, setRoleSimDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const userEmail = user?.email || "";
  const userInitials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "U";

  const getRoleLabel = (role: string | null) => {
    const labels: Record<string, string> = {
      super_admin: "סופר אדמין",
      admin: "אדמין",
      agency_manager: "מנהל סוכנות",
      team_manager: "מנהל צוות",
      employee: "עובד",
      premium_client: "לקוח פרמיום",
      basic_client: "לקוח בסיס",
      demo: "משתמש דמו",
    };
    return role ? labels[role] || role : "משתמש";
  };

  // Filter menu items based on enabled modules
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.moduleKey) return true;
    return isModuleEnabled(item.moduleKey);
  });

  // Display role - show effective role if simulating
  const displayRole = isSimulating ? effectiveRole : role;

  return (
    <aside 
      className={cn(
        "fixed right-0 top-0 h-screen bg-sidebar border-l border-sidebar-border transition-all duration-300 z-50 flex flex-col",
        isCollapsed ? "w-20" : "w-64"
      )}
      style={{ background: "var(--gradient-sidebar)" }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
        <Link to="/dashboard" className="flex items-center gap-3">
          {!isCollapsed && (
            <div className="flex flex-col items-end animate-fade-in">
              <img src={logoText} alt="Converto" className="h-4 w-auto" />
              <img src={byJiyLogo} alt="by JIY" className="h-2 w-auto mt-1.5 opacity-70" />
            </div>
          )}
          <img 
            src={logoIcon} 
            alt="Converto" 
            className={cn(
              "transition-all duration-300",
              isCollapsed ? "h-10 w-auto" : "h-7 w-auto"
            )} 
          />
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {isCollapsed ? (
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Client Switcher */}
      <div className="p-3 border-b border-sidebar-border shrink-0">
        <ClientSwitcher collapsed={isCollapsed} />
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {visibleMenuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                "opacity-0 animate-slide-right",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: "forwards" }}
            >
              <div className="relative">
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-200 shrink-0",
                  isActive && "scale-110"
                )} />
              </div>
              {!isCollapsed && (
                <span className="font-medium flex-1">{item.label}</span>
              )}
              {isActive && (
                <div className="absolute right-0 w-1 h-6 bg-primary rounded-l-full" />
              )}
            </Link>
          );
        })}

        {/* Client Settings - Only for admins when client is selected */}
        {selectedClient && isAdmin && (
          <Link
            to="/clients"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
              location.pathname === "/clients"
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            )}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <span className="font-medium">הגדרות לקוח</span>
            )}
          </Link>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border shrink-0">
        {/* Settings Dropdown */}
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  isCollapsed && "justify-center px-2",
                  location.pathname === "/settings"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <Settings className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="font-medium">הגדרות</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <DropdownMenuLabel>הגדרות</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {settingsItems
                .filter(item => !item.adminOnly || isAdmin)
                .map((item) => (
                <DropdownMenuItem key={item.label} asChild>
                  <Link to={item.path} className="flex items-center gap-2 cursor-pointer">
                    <item.icon className="w-4 h-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.path === "/code-health" && codeHealthStats && codeHealthStats.criticalCount > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                        {codeHealthStats.criticalCount}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* User Menu */}
        <div className="p-3 pt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-auto py-2",
                  isCollapsed && "justify-center px-2",
                  isSimulating && "ring-2 ring-blue-500 ring-offset-2 ring-offset-sidebar"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={cn(
                    "text-sm",
                    isSimulating ? "bg-blue-500/20 text-blue-500" : "bg-primary/20 text-primary"
                  )}>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col items-start text-right overflow-hidden">
                    <span className="text-sm font-medium truncate max-w-[140px]">
                      {userEmail}
                    </span>
                    <span className={cn(
                      "text-xs",
                      isSimulating ? "text-blue-500" : "text-muted-foreground"
                    )}>
                      {getRoleLabel(displayRole)}
                      {isSimulating && " (סימולציה)"}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent forceMount align="end" side="top" className="w-56">
              <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  פרופיל
                </Link>
              </DropdownMenuItem>
              
              {/* Role Simulator Menu */}
              <RoleSimulatorMenu onOpenDialog={() => setRoleSimDialogOpen(true)} />
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 ml-2" />
                התנתקות
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <RoleSimulatorDialog open={roleSimDialogOpen} onOpenChange={setRoleSimDialogOpen} />
    </aside>
  );
}