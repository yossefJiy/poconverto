import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

// Model pricing (per 1M tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'google/gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'google/gemini-2.5-flash-lite': { input: 0.02, output: 0.08 },
  'google/gemini-2.5-pro': { input: 1.25, output: 5.00 },
  'google/gemini-3-pro-preview': { input: 1.25, output: 5.00 },
  'openai/gpt-5': { input: 2.50, output: 10.00 },
  'openai/gpt-5-mini': { input: 0.15, output: 0.60 },
  'openai/gpt-5-nano': { input: 0.10, output: 0.40 },
};

interface TaskTypeDefinition {
  category: string;
  type_key: string;
  type_label_he: string;
  keywords: string[];
}

interface ClassificationResult {
  category: string;
  taskType: string;
  aiClassifiedType: string | null;
  complexity: 'simple' | 'medium' | 'complex';
}

// Smart task classification - 3 layers
async function classifyTask(
  prompt: string,
  moduleCategory: string,
  templateType: string | null,
  taskTypes: TaskTypeDefinition[],
  aiModel: string
): Promise<ClassificationResult> {
  // Layer 1: Category from module (always set)
  const category = moduleCategory;
  
  // Layer 2: Type from template (if selected)
  let taskType = templateType || '';
  let aiClassifiedType: string | null = null;
  
  // Layer 3: AI classification if no template type
  if (!taskType) {
    // Filter relevant types by category
    const relevantTypes = taskTypes.filter(t => t.category === category);
    
    // Try keyword matching first
    const promptLower = prompt.toLowerCase();
    for (const type of relevantTypes) {
      if (type.keywords?.some(keyword => promptLower.includes(keyword.toLowerCase()))) {
        taskType = type.type_key;
        aiClassifiedType = type.type_key;
        break;
      }
    }
    
    // If still not found - use AI for classification
    if (!taskType && relevantTypes.length > 0) {
      try {
        const typeOptions = relevantTypes.map(t => `${t.type_key}: ${t.type_label_he}`).join('\n');
        const classifyResponse = await fetch(LOVABLE_AI_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite', // Fast & cheap for classification
            messages: [
              {
                role: 'system',
                content: `You are a task classifier. Given a prompt, classify it into one of these types. Reply with ONLY the type_key, nothing else:\n\n${typeOptions}`
              },
              { role: 'user', content: prompt.substring(0, 500) }
            ],
            max_tokens: 50,
            temperature: 0
          })
        });
        
        if (classifyResponse.ok) {
          const classifyData = await classifyResponse.json();
          const classified = classifyData.choices?.[0]?.message?.content?.trim().toLowerCase();
          if (relevantTypes.some(t => t.type_key === classified)) {
            taskType = classified;
            aiClassifiedType = classified;
          }
        }
      } catch (e) {
        console.error('AI classification error:', e);
      }
    }
    
    // Fallback to first type in category
    if (!taskType && relevantTypes.length > 0) {
      taskType = relevantTypes[0].type_key;
      aiClassifiedType = relevantTypes[0].type_key;
    }
  }
  
  // Estimate complexity based on prompt length and content
  const complexity = estimateComplexity(prompt);
  
  return { category, taskType, aiClassifiedType, complexity };
}

