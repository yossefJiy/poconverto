import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { SessionTimeoutDialog } from "@/components/SessionTimeoutDialog";
import { GlobalAgentFAB } from "@/components/ai/GlobalAgentFAB";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { showWarning, remainingTime, extendSession } = useSessionTimeout();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <main className="ml-64 min-h-screen">
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
