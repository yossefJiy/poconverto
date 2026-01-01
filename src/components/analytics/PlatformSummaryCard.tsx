import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Metric {
  label: string;
  value: string;
  change?: number;
}

interface PlatformSummaryCardProps {
  platform: string;
  platformKey: string;
  icon: ReactNode;
  iconBgColor: string;
  metrics: Metric[];
  detailPath: string;
  isLoading?: boolean;
  lastUpdated?: string;
  usingSnapshot?: boolean;
}

export function PlatformSummaryCard({
  platform,
  platformKey,
  icon,
  iconBgColor,
  metrics,
  detailPath,
  isLoading,
  lastUpdated,
  usingSnapshot,
}: PlatformSummaryCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-5 card-shadow animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBgColor)}>
            {icon}
          </div>
          <div className="h-5 bg-muted rounded w-24" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5 card-shadow transition-all hover:shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBgColor)}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-base">{platform}</h3>
            {usingSnapshot && (
              <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-600">
                <Clock className="w-3 h-3 ml-1" />
                נתונים שמורים
              </Badge>
            )}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(detailPath)}
          className="text-primary hover:text-primary"
        >
          פרטים
          <ArrowLeft className="w-4 h-4 mr-1" />
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-muted/50 rounded-lg p-3">
            <p className="text-lg font-bold">{metric.value}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              {metric.change !== undefined && (
                <span className={cn(
                  "text-xs font-medium flex items-center gap-0.5",
                  metric.change >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {metric.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {metric.change >= 0 ? "+" : ""}{metric.change.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
