import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Target, 
  Megaphone, 
  CheckSquare, 
  Users, 
  Building2, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  ListTodo,
  Languages,
  Pencil,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
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
import { Switch } from "@/components/ui/switch";
import { useEditMode } from "@/hooks/useEditMode";

const menuItems = [
  { icon: LayoutDashboard, label: "דשבורד", path: "/" },
  { icon: Target, label: "שיווק", path: "/marketing" },
  { icon: Megaphone, label: "קמפיינים", path: "/campaigns" },
  { icon: CheckSquare, label: "משימות", path: "/tasks" },
  { icon: Users, label: "צוות", path: "/team" },
  { icon: Building2, label: "לקוחות", path: "/clients" },
  { icon: Languages, label: "תרגומים", path: "/translations" },
  { icon: ListTodo, label: "Backlog", path: "/backlog" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, signOut, role } = useAuth();

  const userEmail = user?.email || "";
  const userInitials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "U";

  const getRoleLabel = (role: string | null) => {
    const labels: Record<string, string> = {
      admin: "מנהל מערכת",
      manager: "מנהל",
      department_head: "ראש מחלקה",
      team_lead: "ראש צוות",
      team_member: "חבר צוות",
      client: "לקוח",
      demo: "משתמש דמו",
    };
    return role ? labels[role] || role : "משתמש";
  };

  return (
    <aside 
      className={cn(
        "fixed right-0 top-0 h-screen bg-sidebar border-l border-sidebar-border transition-all duration-300 z-50",
        collapsed ? "w-20" : "w-64"
      )}
      style={{ background: "var(--gradient-sidebar)" }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <h1 className="text-xl font-bold gradient-text animate-fade-in">
            MarketFlow
          </h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                "opacity-0 animate-slide-right",
                isActive 
                  ? "bg-primary/10 text-primary glow" 
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: "forwards" }}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200",
                isActive && "scale-110"
              )} />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
              {isActive && (
                <div className="absolute right-0 w-1 h-8 bg-primary rounded-l-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section at bottom */}
      <div className="absolute bottom-0 right-0 left-0 border-t border-sidebar-border">
        {/* Settings */}
        <div className="px-4 py-2">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
              "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              location.pathname === "/settings" && "bg-primary/10 text-primary"
            )}
          >
            <Settings className="w-5 h-5" />
            {!collapsed && <span className="font-medium">הגדרות</span>}
          </Link>
        </div>

        {/* User Menu */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-auto py-2",
                  collapsed && "justify-center px-2"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
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
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                  <User className="w-4 h-4" />
                  פרופיל
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={signOut}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="w-4 h-4 ml-2" />
                התנתקות
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}
