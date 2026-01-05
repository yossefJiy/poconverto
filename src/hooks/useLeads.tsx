import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  source: string | null;
  status: string;
  priority: string;
  pipeline_stage: string;
  tags: string[] | null;
  lead_score: number;
  conversion_value: number | null;
  assigned_agent_id: string | null;
  assigned_user_id: string | null;
  client_id: string | null;
  last_contact_at: string | null;
  next_followup_at: string | null;
  won_at: string | null;
  lost_reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LeadConversation {
  id: string;
  lead_id: string;
  channel: string;
  external_id: string | null;
  status: string;
  last_message_at: string | null;
  unread_count: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface LeadMessage {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  sender_type: 'lead' | 'user' | 'agent' | 'system';
  sender_id: string | null;
  content: string;
  content_type: string;
  media_url: string | null;
  status: string;
  created_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: string;
  description: string | null;
  old_value: string | null;
  new_value: string | null;
  created_by: string | null;
  created_at: string;
}

export function useLeads(clientId?: string) {
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", clientId],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: pipelineStats } = useQuery({
    queryKey: ["lead-pipeline-stats", clientId],
    queryFn: async () => {
      const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
      const stats: Record<string, number> = {};
      
      for (const stage of stages) {
        let query = supabase
          .from("leads")
          .select("id", { count: 'exact', head: true })
          .eq("pipeline_stage", stage);
        
        if (clientId) {
          query = query.eq("client_id", clientId);
        }
        
        const { count } = await query;
        stats[stage] = count || 0;
      }
      
      return stats;
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          name: lead.name || "ליד חדש",
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          message: lead.message,
          source: lead.source || "manual",
          status: lead.status || "new",
          priority: lead.priority || "medium",
          pipeline_stage: lead.pipeline_stage || "new",
          tags: lead.tags,
          client_id: lead.client_id,
          assigned_user_id: lead.assigned_user_id,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Log activity
      await supabase.from("lead_activities").insert({
        lead_id: data.id,
        activity_type: "created",
        description: "ליד נוצר",
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-pipeline-stats"] });
      toast.success("ליד נוצר בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת ליד");
      console.error(error);
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-pipeline-stats"] });
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון ליד");
      console.error(error);
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage, reason }: { id: string; stage: string; reason?: string }) => {
      const updates: Partial<Lead> = { pipeline_stage: stage };
      
      if (stage === "won") {
        updates.won_at = new Date().toISOString();
        updates.status = "converted";
      } else if (stage === "lost") {
        updates.lost_reason = reason;
        updates.status = "lost";
      }

      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;

      // Log activity
      await supabase.from("lead_activities").insert({
        lead_id: id,
        activity_type: "stage_changed",
        description: `שלב שונה ל-${stage}`,
        new_value: stage,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-pipeline-stats"] });
      toast.success("שלב עודכן");
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead-pipeline-stats"] });
      toast.success("ליד נמחק");
    },
  });

  return {
    leads,
    pipelineStats,
    isLoading,
    createLead: createLeadMutation.mutate,
    updateLead: updateLeadMutation.mutate,
    updateStage: updateStageMutation.mutate,
    deleteLead: deleteLeadMutation.mutate,
  };
}

export function useLeadConversations(leadId?: string) {
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["lead-conversations", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_conversations")
        .select("*")
        .eq("lead_id", leadId)
        .order("last_message_at", { ascending: false });
      
      if (error) throw error;
      return data as LeadConversation[];
    },
    enabled: !!leadId,
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["lead-messages", leadId],
    queryFn: async () => {
      if (!conversations.length) return [];
      
      const conversationIds = conversations.map(c => c.id);
      const { data, error } = await supabase
        .from("lead_messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data as LeadMessage[];
    },
    enabled: conversations.length > 0,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content, contentType = "text" }: { 
      conversationId: string; 
      content: string; 
      contentType?: string;
    }) => {
      const { data, error } = await supabase
        .from("lead_messages")
        .insert({
          conversation_id: conversationId,
          direction: "outbound",
          sender_type: "user",
          content,
          content_type: contentType,
          status: "sent",
        })
        .select()
        .single();
      
      if (error) throw error;

      // Update conversation
      await supabase
        .from("lead_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-messages"] });
      queryClient.invalidateQueries({ queryKey: ["lead-conversations"] });
    },
  });

  return {
    conversations,
    messages,
    isLoading: isLoading || isLoadingMessages,
    sendMessage: sendMessageMutation.mutate,
  };
}

export function useLeadActivities(leadId?: string) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["lead-activities", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LeadActivity[];
    },
    enabled: !!leadId,
  });

  return { activities, isLoading };
}
