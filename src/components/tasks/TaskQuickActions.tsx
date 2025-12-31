import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Circle,
  Clock,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface TaskQuickActionsProps {
  taskId: string;
  currentStatus: string;
  currentTime?: string | null;
  compact?: boolean;
  onUpdate?: () => void;
}

const statusConfig = {
  pending: { color: "text-warning", bg: "bg-warning/10", label: "ממתין", icon: Circle },
  "in-progress": { color: "text-info", bg: "bg-info/10", label: "בתהליך", icon: Clock },
  completed: { color: "text-success", bg: "bg-success/10", label: "הושלם", icon: CheckCircle2 },
};

const timeOptions = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  return [
    `${hour.toString().padStart(2, "0")}:00`,
    `${hour.toString().padStart(2, "0")}:30`,
  ];
}).flat();

export function TaskQuickActions({
  taskId,
  currentStatus,
  currentTime,
  compact = false,
  onUpdate,
}: TaskQuickActionsProps) {
  const queryClient = useQueryClient();
  const status = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  const updateMutation = useMutation({
    mutationFn: async (updates: { status?: string; scheduled_time?: string | null }) => {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);
      if (error) throw error;
    },
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      await queryClient.cancelQueries({ queryKey: ["recent-tasks"] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(["tasks"]);
      const previousRecentTasks = queryClient.getQueryData(["recent-tasks"]);
      
      // Optimistically update
      queryClient.setQueriesData({ queryKey: ["tasks"] }, (old: any) => {
        if (!old) return old;
        return old.map((task: any) => 
          task.id === taskId ? { ...task, ...updates } : task
        );
      });
      
      queryClient.setQueriesData({ queryKey: ["recent-tasks"] }, (old: any) => {
        if (!old) return old;
        return old.map((task: any) => 
          task.id === taskId ? { ...task, ...updates } : task
        );
      });
      
      return { previousTasks, previousRecentTasks };
    },
    onError: (err, updates, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
      if (context?.previousRecentTasks) {
        queryClient.setQueryData(["recent-tasks"], context.previousRecentTasks);
      }
      toast.error("שגיאה בעדכון");
    },
    onSuccess: () => {
      toast.success("עודכן בהצלחה");
      onUpdate?.();
    },
    onSettled: () => {
      // Sync with server after mutation settles
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-tasks"] });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate({ status: newStatus });
  };

  const handleTimeChange = (newTime: string | null) => {
    updateMutation.mutate({ scheduled_time: newTime ? `${newTime}:00` : null });
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 px-2 gap-1", status.bg, status.color)}
          >
            <StatusIcon className="w-3 h-3" />
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>שינוי סטטוס</DropdownMenuLabel>
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <DropdownMenuItem
                key={key}
                onClick={() => handleStatusChange(key)}
                className={cn(currentStatus === key && "bg-muted")}
              >
                <Icon className={cn("w-4 h-4 ml-2", config.color)} />
                {config.label}
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>שעה מתוכננת</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleTimeChange(null)}>
            <Clock className="w-4 h-4 ml-2 text-muted-foreground" />
            ללא שעה
          </DropdownMenuItem>
          <div className="max-h-40 overflow-y-auto">
            {timeOptions.map((time) => (
              <DropdownMenuItem
                key={time}
                onClick={() => handleTimeChange(time)}
                className={cn(currentTime?.startsWith(time) && "bg-muted")}
              >
                <Clock className="w-4 h-4 ml-2 text-muted-foreground" />
                {time}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Status Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2", status.bg, status.color, "border-none")}
          >
            <StatusIcon className="w-4 h-4" />
            {status.label}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {Object.entries(statusConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <DropdownMenuItem
                key={key}
                onClick={() => handleStatusChange(key)}
                className={cn(currentStatus === key && "bg-muted")}
              >
                <Icon className={cn("w-4 h-4 ml-2", config.color)} />
                {config.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Time Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Clock className="w-4 h-4" />
            {currentTime ? currentTime.slice(0, 5) : "ללא שעה"}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-60 overflow-y-auto">
          <DropdownMenuItem onClick={() => handleTimeChange(null)}>
            ללא שעה
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {timeOptions.map((time) => (
            <DropdownMenuItem
              key={time}
              onClick={() => handleTimeChange(time)}
              className={cn(currentTime?.startsWith(time) && "bg-muted")}
            >
              {time}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
