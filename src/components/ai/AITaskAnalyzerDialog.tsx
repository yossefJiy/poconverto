import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, User, Clock, Flag, Tag } from "lucide-react";
import { toast } from "sonner";
import { useAIModuleAccess } from "@/hooks/useAIModuleAccess";

interface AITaskAnalyzerDialogProps {
  taskTitle?: string;
  taskDescription?: string;
  clientName?: string;
  onApplyRecommendation?: (recommendation: {
    assignee?: string;
    duration_minutes?: number;
    priority?: string;
    category?: string;
  }) => void;
  trigger?: React.ReactNode;
}

export function AITaskAnalyzerDialog({
  taskTitle,
  taskDescription,
  clientName,
  onApplyRecommendation,
  trigger,
}: AITaskAnalyzerDialogProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<any>(null);
  const { isEnabled, canUseAI } = useAIModuleAccess('tasks');

  // Don't render trigger if AI is disabled
  if (!isEnabled || !canUseAI) {
    return null;
  }

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members-for-ai"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team")
        .select("id, name, departments")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: { prompt: string; type: string }) => {
      const { data: response, error } = await supabase.functions.invoke("ai-task-analyzer", {
        body: {
          prompt: data.prompt,
          type: data.type,
          context: {
            title: taskTitle,
            description: taskDescription,
            clientName,
          },
          teamMembers,
        },
      });
      if (error) throw error;
      return response;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.parsed) {
        toast.success("ניתוח הושלם בהצלחה");
      }
    },
    onError: (error) => {
      console.error("AI analysis error:", error);
      toast.error("שגיאה בניתוח AI");
    },
  });

  const handleAnalyzeTask = () => {
    if (!taskTitle && !prompt) {
      toast.error("נא להזין כותרת משימה או תיאור");
      return;
    }
    analyzeMutation.mutate({
      prompt: prompt || taskTitle || "",
      type: "analyze_task",
    });
  };

  const handleFreePrompt = () => {
    if (!prompt) {
      toast.error("נא להזין שאלה או בקשה");
      return;
    }
    analyzeMutation.mutate({
      prompt,
      type: "general",
    });
  };

  const handleApply = () => {
    if (result?.parsed && onApplyRecommendation) {
      onApplyRecommendation(result.parsed);
      toast.success("ההמלצות הוחלו");
      setOpen(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "גבוהה";
      case "medium":
        return "בינונית";
      case "low":
        return "נמוכה";
      default:
        return priority;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="w-4 h-4" />
            ניתוח AI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            עוזר AI למשימות
          </DialogTitle>
          <DialogDescription>
            {taskTitle
              ? "נתח את המשימה וקבל המלצות לאחראי, זמן ועדיפות"
              : "שאל את ה-AI כל שאלה או בקש עזרה בניתוח"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {taskTitle && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{taskTitle}</p>
              {taskDescription && (
                <p className="text-xs text-muted-foreground mt-1">{taskDescription}</p>
              )}
              {clientName && (
                <Badge variant="outline" className="mt-2 text-xs">
                  {clientName}
                </Badge>
              )}
            </div>
          )}

          <Textarea
            placeholder={
              taskTitle
                ? "הוסף הערות או שאלות נוספות (אופציונלי)..."
                : "תאר משימה או שאל שאלה..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />

          <div className="flex gap-2">
            {taskTitle && (
              <Button
                onClick={handleAnalyzeTask}
                disabled={analyzeMutation.isPending}
                className="flex-1 gap-2"
              >
                {analyzeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                נתח משימה
              </Button>
            )}
            <Button
              onClick={handleFreePrompt}
              disabled={analyzeMutation.isPending || !prompt}
              variant={taskTitle ? "outline" : "default"}
              className="flex-1 gap-2"
            >
              {analyzeMutation.isPending && !taskTitle ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              שאל את AI
            </Button>
          </div>

          {result && (
            <div className="border rounded-lg p-4 space-y-3 animate-fade-in">
              {result.parsed ? (
                <>
                  <h4 className="font-medium text-sm">המלצות AI:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {result.parsed.assignee && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{result.parsed.assignee}</span>
                      </div>
                    )}
                    {result.parsed.duration_minutes && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{result.parsed.duration_minutes} דקות</span>
                      </div>
                    )}
                    {result.parsed.priority && (
                      <div className="flex items-center gap-2 text-sm">
                        <Flag className="w-4 h-4 text-muted-foreground" />
                        <Badge variant={getPriorityColor(result.parsed.priority)}>
                          {getPriorityLabel(result.parsed.priority)}
                        </Badge>
                      </div>
                    )}
                    {result.parsed.category && (
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span>{result.parsed.category}</span>
                      </div>
                    )}
                  </div>
                  {result.parsed.reasoning && (
                    <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                      {result.parsed.reasoning}
                    </p>
                  )}
                  {onApplyRecommendation && (
                    <Button onClick={handleApply} className="w-full mt-2" size="sm">
                      החל המלצות
                    </Button>
                  )}
                </>
              ) : (
                <div className="prose prose-sm max-w-none text-right">
                  <p className="whitespace-pre-wrap text-sm">{result.text}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
