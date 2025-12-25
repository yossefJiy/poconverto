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
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "דשבורד", path: "/" },
  { icon: Target, label: "שיווק", path: "/marketing" },
  { icon: Megaphone, label: "קמפיינים", path: "/campaigns" },
  { icon: CheckSquare, label: "משימות", path: "/tasks" },
  { icon: Users, label: "צוות", path: "/team" },
  { icon: Building2, label: "לקוחות", path: "/clients" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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

      {/* Settings at bottom */}
      <div className="absolute bottom-4 right-0 left-0 px-4">
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
    </aside>
  );
}
