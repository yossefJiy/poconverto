// AI domain types

import { BaseEntity } from '../common';

export interface AIAgent extends BaseEntity {
  client_id: string | null;
  name: string;
  description: string | null;
  agent_type: AgentType;
  capabilities: AICapability[];
  is_active: boolean;
  settings: AgentSettings | null;
}

export type AgentType = 'general' | 'analytics' | 'content' | 'campaign' | 'support' | 'client_specific';

export type AICapability = 
  | 'analytics'
  | 'insights'
  | 'tasks'
  | 'campaigns'
  | 'reports'
  | 'content_generation'
  | 'competitor_analysis'
  | 'budget_optimization';

export interface AgentSettings {
  modules_enabled?: Record<string, boolean>;
  reputation_score?: number;
  total_interactions?: number;
  default_model?: string;
  max_tokens?: number;
}

export interface AIAction extends BaseEntity {
  agent_id: string | null;
  client_id: string | null;
  action_type: string;
  action_data: Record<string, unknown> | null;
  status: AIActionStatus;
  result: Record<string, unknown> | null;
  approved_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
}

export type AIActionStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';

export interface AIQueryHistory extends BaseEntity {
  client_id: string | null;
  action: string;
  model: string;
  provider: string | null;
  prompt_summary: string | null;
  response: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  estimated_cost: number | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface ChatConversation extends BaseEntity {
  user_id: string;
  client_id: string | null;
  agent_type: AgentType;
  title: string | null;
  messages?: ChatMessage[];
}
