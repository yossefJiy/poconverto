import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { toast } from "sonner";

export interface FeatureRequest {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  category: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed" | "archived";
  converted_task_id: string | null;
  created_by: string | null;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useFeatureRequests() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();

  const { data: features = [], isLoading } = useQuery({
    queryKey: ["feature-requests", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("feature_requests")
        .select("*")
        .neq("status", "archived")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (selectedClient?.id) {
        query = query.or(`client_id.eq.${selectedClient.id},client_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FeatureRequest[];
    },
  });

  const { data: archivedFeatures = [] } = useQuery({
    queryKey: ["feature-requests-archived", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("feature_requests")
        .select("*")
        .eq("status", "archived")
        .order("archived_at", { ascending: false });

      if (selectedClient?.id) {
        query = query.or(`client_id.eq.${selectedClient.id},client_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FeatureRequest[];
    },
  });

  const addFeatureMutation = useMutation({
    mutationFn: async (feature: { title: string; description?: string; category?: string; priority?: string }) => {
      const { data, error } = await supabase
        .from("feature_requests")
        .insert({
          title: feature.title,
          description: feature.description || null,
          category: feature.category || "general",
          priority: feature.priority || "medium",
          client_id: selectedClient?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
      toast.success("הפיצ'ר נוסף בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה בהוספת הפיצ'ר");
    },
  });

  const updateFeatureMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FeatureRequest> & { id: string }) => {
      const { error } = await supabase
        .from("feature_requests")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
    },
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("feature_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
      toast.success("הפיצ'ר נמחק");
    },
  });

  const markCompletedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("feature_requests")
        .update({ 
          status: "completed", 
          completed_at: new Date().toISOString() 
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
      toast.success("הפיצ'ר סומן כהושלם");
    },
  });

  const archiveFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("feature_requests")
        .update({ 
          status: "archived", 
          archived_at: new Date().toISOString() 
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
      queryClient.invalidateQueries({ queryKey: ["feature-requests-archived"] });
      toast.success("הפיצ'ר הועבר לארכיון");
    },
  });

  const restoreFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("feature_requests")
        .update({ 
          status: "pending", 
          archived_at: null 
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
      queryClient.invalidateQueries({ queryKey: ["feature-requests-archived"] });
      toast.success("הפיצ'ר שוחזר מהארכיון");
    },
  });

  const convertToTaskMutation = useMutation({
    mutationFn: async (feature: FeatureRequest) => {
      // Create task from feature
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          title: feature.title,
          description: feature.description,
          client_id: feature.client_id,
          priority: feature.priority,
          status: "pending",
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Update feature with task reference
      const { error: updateError } = await supabase
        .from("feature_requests")
        .update({ 
          converted_task_id: task.id,
          status: "in_progress"
        })
        .eq("id", feature.id);

      if (updateError) throw updateError;

      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("הפיצ'ר הומר למשימה");
    },
  });

  return {
    features,
    archivedFeatures,
    isLoading,
    addFeature: addFeatureMutation.mutate,
    updateFeature: updateFeatureMutation.mutate,
    deleteFeature: deleteFeatureMutation.mutate,
    markCompleted: markCompletedMutation.mutate,
    archiveFeature: archiveFeatureMutation.mutate,
    restoreFeature: restoreFeatureMutation.mutate,
    convertToTask: convertToTaskMutation.mutate,
    isAdding: addFeatureMutation.isPending,
  };
}
