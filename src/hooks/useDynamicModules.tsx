import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface DynamicModule {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  category: 'content' | 'code' | 'analysis' | 'planning';
  ai_model: string;
  ai_provider: 'lovable' | 'openrouter';
  system_prompt: string | null;
  is_active: boolean;
  sort_order: number;
  allowed_roles: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DynamicModuleTemplate {
  id: string;
  module_id: string;
  name: string;
  description: string | null;
  template_type: string;
  parts: { title: string; prompt: string }[];
  system_prompt: string | null;
  background_context: string | null;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface DynamicModuleSession {
  id: string;
  module_id: string;
  template_id: string | null;
  user_id: string;
  client_id: string | null;
  contact_id: string | null;
  title: string | null;
  status: 'active' | 'completed' | 'archived';
  metadata: Record<string, unknown>;
  total_tokens: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export interface DynamicModuleMessage {
  id: string;
  session_id: string;
  part_number: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  key_points: string[] | null;
  input_tokens: number;
  output_tokens: number;
  tokens_used: number;
  estimated_cost: number;
  task_category: string | null;
  task_type: string | null;
  ai_classified_type: string | null;
  user_corrected_type: string | null;
  task_complexity: 'simple' | 'medium' | 'complex' | null;
  response_time_ms: number | null;
  was_successful: boolean;
  error_message: string | null;
  user_rating: number | null;
  rating_feedback: string | null;
  created_at: string;
}

export interface CreateModuleInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  category: 'content' | 'code' | 'analysis' | 'planning';
  ai_model?: string;
  ai_provider?: 'lovable' | 'openrouter';
  system_prompt?: string;
  allowed_roles?: string[];
}

// Hook for fetching all active modules
export function useDynamicModules() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dynamic-modules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dynamic_modules')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as DynamicModule[];
    },
    enabled: !!user
  });
}

// Hook for fetching a single module by slug
export function useDynamicModule(slug: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dynamic-module', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dynamic_modules')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data as DynamicModule;
    },
    enabled: !!slug && !!user
  });
}

// Hook for fetching templates for a module
export function useModuleTemplates(moduleId: string | undefined) {
  return useQuery({
    queryKey: ['dynamic-module-templates', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dynamic_module_templates')
        .select('*')
        .eq('module_id', moduleId!)
        .order('sort_order');
      
      if (error) throw error;
      return data as DynamicModuleTemplate[];
    },
    enabled: !!moduleId
  });
}

// Hook for fetching sessions for a module
export function useModuleSessions(moduleId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dynamic-module-sessions', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dynamic_module_sessions')
        .select('*')
        .eq('module_id', moduleId!)
        .eq('user_id', user?.id)
        .neq('status', 'archived')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as DynamicModuleSession[];
    },
    enabled: !!moduleId && !!user
  });
}

// Hook for fetching messages for a session
export function useSessionMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['dynamic-module-messages', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dynamic_module_messages')
        .select('*')
        .eq('session_id', sessionId!)
        .order('created_at');
      
      if (error) throw error;
      return data as DynamicModuleMessage[];
    },
    enabled: !!sessionId
  });
}

// Hook for module mutations
export function useDynamicModuleMutations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create module
  const createModule = useMutation({
    mutationFn: async (input: CreateModuleInput) => {
      const { data, error } = await supabase
        .from('dynamic_modules')
        .insert({
          ...input,
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as DynamicModule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-modules'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-dynamic-items'] });
      toast({ title: 'מודול נוצר בהצלחה' });
    },
    onError: (error: Error) => {
      toast({ title: 'שגיאה ביצירת מודול', description: error.message, variant: 'destructive' });
    }
  });

  // Update module
  const updateModule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DynamicModule> & { id: string }) => {
      const { data, error } = await supabase
        .from('dynamic_modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as DynamicModule;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-modules'] });
      queryClient.invalidateQueries({ queryKey: ['dynamic-module', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-dynamic-items'] });
      toast({ title: 'מודול עודכן בהצלחה' });
    }
  });

  // Delete module
  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dynamic_modules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-modules'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-dynamic-items'] });
      toast({ title: 'מודול נמחק בהצלחה' });
    }
  });

  // Send message to module
  const sendMessage = useMutation({
    mutationFn: async ({
      moduleSlug,
      sessionId,
      templateId,
      clientId,
      contactId,
      prompt,
      partNumber = 0,
      systemPrompt,
      backgroundContext,
      previousMessages = []
    }: {
      moduleSlug: string;
      sessionId?: string;
      templateId?: string;
      clientId?: string;
      contactId?: string;
      prompt: string;
      partNumber?: number;
      systemPrompt?: string;
      backgroundContext?: string;
      previousMessages?: { role: string; content: string }[];
    }) => {
      const { data, error } = await supabase.functions.invoke('dynamic-dialogue', {
        body: {
          moduleSlug,
          sessionId,
          templateId,
          clientId,
          contactId,
          userId: user?.id,
          prompt,
          partNumber,
          systemPrompt,
          backgroundContext,
          previousMessages
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.sessionId) {
        queryClient.invalidateQueries({ queryKey: ['dynamic-module-messages', data.sessionId] });
        queryClient.invalidateQueries({ queryKey: ['dynamic-module-sessions'] });
      }
    }
  });

  // Rate message
  const rateMessage = useMutation({
    mutationFn: async ({ messageId, rating, feedback }: { messageId: string; rating: number; feedback?: string }) => {
      const { error } = await supabase
        .from('dynamic_module_messages')
        .update({
          user_rating: rating,
          rating_feedback: feedback || null
        })
        .eq('id', messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'תודה על הדירוג!' });
    }
  });

  // Correct task type
  const correctTaskType = useMutation({
    mutationFn: async ({ messageId, correctedType }: { messageId: string; correctedType: string }) => {
      const { error } = await supabase
        .from('dynamic_module_messages')
        .update({ user_corrected_type: correctedType })
        .eq('id', messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'סיווג עודכן' });
    }
  });

  return {
    createModule,
    updateModule,
    deleteModule,
    sendMessage,
    rateMessage,
    correctTaskType
  };
}

// Hook for sidebar dynamic items
export function useSidebarDynamicItems() {
  return useQuery({
    queryKey: ['sidebar-dynamic-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sidebar_dynamic_items')
        .select('*, module:dynamic_modules(*)')
        .eq('is_visible', true)
        .order('sort_order');
      
      if (error) throw error;
      return data;
    }
  });
}

// Hook for task type definitions
export function useTaskTypeDefinitions() {
  return useQuery({
    queryKey: ['task-type-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_type_definitions')
        .select('*')
        .eq('is_active', true)
        .order('category');
      
      if (error) throw error;
      return data;
    }
  });
}
