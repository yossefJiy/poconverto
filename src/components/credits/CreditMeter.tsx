import { cn } from "@/lib/utils";
import { Coins, AlertTriangle, TrendingDown } from "lucide-react";
import { creditsToHours, creditsToCost } from "@/hooks/useClientCredits";

interface CreditMeterProps {
  totalCredits: number;
  usedCredits: number;
  showDetails?: boolean;
  className?: string;
}

export function CreditMeter({ totalCredits, usedCredits, showDetails = true, className }: CreditMeterProps) {
  const remainingCredits = totalCredits - usedCredits;
  const usagePercentage = (usedCredits / totalCredits) * 100;
  const isLow = usagePercentage >= 80;
  const isExceeded = usagePercentage >= 100;

  const getColor = () => {
    if (isExceeded) return "bg-destructive";
    if (isLow) return "bg-warning";
    return "bg-primary";
  };

  const getTextColor = () => {
    if (isExceeded) return "text-destructive";
    if (isLow) return "text-warning";
    return "text-primary";
  };

  return (
    <div className={cn("bg-card rounded-xl border border-border p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", 
            isExceeded ? "bg-destructive/20" : isLow ? "bg-warning/20" : "bg-primary/20"
          )}>
            <Coins className={cn("w-6 h-6", getTextColor())} />
          </div>
          <div>
            <h3 className="font-bold text-lg">מאזן קרדיטים</h3>
            <p className="text-sm text-muted-foreground">תקופה נוכחית</p>
          </div>
        </div>
        {isLow && (
          <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium",
            isExceeded ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
          )}>
            {isExceeded ? <TrendingDown className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {isExceeded ? "חריגה!" : "קרדיטים נמוכים"}
          </div>
        )}
      </div>

      {/* Main Credit Display */}
      <div className="flex items-baseline gap-2 mb-6">
        <span className={cn("text-4xl font-bold", getTextColor())}>
          {remainingCredits.toLocaleString()}
        </span>
        <span className="text-muted-foreground">/ {totalCredits.toLocaleString()} קרדיטים</span>
      </div>

      {/* Progress Bar */}
      <div className="h-4 bg-muted rounded-full overflow-hidden mb-4">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", getColor())}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        />
      </div>

      {/* Stats */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold">{creditsToHours(remainingCredits).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">שעות נותרו</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{usedCredits.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">נוצלו</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">₪{creditsToCost(remainingCredits).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">שווי נותר</p>
          </div>
        </div>
      )}
    </div>
  );
}
