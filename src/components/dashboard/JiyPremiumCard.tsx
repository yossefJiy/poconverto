import React, { forwardRef } from "react";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import logoText from "@/assets/logo-text.svg";
import logoIcon from "@/assets/logo-icon.svg";

interface JiyPremiumCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function JiyPremiumCard({ title, children, className }: JiyPremiumCardProps) {
  return (
    <div className={cn("jiy-premium-card rounded-xl overflow-hidden", className)}>
      {/* Premium header */}
      <div className="relative p-4 border-b border-[hsl(var(--jiy-gold))]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[hsl(var(--jiy-gold))] to-[hsl(var(--jiy-gold-dark))] flex items-center justify-center shadow-lg">
              <img src={logoIcon} alt="JIY" className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Crown className="w-4 h-4 text-[hsl(var(--jiy-gold))]" />
                {title}
              </h3>
              <p className="text-xs text-muted-foreground">Switch to Converting</p>
            </div>
          </div>
          <img src={logoText} alt="JIY Digital" className="h-8 opacity-80" />
        </div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 jiy-shimmer pointer-events-none" />
      </div>

      {/* Content */}
      <div className="relative p-4">
        {children}
      </div>
    </div>
  );
}

interface JiyPremiumBadgeProps {
  className?: string;
}

export const JiyPremiumBadge = forwardRef<HTMLDivElement, JiyPremiumBadgeProps>(
  ({ className }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
          "bg-gradient-to-r from-[hsl(var(--jiy-gold))]/20 to-[hsl(var(--jiy-gold-light))]/20",
          "border border-[hsl(var(--jiy-gold))]/50",
          "text-[hsl(var(--jiy-gold))] text-xs font-medium",
          className
        )}>
        <Crown className="w-3 h-3" />
        <span>JIY</span>
      </div>
    );
  }
);

JiyPremiumBadge.displayName = "JiyPremiumBadge";