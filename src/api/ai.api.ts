// AI API

import { BaseAPI } from './base';
import { supabase } from '@/integrations/supabase/client';

export interface AIAgentRow {
  id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  agent_type: string;
  capabilities: string[] | null;
  is_active: boolean | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface AIActionRow {
  id: string;
  agent_id: string | null;
  client_id: string | null;
  action_type: string;
  action_data: Record<string, unknown> | null;
  status: string;
  result: Record<string, unknown> | null;
  approved_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
  created_at: string;
}

export interface ChatConversationRow {
  id: string;
  user_id: string;
  client_id: string | null;
  agent_type: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export class AIAPI extends BaseAPI {
  async getAgents(clientId?: string) {
    return this.request<AIAgentRow[]>(async () => {
      let query = this.client
        .from('ai_agents')
        .select('*')
        .eq('is_active', true);
      
      if (clientId) {
        query = query.or(`client_id.eq.${clientId},client_id.is.null`);
      }
      
      return query.order('name');
    });
  }

  async getAgentById(id: string) {
    return this.request<AIAgentRow>(async () => {
      return this.client
        .from('ai_agents')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  async getPendingActions(clientId?: string) {
    return this.request<AIActionRow[]>(async () => {
      let query = this.client
        .from('ai_agent_actions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      return query;
    });
  }

  async approveAction(id: string, userId: string) {
    return this.request<AIActionRow>(async () => {
      return this.client
        .from('ai_agent_actions')
        .update({
          status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
    });
  }

  async rejectAction(id: string) {
    return this.request<AIActionRow>(async () => {
      return this.client
        .from('ai_agent_actions')
        .update({ status: 'rejected' })
        .eq('id', id)
        .select()
        .single();
    });
  }

  async getConversations(userId: string, clientId?: string) {
    return this.request<ChatConversationRow[]>(async () => {
      let query = this.client
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      return query;
    });
  }

  async invokeAgent(functionName: string, payload: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });
    
    if (error) {
      return { data: null, error: error.message, success: false };
    }
    
    return { data, error: null, success: true };
  }
}

export const aiAPI = new AIAPI();
