import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Loader2, Link2, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Metric {
  label: string;
  value: string;
  change?: number;
  icon?: ReactNode;
}

interface PlatformCompactCardProps {
  platform: string;
  platformKey: string;
  icon: ReactNode;
  iconBgColor: string;
  metrics: Metric[];
  detailPath: string;
  isLoading?: boolean;
  lastUpdated?: string;
  usingSnapshot?: boolean;
  isConnected?: boolean;
  canCreateCampaign?: boolean;
  onCreateCampaign?: () => void;
  onLinkPlatform?: () => void;
}

export function PlatformCompactCard({
  platform,
  platformKey,
  icon,
  iconBgColor,
  metrics,
  detailPath,
  isLoading,
  lastUpdated,
  usingSnapshot,
  isConnected = true,
  canCreateCampaign,
  onCreateCampaign,
  onLinkPlatform,
}: PlatformCompactCardProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4 card-shadow animate-pulse">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBgColor)}>
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-20 mb-2" />
            <div className="h-3 bg-muted rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 card-shadow transition-all hover:shadow-lg group">
      <div className="flex items-center gap-4">
        {/* Platform Icon */}
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", iconBgColor)}>
          {icon}
        </div>

        {/* Platform Name & Status */}
        <div className="flex-shrink-0 min-w-[100px]">
          <h3 className="font-bold text-sm">{platform}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            {usingSnapshot ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-500/20 text-yellow-600">
                <Clock className="w-2.5 h-2.5 ml-0.5" />
                שמור
              </Badge>
            ) : isConnected ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/20 text-green-600">
                מחובר
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground">
                לא מחובר
              </Badge>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {metrics.slice(0, 4).map((metric, idx) => (
            <div 
              key={metric.label} 
              className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-lg min-w-[100px]"
            >
              {metric.icon && (
                <div className="text-muted-foreground">
                  {metric.icon}
                </div>
              )}
              <div className="text-right">
                <p className="text-sm font-bold leading-none">{metric.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{metric.label}</p>
              </div>
              {metric.change !== undefined && (
                <span className={cn(
                  "text-[10px] font-medium flex items-center",
                  metric.change >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {metric.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {Math.abs(metric.change).toFixed(0)}%
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canCreateCampaign && onCreateCampaign && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 px-3 border-primary/30 hover:bg-primary/10 hover:border-primary"
                  onClick={onCreateCampaign}
                >
                  <Megaphone className="w-4 h-4 text-primary ml-1.5" />
                  <span className="text-xs font-medium">קמפיין</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>צור קמפיין חדש ב-{platform}</TooltipContent>
            </Tooltip>
          )}
          
          {onLinkPlatform && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={onLinkPlatform}
                >
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>קשר לפלטפורמה אחרת</TooltipContent>
            </Tooltip>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(detailPath)}
            className="text-primary hover:text-primary h-8 px-3"
          >
            פרטים
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
