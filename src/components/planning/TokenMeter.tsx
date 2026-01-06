import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenMeterProps {
  tokensUsed: number;
  estimatedSavings?: number;
  className?: string;
}

export const TokenMeter = ({ 
  tokensUsed, 
  estimatedSavings = 0,
  className 
}: TokenMeterProps) => {
  const { displayValue, unit, progress, color } = useMemo(() => {
    // Estimate max tokens per session (roughly 50K for a full planning session)
    const maxTokens = 50000;
    const progressPercent = Math.min((tokensUsed / maxTokens) * 100, 100);
    
    let displayVal: number;
    let unitStr: string;
    
    if (tokensUsed >= 1000) {
      displayVal = Math.round(tokensUsed / 100) / 10; // e.g., 12.3K
      unitStr = "K";
    } else {
      displayVal = tokensUsed;
      unitStr = "";
    }

    let colorClass: string;
    if (progressPercent < 50) {
      colorClass = "text-green-500";
    } else if (progressPercent < 80) {
      colorClass = "text-yellow-500";
    } else {
      colorClass = "text-red-500";
    }

    return {
      displayValue: displayVal,
      unit: unitStr,
      progress: progressPercent,
      color: colorClass
    };
  }, [tokensUsed]);

  const savingsDisplay = useMemo(() => {
    if (estimatedSavings <= 0) return null;
    if (estimatedSavings >= 1000) {
      return `${Math.round(estimatedSavings / 100) / 10}K`;
    }
    return estimatedSavings.toString();
  }, [estimatedSavings]);

  if (tokensUsed === 0) return null;

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className={cn("h-4 w-4", color)} />
            <span className="text-sm font-medium">צריכת טוקנים</span>
          </div>
          <span className={cn("text-sm font-bold", color)}>
            {displayValue}{unit}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        {savingsDisplay && (
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingDown className="h-3 w-3" />
            <span>חסכון משוער: {savingsDisplay} טוקנים</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
