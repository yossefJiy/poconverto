import { useState } from "react";
import { 
  Brain, 
  Loader2, 
  Sparkles,
  User,
  Clock,
  Flag,
  Lightbulb,
  Lock
} from "lucide-react";
import { useAIModuleAccess } from "@/hooks/useAIModuleAccess";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  departments: string[];
}

interface AITaskAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  taskDescription?: string;
  taskCategory?: string;
  teamMembers: TeamMember[];
  onApplySuggestions: (suggestions: {
    assignee?: string;
    duration?: number;
    priority?: string;
    category?: string;
  }) => void;
}

interface AISuggestions {
  assignee?: string;
  assignee_reason?: string;
  duration_minutes?: number;
  duration_reason?: string;
  priority?: string;
  priority_reason?: string;
  category?: string;
  additional_tips?: string[];
}

export function AITaskAssistant({
  open,
  onOpenChange,
  taskTitle,
  taskDescription,
  taskCategory,
  teamMembers,
  onApplySuggestions,
}: AITaskAssistantProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null);
  const { isEnabled, canUseAI, isLoading: permissionLoading } = useAIModuleAccess('tasks');

  // If AI is disabled for this module, show a disabled state
  if (!isEnabled || !canUseAI) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              AI לא זמין
            </DialogTitle>
            <DialogDescription>
              יכולות AI אינן מופעלות עבור מודול המשימות
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              פנה למנהל המערכת להפעלת יכולות AI
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const analyzeTasks = async () => {
    if (!taskTitle.trim()) {
      toast.error('נא להזין כותרת למשימה');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-task-analyzer', {
        body: {
          type: 'analyze_task',
          prompt: `נתח את המשימה הבאה והצע:
1. מי צריך להיות אחראי על המשימה (מתוך רשימת חברי הצוות)
2. כמה זמן צריך להקדיש למשימה (בדקות)
3. מה רמת העדיפות (low/medium/high)
4. קטגוריה מתאימה

כותרת: ${taskTitle}
${taskDescription ? `תיאור: ${taskDescription}` : ''}
${taskCategory ? `קטגוריה נוכחית: ${taskCategory}` : ''}`,
          teamMembers: teamMembers.map(m => ({ name: m.name, departments: m.departments })),
          context: { taskTitle, taskDescription, taskCategory }
        }
      });

      if (error) throw error;
      
      // Parse the AI response
      const parsedSuggestions = data.parsed || parseAIResponse(data.text || data.response);
      setSuggestions(parsedSuggestions);
    } catch (err) {
      console.error('Error analyzing task:', err);
      toast.error('שגיאה בניתוח המשימה');
    } finally {
      setIsLoading(false);
    }
  };

  const parseAIResponse = (text: string): AISuggestions => {
    // Try to extract structured data from the AI response
    const suggestions: AISuggestions = {};
    
    // Find assignee from team members
    for (const member of teamMembers) {
      if (text.includes(member.name)) {
        suggestions.assignee = member.name;
        break;
      }
    }
    
    // Try to find duration
    const durationMatch = text.match(/(\d+)\s*(דקות|דקה|שעה|שעות)/);
    if (durationMatch) {
      let minutes = parseInt(durationMatch[1]);
      if (durationMatch[2].includes('שעה') || durationMatch[2].includes('שעות')) {
        minutes *= 60;
      }
      suggestions.duration_minutes = minutes;
    }
    
    // Try to find priority
    if (text.includes('גבוהה') || text.includes('high') || text.includes('דחוף')) {
      suggestions.priority = 'high';
    } else if (text.includes('בינונית') || text.includes('medium')) {
      suggestions.priority = 'medium';
    } else if (text.includes('נמוכה') || text.includes('low')) {
      suggestions.priority = 'low';
    }
    
    return suggestions;
  };

  const applySuggestions = () => {
    if (suggestions) {
      onApplySuggestions({
        assignee: suggestions.assignee,
        duration: suggestions.duration_minutes,
        priority: suggestions.priority,
        category: suggestions.category,
      });
      onOpenChange(false);
      toast.success('ההצעות הוחלו בהצלחה');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            עוזר AI למשימות
          </DialogTitle>
          <DialogDescription>
            ניתוח אוטומטי והצעות למשימה
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!suggestions && !isLoading && (
            <div className="text-center py-8">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary/50" />
              <p className="text-muted-foreground mb-4">
                ה-AI ינתח את המשימה ויציע אחראי, זמן משוער ועדיפות
              </p>
              <Button onClick={analyzeTasks} disabled={!taskTitle.trim()}>
                <Brain className="w-4 h-4 ml-2" />
                נתח משימה
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">מנתח את המשימה...</p>
            </div>
          )}

          {suggestions && !isLoading && (
            <div className="space-y-4">
              {/* Assignee Suggestion */}
              {suggestions.assignee && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium">אחראי מוצע</span>
                  </div>
                  <p className="text-lg font-bold">{suggestions.assignee}</p>
                  {suggestions.assignee_reason && (
                    <p className="text-sm text-muted-foreground mt-1">{suggestions.assignee_reason}</p>
                  )}
                </div>
              )}

              {/* Duration Suggestion */}
              {suggestions.duration_minutes && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-info" />
                    <span className="font-medium">זמן משוער</span>
                  </div>
                  <p className="text-lg font-bold">
                    {suggestions.duration_minutes >= 60 
                      ? `${Math.floor(suggestions.duration_minutes / 60)} שעות ${suggestions.duration_minutes % 60 > 0 ? `ו-${suggestions.duration_minutes % 60} דקות` : ''}`
                      : `${suggestions.duration_minutes} דקות`
                    }
                  </p>
                  {suggestions.duration_reason && (
                    <p className="text-sm text-muted-foreground mt-1">{suggestions.duration_reason}</p>
                  )}
                </div>
              )}

              {/* Priority Suggestion */}
              {suggestions.priority && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Flag className="w-4 h-4 text-warning" />
                    <span className="font-medium">עדיפות</span>
                  </div>
                  <p className={cn(
                    "text-lg font-bold",
                    suggestions.priority === 'high' && "text-destructive",
                    suggestions.priority === 'medium' && "text-warning",
                    suggestions.priority === 'low' && "text-muted-foreground"
                  )}>
                    {suggestions.priority === 'high' ? 'גבוהה' : 
                     suggestions.priority === 'medium' ? 'בינונית' : 'נמוכה'}
                  </p>
                  {suggestions.priority_reason && (
                    <p className="text-sm text-muted-foreground mt-1">{suggestions.priority_reason}</p>
                  )}
                </div>
              )}

              {/* Additional Tips */}
              {suggestions.additional_tips && suggestions.additional_tips.length > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <span className="font-medium">טיפים נוספים</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {suggestions.additional_tips.map((tip, i) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSuggestions(null)}>
                  נתח מחדש
                </Button>
                <Button className="flex-1" onClick={applySuggestions}>
                  החל הצעות
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
