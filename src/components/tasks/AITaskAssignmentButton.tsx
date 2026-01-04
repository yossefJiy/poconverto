import { useState } from "react";
import { Sparkles, Loader2, Check, User, Building2, Tag, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAIModuleAccess } from "@/hooks/useAIModuleAccess";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface AIRecommendation {
  department?: string;
  category?: string;
  assignee_name?: string;
  priority?: string;
  reasoning?: string;
}

interface AITaskAssignmentButtonProps {
  title: string;
  description?: string;
  onApply: (recommendation: AIRecommendation) => void;
  disabled?: boolean;
}

const categoryOptions = [
  "אסטרטגיה ותכנון",
  "קריאייטיב ועיצוב",
  "קמפיינים ופרסום",
  "ניתוח נתונים",
  "תפעול וניהול",
  "פיתוח ומערכות",
  "תוכן ו-SEO",
  "לקוחות ומכירות",
  "מנהל מוצר",
];

const priorityLabels: Record<string, string> = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning-foreground",
  high: "bg-destructive/20 text-destructive",
};

export function AITaskAssignmentButton({
  title,
  description,
  onApply,
  disabled,
}: AITaskAssignmentButtonProps) {
  const { canUseAI, isLoading: isLoadingAccess } = useAIModuleAccess("tasks");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-active-for-ai"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team")
        .select("id, name, departments")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
    enabled: canUseAI,
  });

  if (isLoadingAccess) return null;
  if (!canUseAI) return null;

  const handleAnalyze = async () => {
    if (!title.trim()) {
      toast.error("יש להזין כותרת למשימה");
      return;
    }

    setIsLoading(true);
    setRecommendation(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-task-assignment", {
        body: {
          title,
          description,
          categories: categoryOptions,
          teamMembers: teamMembers.map((m) => ({
            id: m.id,
            name: m.name,
            departments: m.departments,
          })),
        },
      });

      if (error) throw error;

      if (data?.error) {
        if (data.error.includes("Rate limit")) {
          toast.error("מגבלת בקשות AI. נסה שוב מאוחר יותר.");
        } else if (data.error.includes("credits")) {
          toast.error("קרדיטים AI נגמרו. פנה למנהל.");
        } else {
          throw new Error(data.error);
        }
        return;
      }

      const rec = data?.recommendation;
      if (rec) {
        setRecommendation(rec);
        setPopoverOpen(true);
      } else {
        toast.error("לא התקבלה המלצה מה-AI");
      }
    } catch (error) {
      console.error("AI assignment error:", error);
      toast.error("שגיאה בקבלת המלצות AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRecommendation = () => {
    if (recommendation) {
      onApply(recommendation);
      setPopoverOpen(false);
      toast.success("המלצות AI הוחלו");
    }
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant={recommendation ? "default" : "outline"}
                size="sm"
                onClick={handleAnalyze}
                disabled={disabled || isLoading || !title.trim()}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : recommendation ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isLoading ? "מנתח..." : "AI"}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>שיוך חכם עם AI - המלצה על מחלקה, קטגוריה ואיש צוות</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent 
        className="w-80" 
        dir="rtl" 
        align="end"
        side="bottom"
      >
        {recommendation && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 text-primary" />
              המלצות AI
            </div>

            <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
              {recommendation.department && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    מחלקה
                  </span>
                  <Badge variant="secondary" className="text-xs">{recommendation.department}</Badge>
                </div>
              )}

              {recommendation.category && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    קטגוריה
                  </span>
                  <Badge variant="outline" className="text-xs">{recommendation.category}</Badge>
                </div>
              )}

              {recommendation.assignee_name && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    אחראי
                  </span>
                  <Badge variant="secondary" className="text-xs">{recommendation.assignee_name}</Badge>
                </div>
              )}

              {recommendation.priority && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5" />
                    עדיפות
                  </span>
                  <Badge className={cn("text-xs", priorityColors[recommendation.priority])}>
                    {priorityLabels[recommendation.priority]}
                  </Badge>
                </div>
              )}
            </div>

            {recommendation.reasoning && (
              <p className="text-xs text-muted-foreground bg-primary/5 p-2 rounded">
                💡 {recommendation.reasoning}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setPopoverOpen(false)}
              >
                ביטול
              </Button>
              <Button 
                size="sm" 
                onClick={handleApplyRecommendation}
              >
                החל המלצות
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}