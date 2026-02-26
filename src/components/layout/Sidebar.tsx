import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
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
  Shield,
  Building2,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
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
import { ClientSwitcher } from "./ClientSwitcher";
import logoIcon from "@/assets/logo-icon.svg";
import logoText from "@/assets/logo-text.svg";
import byJiyLogo from "@/assets/by-jiy-logo.svg";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "סקירה כללית", path: "/dashboard" },
  { icon: BarChart3, label: "קמפיינים", path: "/analytics/campaigns" },
  { icon: ShoppingCart, label: "הכנסות מהאתר", path: "/analytics/store" },
  { icon: DollarSign, label: "הכנסות אופליין", path: "/analytics/offline-revenue" },
  { icon: Users, label: "הגדרות לקוח", path: "/clients" },
  { icon: Building2, label: "ניהול לקוחות", path: "/client-management" },
  { icon: Shield, label: "הרשאות", path: "/permissions" },
  { icon: Settings, label: "הגדרות", path: "/settings" },
];

export function Sidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, role } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const userEmail = user?.email || "";
  const userInitials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "U";

  const getRoleLabel = (r: string | null) => {
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
    return r ? labels[r] || r : "משתמש";
  };

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
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
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
              style={{ animationDelay: `${index * 0.03}s`, animationFillMode: "forwards" }}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200 shrink-0",
                isActive && "scale-110"
              )} />
              {!isCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {isActive && (
                <div className="absolute right-0 w-1 h-5 bg-primary rounded-l-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Menu */}
      <div className="border-t border-sidebar-border shrink-0 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-auto py-2",
                isCollapsed && "justify-center px-2"
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/20 text-primary text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col items-start text-right overflow-hidden">
                  <span className="text-sm font-medium truncate max-w-[140px]">
                    {userEmail}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getRoleLabel(role)}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent forceMount align="end" side="top" className="w-56">
            <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
              <LogOut className="w-4 h-4 ml-2" />
              התנתקות
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
