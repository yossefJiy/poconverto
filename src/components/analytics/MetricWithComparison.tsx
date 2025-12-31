import { forwardRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricWithComparisonProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

export const MetricWithComparison = forwardRef<HTMLDivElement, MetricWithComparisonProps>(
  function MetricWithComparison({ label, value, change, icon, color }, ref) {
    const isPositive = change !== undefined && change >= 0;
    
    return (
      <div ref={ref} className="bg-muted/50 rounded-lg p-4 transition-all hover:scale-[1.02]">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
            {icon}
          </div>
        </div>
        <p className="text-xl font-bold">{value}</p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          {change !== undefined && (
            <span className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5",
              isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
            )}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? "+" : ""}{change}%
            </span>
          )}
        </div>
      </div>
    );
  }
);
