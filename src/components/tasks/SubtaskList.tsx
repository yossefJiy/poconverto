import { useState } from "react";
import { Plus, CheckCircle2, Circle, Clock, GripVertical, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useSubtasks, Subtask } from "@/hooks/useSubtasks";

interface SubtaskListProps {
  parentTaskId: string;
  className?: string;
}

const statusConfig = {
  pending: { icon: Circle, color: "text-warning", label: "ממתין" },
  "in-progress": { icon: Clock, color: "text-info", label: "בתהליך" },
  completed: { icon: CheckCircle2, color: "text-success", label: "הושלם" },
};

export function SubtaskList({ parentTaskId, className }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const {
    subtasks,
    isLoading,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    reorderSubtasks,
    completedCount,
    totalCount,
    progressPercent,
  } = useSubtasks(parentTaskId);

  const handleAddSubtask = () => {
    if (!newTitle.trim()) return;
    
    createSubtask.mutate({
      title: newTitle.trim(),
      parent_task_id: parentTaskId,
    });
    
    setNewTitle("");
    setIsAdding(false);
  };

  const handleToggleStatus = (subtask: Subtask) => {
    const nextStatus = subtask.status === "completed" ? "pending" : "completed";
    updateSubtask.mutate({ id: subtask.id, status: nextStatus });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const currentOrder = subtasks.map(s => s.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedId);

    reorderSubtasks.mutate(currentOrder);
    setDraggedId(null);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">טוען...</div>;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="flex items-center gap-3">
          <Progress value={progressPercent} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {completedCount}/{totalCount} ({progressPercent}%)
          </span>
        </div>
      )}

      {/* Subtasks list */}
      <div className="space-y-1">
        {subtasks.map((subtask) => {
          const status = statusConfig[subtask.status] || statusConfig.pending;
          const StatusIcon = status.icon;

          return (
            <div
              key={subtask.id}
              draggable
              onDragStart={(e) => handleDragStart(e, subtask.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, subtask.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-colors group",
                draggedId === subtask.id && "opacity-50"
              )}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
              
              <button
                onClick={() => handleToggleStatus(subtask)}
                className="flex-shrink-0"
              >
                <StatusIcon className={cn("w-5 h-5 transition-colors", status.color)} />
              </button>
              
              <span className={cn(
                "flex-1 text-sm",
                subtask.status === "completed" && "line-through text-muted-foreground"
              )}>
                {subtask.title}
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => deleteSubtask.mutate(subtask.id)}
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Add subtask */}
      {isAdding ? (
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="כותרת תת-משימה..."
            className="flex-1 h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddSubtask();
              if (e.key === "Escape") setIsAdding(false);
            }}
          />
          <Button size="sm" variant="default" onClick={handleAddSubtask} disabled={!newTitle.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4 ml-2" />
          הוסף תת-משימה
        </Button>
      )}
    </div>
  );
}
