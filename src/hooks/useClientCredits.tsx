import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Constants for credit calculations
export const CREDITS_PER_HOUR = 60;
export const PRICE_PER_HOUR = 218;

export function calculateTaskCredits(durationMinutes: number): number {
  return Math.ceil((durationMinutes / 60) * CREDITS_PER_HOUR);
}

export function creditsToHours(credits: number): number {
  return credits / CREDITS_PER_HOUR;
}

export function creditsToCost(credits: number): number {
  return creditsToHours(credits) * PRICE_PER_HOUR;
}

interface ClientCredit {
  id: string;
  client_id: string;
  package_id: string | null;
  total_credits: number;
  used_credits: number;
  period_start: string;
  period_end: string;
  is_active: boolean;
  show_credits_to_client: boolean;
  notify_at_percentage: number;
  created_at: string;
  updated_at: string;
}

interface CreditTransaction {
  id: string;
  client_credit_id: string | null;
  client_id: string;
  task_id: string | null;
  credits_amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

interface TaskRequest {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  requested_by: string | null;
  estimated_credits: number;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  converted_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientCredits(clientId?: string) {
  const queryClient = useQueryClient();

  const { data: credits, isLoading: isLoadingCredits } = useQuery({
    queryKey: ["client-credits", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_credits")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as ClientCredit | null;
    },
    enabled: !!clientId,
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["credit-transactions", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!clientId,
  });

  const { data: taskRequests = [], isLoading: isLoadingRequests } = useQuery({
    queryKey: ["task-requests", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_requests")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as TaskRequest[];
    },
    enabled: !!clientId,
  });

  const { data: allCredits = [], isLoading: isLoadingAllCredits } = useQuery({
    queryKey: ["all-client-credits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_credits")
        .select("*, clients(id, name, logo_url)")
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: allTaskRequests = [] } = useQuery({
    queryKey: ["all-task-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_requests")
        .select("*, clients(id, name)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const addCreditsMutation = useMutation({
    mutationFn: async ({ clientId, credits, description }: { clientId: string; credits: number; description?: string }) => {
      // Get current credit record
      const { data: currentCredits } = await supabase
        .from("client_credits")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .maybeSingle();

      if (currentCredits) {
        // Update existing credits
        const { error: updateError } = await supabase
          .from("client_credits")
          .update({ total_credits: currentCredits.total_credits + credits })
          .eq("id", currentCredits.id);
        
        if (updateError) throw updateError;

        // Log transaction
        const { error: transactionError } = await supabase
          .from("credit_transactions")
          .insert({
            client_credit_id: currentCredits.id,
            client_id: clientId,
            credits_amount: credits,
            transaction_type: "purchase",
            description: description || `הוספת ${credits} קרדיטים`,
          });
        
        if (transactionError) throw transactionError;
      } else {
        // Create new credit record
        const { data: newCredits, error: insertError } = await supabase
          .from("client_credits")
          .insert({
            client_id: clientId,
            total_credits: credits,
            used_credits: 0,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;

        // Log transaction
        const { error: transactionError } = await supabase
          .from("credit_transactions")
          .insert({
            client_credit_id: newCredits.id,
            client_id: clientId,
            credits_amount: credits,
            transaction_type: "purchase",
            description: description || `הקצאת ${credits} קרדיטים`,
          });
        
        if (transactionError) throw transactionError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-credits"] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["all-client-credits"] });
      toast.success("הקרדיטים נוספו בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בהוספת קרדיטים");
      console.error(error);
    },
  });

  const deductCreditsMutation = useMutation({
    mutationFn: async ({ clientId, credits, taskId, description }: { clientId: string; credits: number; taskId?: string; description?: string }) => {
      const { data: currentCredits } = await supabase
        .from("client_credits")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .maybeSingle();

      if (!currentCredits) throw new Error("לא נמצא רשומת קרדיטים עבור לקוח זה");

      const { error: updateError } = await supabase
        .from("client_credits")
        .update({ used_credits: currentCredits.used_credits + credits })
        .eq("id", currentCredits.id);
      
      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          client_credit_id: currentCredits.id,
          client_id: clientId,
          task_id: taskId,
          credits_amount: -credits,
          transaction_type: "task_deduction",
          description: description || `ניכוי ${credits} קרדיטים עבור משימה`,
        });
      
      if (transactionError) throw transactionError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-credits"] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["all-client-credits"] });
    },
    onError: (error) => {
      toast.error("שגיאה בניכוי קרדיטים");
      console.error(error);
    },
  });

  const toggleCreditVisibilityMutation = useMutation({
    mutationFn: async ({ creditId, show }: { creditId: string; show: boolean }) => {
      const { error } = await supabase
        .from("client_credits")
        .update({ show_credits_to_client: show })
        .eq("id", creditId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-credits"] });
      queryClient.invalidateQueries({ queryKey: ["all-client-credits"] });
      toast.success("ההגדרה עודכנה");
    },
  });

  const submitTaskRequestMutation = useMutation({
    mutationFn: async ({ clientId, title, description, estimatedCredits }: { clientId: string; title: string; description?: string; estimatedCredits?: number }) => {
      const { error } = await supabase
        .from("task_requests")
        .insert({
          client_id: clientId,
          title,
          description,
          estimated_credits: estimatedCredits || 60,
          status: "pending",
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-task-requests"] });
      toast.success("בקשת המשימה נשלחה לאישור");
    },
    onError: (error) => {
      toast.error("שגיאה בשליחת הבקשה");
      console.error(error);
    },
  });

  const approveTaskRequestMutation = useMutation({
    mutationFn: async ({ requestId, approved, rejectionReason }: { requestId: string; approved: boolean; rejectionReason?: string }) => {
      const { error } = await supabase
        .from("task_requests")
        .update({
          status: approved ? "approved" : "rejected",
          approved_at: approved ? new Date().toISOString() : null,
          rejection_reason: rejectionReason,
        })
        .eq("id", requestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-task-requests"] });
      toast.success("הבקשה עודכנה");
    },
  });

  const remainingCredits = credits ? credits.total_credits - credits.used_credits : 0;
  const usagePercentage = credits ? (credits.used_credits / credits.total_credits) * 100 : 0;
  const isLowCredits = usagePercentage >= (credits?.notify_at_percentage || 80);

  return {
    credits,
    transactions,
    taskRequests,
    allCredits,
    allTaskRequests,
    remainingCredits,
    usagePercentage,
    isLowCredits,
    isLoading: isLoadingCredits || isLoadingTransactions || isLoadingRequests,
    isLoadingAllCredits,
    addCredits: addCreditsMutation.mutate,
    deductCredits: deductCreditsMutation.mutate,
    toggleCreditVisibility: toggleCreditVisibilityMutation.mutate,
    submitTaskRequest: submitTaskRequestMutation.mutate,
    approveTaskRequest: approveTaskRequestMutation.mutate,
  };
}
