import { cn } from "@/lib/utils";
import { TrendingUp, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PriorityBalanceBarProps {
  targetStability: number; // e.g., 70
  actualStability: number; // e.g., 68
  className?: string;
}

export function PriorityBalanceBar({ 
  targetStability, 
  actualStability, 
  className 
}: PriorityBalanceBarProps) {
  const targetInnovation = 100 - targetStability;
  const actualInnovation = 100 - actualStability;
  
  // Calculate if we're within acceptable range (±10%)
  const deviation = Math.abs(actualStability - targetStability);
  const isBalanced = deviation <= 10;
  const isOverStability = actualStability > targetStability + 10;
  const isOverInnovation = actualStability < targetStability - 10;

  const getStatusMessage = () => {
    if (isBalanced) return "האיזון תקין - ממשיכים כך!";
    if (isOverStability) return "יותר מדי יציבות - הוסיפו משימות חדשנות";
    if (isOverInnovation) return "יותר מדי יזמות - דגש על משימות שמכניסות כסף";
    return "";
  };

  const getStatusIcon = () => {
    if (isBalanced) return <CheckCircle className="w-4 h-4 text-success" />;
    return <AlertTriangle className="w-4 h-4 text-warning" />;
  };

  return (
    <div className={cn("bg-card border border-border rounded-xl p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">איזון עדיפויות</h3>
          <Tooltip>
            <TooltipTrigger>
              {getStatusIcon()}
            </TooltipTrigger>
            <TooltipContent>
              <p>{getStatusMessage()}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/60" />
            <span>יציבות ({targetStability}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-warning/60" />
            <span>יזמות ({targetInnovation}%)</span>
          </div>
        </div>
      </div>

      {/* Target Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>יעד</span>
          <span>{targetStability}% / {targetInnovation}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden flex">
          <div 
            className="h-full bg-primary/40"
            style={{ width: `${targetStability}%` }}
          />
          <div 
            className="h-full bg-warning/40"
            style={{ width: `${targetInnovation}%` }}
          />
        </div>
      </div>

      {/* Actual Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>בפועל</span>
          <span className={cn(
            !isBalanced && "font-medium",
            isOverStability && "text-primary",
            isOverInnovation && "text-warning"
          )}>
            {actualStability}% / {actualInnovation}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden flex relative">
          <div 
            className={cn(
              "h-full transition-all",
              isBalanced ? "bg-primary" : isOverStability ? "bg-primary" : "bg-primary/70"
            )}
            style={{ width: `${actualStability}%` }}
          />
          <div 
            className={cn(
              "h-full transition-all",
              isBalanced ? "bg-warning" : isOverInnovation ? "bg-warning" : "bg-warning/70"
            )}
            style={{ width: `${actualInnovation}%` }}
          />
          
          {/* Target indicator line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-foreground/50"
            style={{ left: `${targetStability}%` }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">יציבות: הכנסה + תחזוקה</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <TrendingUp className="w-4 h-4 text-warning" />
          <span className="text-muted-foreground">יזמות: צמיחה + חדשנות</span>
        </div>
      </div>
    </div>
  );
}