import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { SessionTimeoutDialog } from "@/components/SessionTimeoutDialog";
import { RoleSimulationBanner } from "@/components/admin/RoleSimulationBanner";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { useRoleSimulation } from "@/hooks/useRoleSimulation";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const { showWarning, remainingTime, extendSession } = useSessionTimeout();
  const { isCollapsed } = useSidebar();
  const { isSimulating } = useRoleSimulation();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      
      {/* Simulation Banner - Fixed at top */}
      {isSimulating && (
        <div className={cn(
          "fixed top-0 left-0 z-50 transition-all duration-300",
          isCollapsed ? "right-20" : "right-64"
        )}>
          <RoleSimulationBanner />
        </div>
      )}
      
      <main className={cn(
        "min-h-screen transition-all duration-300",
        isCollapsed ? "mr-20" : "mr-64",
        isSimulating ? "pt-[104px]" : "pt-14"
      )}>
        {children}
      </main>
      
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
