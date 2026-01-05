import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export interface ApprovalWorkflow {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  workflow_type: string;
  steps: ApprovalStep[];
  is_active: boolean;
  auto_approve_threshold: number | null;
  require_all_approvers: boolean;
  created_at: string;
}

export interface ApprovalStep {
  step_number: number;
  name: string;
  approvers: string[];
  required_approvals: number;
}

export interface ApprovalItem {
  id: string;
  workflow_id: string | null;
  client_id: string | null;
  item_type: string;
  item_id: string | null;
  title: string;
  description: string | null;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  priority: string;
  current_step: number;
  total_steps: number;
  submitted_by: string | null;
  submitted_at: string;
  due_date: string | null;
  data: Record<string, any>;
  created_at: string;
  clients?: { name: string } | null;
}

export interface ApprovalDecision {
  id: string;
  approval_item_id: string;
  step_number: number;
  approver_id: string;
  decision: 'approved' | 'rejected' | 'request_changes';
  comments: string | null;
  decided_at: string;
}

export function useApprovals(clientId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch pending approval items
  const { data: pendingItems = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ["approval-items", "pending", clientId],
    queryFn: async () => {
      let query = supabase
        .from("approval_items")
        .select("*, clients(name)")
        .in("status", ["pending", "in_review"])
        .order("priority", { ascending: false })
        .order("submitted_at", { ascending: true });
      
      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ApprovalItem[];
    },
  });

  // Fetch all approval items
  const { data: allItems = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ["approval-items", "all", clientId],
    queryFn: async () => {
      let query = supabase
        .from("approval_items")
        .select("*, clients(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ApprovalItem[];
    },
  });

  // Fetch workflows
  const { data: workflows = [] } = useQuery({
    queryKey: ["approval-workflows", clientId],
    queryFn: async () => {
      let query = supabase
        .from("approval_workflows")
        .select("*")
        .eq("is_active", true);
      
      if (clientId) {
        query = query.or(`client_id.is.null,client_id.eq.${clientId}`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(w => ({
        ...w,
        steps: (w.steps as unknown as ApprovalStep[]) || [],
      })) as ApprovalWorkflow[];
    },
  });

  // Submit for approval
  const submitForApprovalMutation = useMutation({
    mutationFn: async (item: Partial<ApprovalItem>) => {
      const { data, error } = await supabase
        .from("approval_items")
        .insert({
          client_id: item.client_id,
          workflow_id: item.workflow_id,
          item_type: item.item_type || "general",
          item_id: item.item_id,
          title: item.title || "בקשה לאישור",
          description: item.description,
          priority: item.priority || "medium",
          submitted_by: user?.id,
          due_date: item.due_date,
          data: item.data || {},
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-items"] });
      toast.success("הבקשה נשלחה לאישור");
    },
    onError: (error) => {
      toast.error("שגיאה בשליחת הבקשה");
      console.error(error);
    },
  });

  // Make decision
  const makeDecisionMutation = useMutation({
    mutationFn: async ({ itemId, decision, comments }: { 
      itemId: string; 
      decision: 'approved' | 'rejected' | 'request_changes';
      comments?: string;
    }) => {
      // Get item details
      const { data: item } = await supabase
        .from("approval_items")
        .select("*")
        .eq("id", itemId)
        .single();
      
      if (!item) throw new Error("Item not found");

      // Add decision
      await supabase.from("approval_decisions").insert({
        approval_item_id: itemId,
        step_number: item.current_step,
        approver_id: user?.id,
        decision,
        comments,
      });

      // Update item status
      let newStatus = item.status;
      let newStep = item.current_step;

      if (decision === "approved") {
        if (item.current_step >= item.total_steps) {
          newStatus = "approved";
        } else {
          newStep = item.current_step + 1;
          newStatus = "in_review";
        }
      } else if (decision === "rejected") {
        newStatus = "rejected";
      } else if (decision === "request_changes") {
        newStatus = "pending";
      }

      const { error } = await supabase
        .from("approval_items")
        .update({ status: newStatus, current_step: newStep })
        .eq("id", itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-items"] });
      toast.success("ההחלטה נשמרה");
    },
    onError: (error) => {
      toast.error("שגיאה בשמירת ההחלטה");
      console.error(error);
    },
  });

  // Stats
  const stats = {
    pending: pendingItems.filter(i => i.status === "pending").length,
    inReview: pendingItems.filter(i => i.status === "in_review").length,
    approved: allItems.filter(i => i.status === "approved").length,
    rejected: allItems.filter(i => i.status === "rejected").length,
    urgent: pendingItems.filter(i => i.priority === "urgent").length,
  };

  return {
    pendingItems,
    allItems,
    workflows,
    stats,
    isLoading: isLoadingPending || isLoadingAll,
    submitForApproval: submitForApprovalMutation.mutate,
    makeDecision: makeDecisionMutation.mutate,
  };
}
