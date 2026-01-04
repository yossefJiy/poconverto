import { supabase } from "@/integrations/supabase/client";

interface AIUsageParams {
  action: string;
  model: string;
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
  promptSummary?: string;
  response?: string;
  issueId?: string;
  issueTitle?: string;
  clientId?: string | null;
  userId?: string | null;
  citations?: any[];
  executedActions?: Record<string, any>;
}

// Estimated costs per 1K tokens (approximate)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  // Lovable AI
  'google/gemini-2.5-flash': { input: 0.00005, output: 0.00015 },
  'google/gemini-2.5-flash-lite': { input: 0.00003, output: 0.0001 },
  'google/gemini-2.5-pro': { input: 0.0007, output: 0.0021 },
  'google/gemini-3-pro-preview': { input: 0.001, output: 0.003 },
  'openai/gpt-5': { input: 0.005, output: 0.015 },
  'openai/gpt-5-mini': { input: 0.0003, output: 0.0012 },
  'openai/gpt-5-nano': { input: 0.0001, output: 0.0004 },
  // OpenRouter
  'anthropic/claude-3.5-sonnet': { input: 0.003, output: 0.015 },
  'openai/gpt-4o': { input: 0.0025, output: 0.01 },
  'perplexity/sonar': { input: 0.001, output: 0.001 },
  'perplexity/sonar-pro': { input: 0.003, output: 0.015 },
  'deepseek/deepseek-coder': { input: 0.00014, output: 0.00028 },
  'meta-llama/llama-3.1-70b-instruct': { input: 0.0005, output: 0.0005 },
};

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for mixed Hebrew/English
  return Math.ceil(text.length / 4);
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = MODEL_COSTS[model] || { input: 0.0001, output: 0.0003 };
  return ((inputTokens / 1000) * costs.input) + ((outputTokens / 1000) * costs.output);
}

export async function trackAIUsage(params: AIUsageParams): Promise<void> {
  try {
    const inputTokens = params.inputTokens || estimateTokens(params.promptSummary || '');
    const outputTokens = params.outputTokens || estimateTokens(params.response || '');
    const estimatedCost = params.estimatedCost || calculateCost(params.model, inputTokens, outputTokens);

    const { error } = await supabase.from('ai_query_history').insert({
      action: params.action,
      model: params.model,
      provider: params.provider || (params.model.startsWith('google/') || params.model.startsWith('openai/gpt-5') ? 'lovable' : 'openrouter'),
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost: estimatedCost,
      prompt_summary: params.promptSummary?.slice(0, 500),
      response: params.response?.slice(0, 2000),
      issue_id: params.issueId,
      issue_title: params.issueTitle?.slice(0, 200),
      client_id: params.clientId,
      created_by: params.userId,
      citations: params.citations || [],
      executed_actions: params.executedActions || {},
    });

    if (error) {
      console.error('Error tracking AI usage:', error);
    }
  } catch (err) {
    console.error('Error in trackAIUsage:', err);
  }
}

// Hook version for components
export function useAIUsageTracking() {
  const track = async (params: AIUsageParams) => {
    await trackAIUsage(params);
  };

  return { trackAIUsage: track };
}
