import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useSubtasks } from "@/hooks/useSubtasks";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TaskSubtaskProgressProps {
  taskId: string;
  className?: string;
  onOpenEdit?: () => void;
}

export function TaskSubtaskProgress({ taskId, className, onOpenEdit }: TaskSubtaskProgressProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    subtasks,
    isLoading,
    updateSubtask,
    completedCount,
    totalCount,
    progressPercent,
  } = useSubtasks(taskId);

  if (isLoading || totalCount === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center gap-2 w-full text-right hover:bg-muted/50 rounded-md px-2 py-1 transition-colors">
          <Progress value={progressPercent} className="flex-1 h-1.5" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {completedCount}/{totalCount}
          </span>
          {isOpen ? (
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-2 space-y-1 pr-2">
        {subtasks.map((subtask) => {
          const isCompleted = subtask.status === "completed";
          
          return (
            <div
              key={subtask.id}
              className="flex items-center gap-2 text-sm py-1"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateSubtask.mutate({
                    id: subtask.id,
                    status: isCompleted ? "pending" : "completed",
                  });
                }}
                className="flex-shrink-0"
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>
              <span
                className={cn(
                  "flex-1 truncate",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {subtask.title}
              </span>
            </div>
          );
        })}
        
        {onOpenEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground h-7"
            onClick={(e) => {
              e.stopPropagation();
              onOpenEdit();
            }}
          >
            <Plus className="w-3 h-3 ml-1" />
            הוסף תת-משימה
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
