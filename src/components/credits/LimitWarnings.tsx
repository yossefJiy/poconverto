import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, Ban, Clock, TrendingUp } from "lucide-react";
import { creditsToHours } from "@/hooks/useClientCredits";

interface ClientLimit {
  id: string;
  client_id: string;
  monthly_hours_limit: number | null;
  monthly_credits_limit: number | null;
  limit_type: string;
  overage_rate: number;
  alert_at_percentage: number;
  block_at_limit: boolean;
}

interface LimitWarningsProps {
  clientId: string;
  usedCredits: number;
  totalCredits: number;
  onRequestMore?: () => void;
  className?: string;
}

export function LimitWarnings({ 
  clientId, 
  usedCredits, 
  totalCredits, 
  onRequestMore,
  className 
}: LimitWarningsProps) {
  const { data: limit } = useQuery({
    queryKey: ["client-limit", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_limits")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ClientLimit | null;
    },
    enabled: !!clientId,
  });

  const remainingCredits = totalCredits - usedCredits;
  const usagePercentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;
  
  // Calculate limit-based thresholds
  const creditLimit = limit?.monthly_credits_limit || totalCredits;
  const alertThreshold = limit?.alert_at_percentage || 80;
  const isAtLimit = limit?.block_at_limit && usedCredits >= creditLimit;
  const isNearLimit = usagePercentage >= alertThreshold;
  const isOverage = usedCredits > creditLimit;

  if (!isNearLimit && !isAtLimit && !isOverage) {
    return null;
  }

  const hoursRemaining = creditsToHours(remainingCredits);
  const overageCredits = Math.max(0, usedCredits - creditLimit);

  return (
    <div className={cn("space-y-3", className)}>
      {isAtLimit && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <Ban className="h-4 w-4" />
          <AlertTitle>הגעת למגבלת הקרדיטים!</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              לא ניתן לבצע משימות נוספות עד לרכישת קרדיטים או לתחילת תקופה חדשה.
            </p>
            {onRequestMore && (
              <Button size="sm" variant="outline" onClick={onRequestMore}>
                בקש קרדיטים נוספים
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isOverage && !isAtLimit && (
        <Alert className="border-warning/50 bg-warning/10">
          <TrendingUp className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">חריגה מהמכסה החודשית</AlertTitle>
          <AlertDescription>
            <p className="text-muted-foreground mb-2">
              נוצלו {overageCredits.toLocaleString()} קרדיטים מעבר למכסה.
              {limit?.overage_rate && limit.overage_rate > 1 && (
                <span className="block mt-1">
                  תעריף חריגה: ×{limit.overage_rate} מהמחיר הרגיל
                </span>
              )}
            </p>
            <Progress 
              value={Math.min(usagePercentage, 120)} 
              className="h-2 [&>div]:bg-warning" 
            />
          </AlertDescription>
        </Alert>
      )}

      {isNearLimit && !isOverage && !isAtLimit && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">קרדיטים נמוכים</AlertTitle>
          <AlertDescription>
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">
                נותרו {remainingCredits.toLocaleString()} קרדיטים
              </span>
              <span className="flex items-center gap-1 text-sm">
                <Clock className="w-3 h-3" />
                {hoursRemaining.toFixed(1)} שעות
              </span>
            </div>
            <Progress 
              value={usagePercentage} 
              className="h-2 [&>div]:bg-warning" 
            />
            {onRequestMore && (
              <Button size="sm" variant="ghost" className="mt-2" onClick={onRequestMore}>
                בקש קרדיטים נוספים
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
