import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Subtask {
  id: string;
  parent_task_id: string;
  title: string;
  description: string | null;
  status: string;
  assignee_id: string | null;
  due_date: string | null;
  sort_order: number;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useSubtasks(parentTaskId: string | null) {
  const queryClient = useQueryClient();

  const { data: subtasks = [], isLoading } = useQuery({
    queryKey: ["subtasks", parentTaskId],
    queryFn: async () => {
      if (!parentTaskId) return [];
      
      const { data, error } = await supabase
        .from("task_subtasks")
        .select("*")
        .eq("parent_task_id", parentTaskId)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as Subtask[];
    },
    enabled: !!parentTaskId,
  });

  const createSubtask = useMutation({
    mutationFn: async (subtask: { title: string; parent_task_id: string; assignee_id?: string }) => {
      // Get max sort_order
      const maxOrder = subtasks.length > 0 
        ? Math.max(...subtasks.map(s => s.sort_order)) + 1 
        : 0;

      const { data, error } = await supabase
        .from("task_subtasks")
        .insert({
          title: subtask.title,
          parent_task_id: subtask.parent_task_id,
          assignee_id: subtask.assignee_id || null,
          sort_order: maxOrder,
          status: "pending",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", parentTaskId] });
      toast.success("תת-משימה נוספה");
    },
    onError: () => toast.error("שגיאה בהוספת תת-משימה"),
  });

  const updateSubtask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subtask> & { id: string }) => {
      const updateData: Partial<Subtask> & { completed_at?: string | null } = { ...updates };
      
      // If completing, set completed_at
      if (updates.status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else if (updates.status && updates.status !== "completed") {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from("task_subtasks")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", parentTaskId] });
    },
    onError: () => toast.error("שגיאה בעדכון תת-משימה"),
  });

  const deleteSubtask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("task_subtasks")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", parentTaskId] });
      toast.success("תת-משימה נמחקה");
    },
    onError: () => toast.error("שגיאה במחיקת תת-משימה"),
  });

  const reorderSubtasks = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        sort_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("task_subtasks")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", parentTaskId] });
    },
  });

  // Calculate progress
  const completedCount = subtasks.filter(s => s.status === "completed").length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    subtasks,
    isLoading,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    reorderSubtasks,
    completedCount,
    totalCount,
    progressPercent,
  };
}