function estimateComplexity(prompt: string): 'simple' | 'medium' | 'complex' {
  const length = prompt.length;
  const hasCode = /```|function|const|class|import/.test(prompt);
  const hasMultipleTasks = (prompt.match(/\d+\.|•|-\s+/g) || []).length > 3;
  const complexWords = ['architecture', 'ארכיטקטורה', 'integration', 'אינטגרציה', 'migration', 'מיגרציה'].filter(w => prompt.toLowerCase().includes(w));
  
  if (length > 1000 || hasCode || hasMultipleTasks || complexWords.length > 0) {
    return 'complex';
  }
  if (length > 300) {
    return 'medium';
  }
  return 'simple';
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || { input: 0.1, output: 0.4 };
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      moduleSlug,
      sessionId,
      templateId,
      clientId,
      contactId,
      userId,
      prompt,
      partNumber = 0,
      // Optional context
      systemPrompt,
      backgroundContext,
      previousMessages = [],
    } = await req.json();

    if (!moduleSlug || !prompt) {
      throw new Error('moduleSlug and prompt are required');
    }

    console.log(`Dynamic dialogue for module: ${moduleSlug}, session: ${sessionId}`);

    // Fetch module configuration
    const { data: module, error: moduleError } = await supabase
      .from('dynamic_modules')
      .select('*')
      .eq('slug', moduleSlug)
      .eq('is_active', true)
      .single();

    if (moduleError || !module) {
      throw new Error(`Module not found: ${moduleSlug}`);
    }

    // Fetch template if provided
    let template = null;
    if (templateId) {
      const { data } = await supabase
        .from('dynamic_module_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      template = data;
    }

    // Fetch task type definitions
    const { data: taskTypes } = await supabase
      .from('task_type_definitions')
      .select('*')
      .eq('is_active', true);

    // Classify the task
    const classification = await classifyTask(
      prompt,
      module.category,
      template?.template_type || null,
      taskTypes || [],
      module.ai_model
    );

    // Build messages array
    const messages: { role: string; content: string }[] = [];

    // System prompt
    const finalSystemPrompt = systemPrompt || template?.system_prompt || module.system_prompt || 
      `You are a helpful AI assistant for ${module.name}. Respond in Hebrew unless the user writes in English.`;
    messages.push({ role: 'system', content: finalSystemPrompt });

    // Background context
    const finalBackground = backgroundContext || template?.background_context;
    if (finalBackground) {
      messages.push({
        role: 'user',
        content: `Context: ${finalBackground}`
      });
      messages.push({
        role: 'assistant',
        content: 'Understood. I have the context. How can I help?'
      });
    }

    // Previous messages (last 4)
    if (previousMessages.length > 0) {
      const lastMessages = previousMessages.slice(-4);
      for (const msg of lastMessages) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Current prompt
    messages.push({ role: 'user', content: prompt });

    console.log(`Using model: ${module.ai_model}, messages: ${messages.length}`);

    // Call AI
    const aiResponse = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: module.ai_model,
        messages,
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content || 'No response received';
    const inputTokens = aiData.usage?.prompt_tokens || 0;
    const outputTokens = aiData.usage?.completion_tokens || 0;
    const tokensUsed = aiData.usage?.total_tokens || 0;
    const responseTimeMs = Date.now() - startTime;
    const estimatedCost = calculateCost(module.ai_model, inputTokens, outputTokens);

    // Extract key points
    const keyPoints: string[] = [];
    const lines = answer.split('\n');
    for (const line of lines) {
      if (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./)) {
        const point = line.replace(/^[-•\d.]+\s*/, '').trim();
        if (point.length > 10 && keyPoints.length < 5) {
          keyPoints.push(point);
        }
      }
    }

    // Create or update session
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('dynamic_module_sessions')
        .insert({
          module_id: module.id,
          template_id: templateId || null,
          user_id: userId,
          client_id: clientId || null,
          contact_id: contactId || null,
          title: prompt.substring(0, 100),
          status: 'active'
        })
        .select('id')
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
      } else {
        activeSessionId = newSession?.id;
      }
    }

    // Save user message
    if (activeSessionId) {
      await supabase.from('dynamic_module_messages').insert({
        session_id: activeSessionId,
        part_number: partNumber,
        role: 'user',
        content: prompt,
        task_category: classification.category,
        task_type: classification.taskType,
        task_complexity: classification.complexity
      });

      // Save assistant message with all metrics
      await supabase.from('dynamic_module_messages').insert({
        session_id: activeSessionId,
        part_number: partNumber,
        role: 'assistant',
        content: answer,
        key_points: keyPoints,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        tokens_used: tokensUsed,
        estimated_cost: estimatedCost,
        task_category: classification.category,
        task_type: classification.taskType,
        ai_classified_type: classification.aiClassifiedType,
        task_complexity: classification.complexity,
        response_time_ms: responseTimeMs,
        was_successful: true
      });
    }

    return new Response(
      JSON.stringify({
        answer,
        keyPoints,
        sessionId: activeSessionId,
        tokensUsed,
        inputTokens,
        outputTokens,
        estimatedCost,
        responseTimeMs,
        classification: {
          category: classification.category,
          taskType: classification.taskType,
          aiClassifiedType: classification.aiClassifiedType,
          complexity: classification.complexity
        },
        module: {
          id: module.id,
          name: module.name,
          aiModel: module.ai_model
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const responseTimeMs = Date.now() - startTime;
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: message,
        responseTimeMs,
        was_successful: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
