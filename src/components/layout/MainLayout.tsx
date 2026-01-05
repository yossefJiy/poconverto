import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { SessionTimeoutDialog } from "@/components/SessionTimeoutDialog";
import { GlobalAgentFAB } from "@/components/ai/GlobalAgentFAB";
import { RealtimeNotificationsPanel } from "@/components/notifications/RealtimeNotificationsPanel";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const { showWarning, remainingTime, extendSession } = useSessionTimeout();
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      
      {/* Top Bar with Notifications */}
      <div className={cn(
        "fixed top-0 left-0 z-40 h-14 flex items-center justify-end px-4 transition-all duration-300",
        isCollapsed ? "right-20" : "right-64"
      )}>
        <RealtimeNotificationsPanel />
      </div>
      
      <main className={cn(
        "min-h-screen pt-14 transition-all duration-300",
        isCollapsed ? "mr-20" : "mr-64"
      )}>
        {children}
      </main>
      
      {/* Global AI Agent FAB - appears on all pages */}
      <GlobalAgentFAB />
      
      <SessionTimeoutDialog 
        open={showWarning} 
        remainingTime={remainingTime} 
        onExtendSession={extendSession} 
      />
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
