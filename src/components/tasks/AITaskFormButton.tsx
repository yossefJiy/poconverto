import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { toast } from "sonner";
import { 
  Sparkles, 
  Loader2,
  User,
  Clock,
  Flag,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  departments: string[];
}

interface AIRecommendation {
  assignee: string;
  duration_minutes: number;
  priority: "low" | "medium" | "high";
  category: string;
  reasoning: string;
}

interface AITaskFormButtonProps {
  title: string;
  description: string;
  onApplyRecommendation: (recommendation: AIRecommendation) => void;
}

const priorityLabels = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
};

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning-foreground",
  high: "bg-destructive/20 text-destructive",
};

export function AITaskFormButton({ title, description, onApplyRecommendation }: AITaskFormButtonProps) {
  const { selectedClient } = useClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team")
        .select("id, name, departments")
        .eq("is_active", true);
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const analyzeTask = async () => {
    if (!title.trim()) {
      toast.error("נא להזין כותרת למשימה");
      return;
    }

    setIsAnalyzing(true);
    setRecommendation(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-task-analyzer", {
        body: {
          type: "analyze_task",
          context: {
            title,
            description,
            clientName: selectedClient?.name,
          },
          teamMembers: teamMembers.map(m => ({
            name: m.name,
            departments: m.departments,
          })),
        },
      });

      if (error) throw error;

      if (data.parsed) {
        setRecommendation(data.parsed);
        setDialogOpen(true);
      } else {
        toast.error("לא התקבלה המלצה מה-AI");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error("שגיאה בניתוח המשימה");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (recommendation) {
      onApplyRecommendation(recommendation);
      setDialogOpen(false);
      toast.success("ההמלצות הוחלו בהצלחה");
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={analyzeTask}
        disabled={isAnalyzing || !title.trim()}
        className="gap-2"
      >
        {isAnalyzing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {isAnalyzing ? "מנתח..." : "ניתוח AI"}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              המלצות AI למשימה
            </DialogTitle>
          </DialogHeader>

          {recommendation && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    אחראי מומלץ
                  </span>
                  <Badge variant="secondary">{recommendation.assignee || "לא זוהה"}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    משך זמן משוער
                  </span>
                  <Badge variant="secondary">{recommendation.duration_minutes} דקות</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    עדיפות
                  </span>
                  <Badge className={cn(priorityColors[recommendation.priority])}>
                    {priorityLabels[recommendation.priority]}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    קטגוריה
                  </span>
                  <Badge variant="outline">{recommendation.category || "כללי"}</Badge>
                </div>
              </div>

              {recommendation.reasoning && (
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    💡 {recommendation.reasoning}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  ביטול
                </Button>
                <Button onClick={handleApply}>
                  החל המלצות
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
