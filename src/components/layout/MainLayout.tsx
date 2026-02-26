import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <main className={cn(
        "min-h-screen transition-all duration-300 pt-14",
        isCollapsed ? "mr-20" : "mr-64"
      )}>
        {children}
      </main>
    </div>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}
