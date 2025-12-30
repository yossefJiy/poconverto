import { ReactNode } from "react";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

interface PublicLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function PublicLayout({ 
  children, 
  showHeader = true, 
  showFooter = true 
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {showHeader && <PublicHeader />}
      <main className={showHeader ? "pt-16" : ""}>
        {children}
      </main>
      {showFooter && <PublicFooter />}
    </div>
  );
}
