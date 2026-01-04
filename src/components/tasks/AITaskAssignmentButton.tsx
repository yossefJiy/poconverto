import { useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAIModuleAccess } from "@/hooks/useAIModuleAccess";
import { useQuery } from "@tanstack/react-query";

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

export function AITaskAssignmentButton({
  title,
  description,
  onApply,
  disabled,
}: AITaskAssignmentButtonProps) {
  const { canUseAI, isLoading: isLoadingAccess } = useAIModuleAccess("tasks");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);

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
        onApply(rec);
        toast.success("המלצות AI הוחלו");
      }
    } catch (error) {
      console.error("AI assignment error:", error);
      toast.error("שגיאה בקבלת המלצות AI");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={recommendation ? "default" : "outline"}
            size="icon"
            onClick={handleAnalyze}
            disabled={disabled || isLoading || !title.trim()}
            className="h-8 w-8"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : recommendation ? (
              <Check className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-right max-w-xs">
          {recommendation ? (
            <div className="space-y-1">
              <p className="font-medium text-success">המלצות הוחלו!</p>
              {recommendation.reasoning && (
                <p className="text-xs">{recommendation.reasoning}</p>
              )}
            </div>
          ) : (
            <div>
              <p className="font-medium">שיוך חכם עם AI</p>
              <p className="text-xs text-muted-foreground">
                המלצה על מחלקה, קטגוריה ואיש צוות
              </p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
