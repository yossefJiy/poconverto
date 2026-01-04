import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { checkAIModulePermission, incrementAIUsage } from "../_shared/ai-permissions.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Models available - corrected model IDs for OpenRouter
const AI_MODELS: Record<string, {
  id: string;
  name: string;
  description: string;
  provider: 'lovable' | 'openrouter';
  category: 'general' | 'search' | 'coding' | 'creative' | 'reasoning';
}> = {
  // General Purpose - Lovable AI (always available)
  'gemini-flash': {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini Flash',
    description: 'מהיר וחסכוני - מצוין למשימות יומיומיות',
    provider: 'lovable',
    category: 'general',
  },
  'gemini-pro': {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini Pro',
    description: 'איכות גבוהה - מתאים לניתוח מורכב',
    provider: 'lovable',
    category: 'general',
  },
  
  // OpenRouter models - corrected IDs
  'claude-sonnet': {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude Sonnet',
    description: 'מצוין לכתיבה יצירתית ותוכן שיווקי',
    provider: 'openrouter',
    category: 'creative',
  },
  'gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'רב-תכליתי עם יכולות ויזואליות',
    provider: 'openrouter',
    category: 'general',
  },
  
  // Search & Research - Perplexity through OpenRouter
  'sonar': {
    id: 'perplexity/sonar',
    name: 'Perplexity Sonar',
    description: 'חיפוש AI מהיר עם מקורות מהאינטרנט',
    provider: 'openrouter',
    category: 'search',
  },
  'sonar-pro': {
    id: 'perplexity/sonar-pro',
    name: 'Perplexity Sonar Pro',
    description: 'חיפוש AI מתקדם עם מקורות מאומתים',
    provider: 'openrouter',
    category: 'search',
  },
  
  // Coding & Technical
  'deepseek-coder': {
    id: 'deepseek/deepseek-coder',
    name: 'DeepSeek Coder',
    description: 'מתמחה בקוד ופיתוח',
    provider: 'openrouter',
    category: 'coding',
  },
  
  // Fast & Cheap
  'llama-3': {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1',
    description: 'מודל פתוח מהיר וחסכוני',
    provider: 'openrouter',
    category: 'general',
  },
};

// Keywords that suggest which model to use
const modelSuggestions = {
  search: ['חפש', 'מצא', 'מה זה', 'מה הכי', 'טכנולוגי', 'חדש', 'עדכני', 'מחיר', 'עלות', 'מתחרים', 'השוואה', '2025', '2026', 'trends', 'מגמות'],
  coding: ['קוד', 'פייתון', 'javascript', 'api', 'אלגוריתם', 'פונקציה', 'באג', 'debug', 'תכנות'],
  creative: ['כתוב', 'נסח', 'תוכן', 'פוסט', 'מייל', 'קופי', 'סלוגן', 'קריאייטיב', 'שיווקי', 'פרסום'],
  analysis: ['נתח', 'ביצועים', 'metrics', 'kpi', 'roi', 'roas', 'המרות', 'דוח', 'סטטיסטיקה'],
};

function suggestModel(message: string, hasOpenRouter: boolean): string {
  const lowerMessage = message.toLowerCase();
  
  // If OpenRouter is available, use specialized models
  if (hasOpenRouter) {
    if (modelSuggestions.search.some(kw => lowerMessage.includes(kw))) {
      return 'sonar-pro';
    }
    if (modelSuggestions.coding.some(kw => lowerMessage.includes(kw))) {
      return 'deepseek-coder';
    }
    if (modelSuggestions.creative.some(kw => lowerMessage.includes(kw))) {
      return 'claude-sonnet';
    }
  }
  
  return 'gemini-flash'; // Default to Lovable AI
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { 
      messages, 
      userMessage, 
      context, 
      conversationId, 
      clientId, 
      userId,
      modelKey,  // User can specify model
      action     // 'list-models' to get available models
    } = await req.json();

    const hasOpenRouter = !!OPENROUTER_API_KEY;

    // Return available models list
    if (action === 'list-models') {
      const availableModels = Object.entries(AI_MODELS)
        .filter(([_, model]) => model.provider === 'lovable' || hasOpenRouter)
        .reduce((acc, [key, model]) => {
          acc[key] = {
            name: model.name,
            description: model.description,
            category: model.category,
            available: true,
          };
          return acc;
        }, {} as Record<string, any>);
      
      return new Response(JSON.stringify({ models: availableModels, hasOpenRouter }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check AI module permission for insights
    const permissionCheck = await checkAIModulePermission(clientId, 'insights', userId);
    if (!permissionCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: permissionCheck.reason || 'AI is not available for insights' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine which model to use
    let selectedModelKey = modelKey || suggestModel(userMessage, hasOpenRouter);
    let selectedModel = AI_MODELS[selectedModelKey];
    
    // Fallback if model not found or OpenRouter not available
    if (!selectedModel || (selectedModel.provider === 'openrouter' && !hasOpenRouter)) {
      selectedModelKey = 'gemini-flash';
      selectedModel = AI_MODELS['gemini-flash'];
    }

    console.log('Processing insights chat request...', { 
      hasOpenRouter,
      messageLength: userMessage?.length,
      conversationId,
      selectedModel: selectedModelKey,
      modelId: selectedModel.id,
      dailyUsageRemaining: permissionCheck.dailyUsageRemaining,
    });

    let apiEndpoint: string;
    let apiKey: string;
    let extraHeaders: Record<string, string> = {};

    if (selectedModel.provider === 'openrouter') {
      apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
      apiKey = OPENROUTER_API_KEY!;
      extraHeaders = {
        'HTTP-Referer': 'https://jiy.co.il',
        'X-Title': 'JIY Insights Agent',
      };
    } else {
      apiEndpoint = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      apiKey = LOVABLE_API_KEY;
    }

    const isSearchModel = selectedModel.category === 'search';
    
    const systemPrompt = `${context || ''}

אתה מומחה בתחומים הבאים:
1. **איקומרס**: Shopify, WooCommerce, אופטימיזציה של משפכי מכירה, AOV, LTV, רייט אבנדונמנט
2. **לידים**: פייסבוק לידים, גוגל לידים, דפי נחיתה, CRM, אוטומציות
3. **פרסום דיגיטלי**: Google Ads, Facebook/Meta Ads, TikTok Ads, פיקסלים, Conversion API
4. **אנליטיקס**: GA4, Server-side tracking, Attribution, מודלי attribution
5. **טכנולוגיות חדשות**: AI Marketing, CDP (Customer Data Platforms), Personalization
6. **אוטומציות**: Zapier, Make, n8n, Klaviyo, ActiveCampaign

טכנולוגיות ושירותים שכדאי להכיר ב-2026:
- **AI Tools**: Claude AI לתוכן, Midjourney/DALL-E לקריאייטיב, Jasper, Copy.ai
- **Attribution**: Triple Whale, Northbeam, Rockerbox, Wicked Reports
- **CDP**: Segment, RudderStack, mParticle
- **Email/SMS**: Klaviyo, Attentive, Postscript
- **Reviews & UGC**: Yotpo, Stamped, Loox
- **Landing Pages**: Unbounce, Instapage, Replo
- **CRO Tools**: Hotjar, Lucky Orange, VWO, Optimizely
- **Analytics**: Mixpanel, Amplitude, PostHog
- **AI Personalization**: Dynamic Yield, Nosto, Bloomreach

כשמציע טכנולוגיות:
- ציין יתרונות וחסרונות
- תן הערכת תקציב אם רלוונטי
- הצע אלטרנטיבות
- ציין אינטגרציות רלוונטיות

${isSearchModel ? `
**חיפוש אינטרנט פעיל** - יש לך גישה למידע עדכני מהאינטרנט.
כשמספק מידע מחיפוש:
- ציין שהמידע מבוסס על חיפוש עדכני
- הוסף קישורים למקורות אם זמינים
` : ''}

אתה משתמש במודל: ${selectedModel.name}`;

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
      { role: "user", content: userMessage },
    ];

    console.log('Calling API:', apiEndpoint, 'with model:', selectedModel.id);

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify({
        model: selectedModel.id,
        messages: allMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // If OpenRouter fails, fallback to Lovable AI
      if (selectedModel.provider === 'openrouter') {
        console.log('OpenRouter failed, falling back to Lovable AI');
        const fallbackResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: allMessages,
            stream: true,
          }),
        });
        
        if (fallbackResponse.ok) {
          selectedModelKey = 'gemini-flash';
          selectedModel = AI_MODELS['gemini-flash'];
          
          // Save user message
          if (conversationId && userId && supabase) {
            try {
              await supabase.from('chat_messages').insert({
                conversation_id: conversationId,
                role: 'user',
                content: userMessage,
                metadata: { model: selectedModelKey, fallback: true }
              });
            } catch (saveError) {
              console.error('Error saving user message:', saveError);
            }
          }
          
          let fullResponse = '';
          const transformStream = new TransformStream({
            transform(chunk, controller) {
              controller.enqueue(chunk);
              const text = new TextDecoder().decode(chunk);
              const lines = text.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                  try {
                    const json = JSON.parse(line.slice(6));
                    const content = json.choices?.[0]?.delta?.content;
                    if (content) fullResponse += content;
                  } catch {}
                }
              }
            },
            async flush() {
              if (conversationId && userId && supabase && fullResponse) {
                try {
                  await supabase.from('chat_messages').insert({
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: fullResponse,
                    metadata: { model: selectedModelKey, modelName: selectedModel.name, fallback: true }
                  });
                } catch (saveError) {
                  console.error('Error saving assistant message:', saveError);
                }
              }
            }
          });
          
          return new Response(fallbackResponse.body?.pipeThrough(transformStream), {
            headers: { 
              ...corsHeaders, 
              "Content-Type": "text/event-stream",
              "X-Model-Used": selectedModelKey,
              "X-Model-Name": selectedModel.name,
              "X-Is-Search": "false",
              "X-Fallback": "true",
            },
          });
        }
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Save user message
    if (conversationId && userId && supabase) {
      try {
        await supabase.from('chat_messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: userMessage,
          metadata: { model: selectedModelKey, isSearchModel }
        });
      } catch (saveError) {
        console.error('Error saving user message:', saveError);
      }
    }

    // Track AI usage
    const inputTokens = Math.ceil((systemPrompt.length + userMessage.length) / 4);
    let outputTokens = 0;

    // Create a transform stream to capture the full response
    let fullResponse = '';
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) fullResponse += content;
            } catch {}
          }
        }
      },
      async flush() {
        outputTokens = Math.ceil(fullResponse.length / 4);
        
        // Save assistant message
        if (conversationId && userId && supabase && fullResponse) {
          try {
            await supabase.from('chat_messages').insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: fullResponse,
              metadata: { model: selectedModelKey, modelName: selectedModel.name, isSearchModel }
            });
          } catch (saveError) {
            console.error('Error saving assistant message:', saveError);
          }
        }

        // Track AI usage in ai_query_history
        try {
          // Increment daily usage counter
          if (userId) {
            await incrementAIUsage(userId, 'insights');
          }

          const costs: Record<string, { input: number; output: number }> = {
            'google/gemini-2.5-flash': { input: 0.00005, output: 0.00015 },
            'google/gemini-2.5-pro': { input: 0.0007, output: 0.0021 },
            'anthropic/claude-3.5-sonnet': { input: 0.003, output: 0.015 },
            'openai/gpt-4o': { input: 0.0025, output: 0.01 },
            'perplexity/sonar-pro': { input: 0.003, output: 0.015 },
          };
          const modelCosts = costs[selectedModel.id] || { input: 0.0001, output: 0.0003 };
          const estimatedCost = ((inputTokens / 1000) * modelCosts.input) + ((outputTokens / 1000) * modelCosts.output);

          await supabase.from('ai_query_history').insert({
            action: 'insights_chat',
            model: selectedModel.id,
            provider: selectedModel.provider,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            estimated_cost: estimatedCost,
            prompt_summary: userMessage.slice(0, 500),
            response: fullResponse.slice(0, 2000),
            client_id: clientId || null,
            created_by: userId || null,
          });
          console.log('AI usage tracked:', { model: selectedModel.id, inputTokens, outputTokens, estimatedCost });
        } catch (trackError) {
          console.error('Error tracking AI usage:', trackError);
        }
      }
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "X-Model-Used": selectedModelKey,
        "X-Model-Name": selectedModel.name,
        "X-Is-Search": isSearchModel ? "true" : "false",
      },
    });

  } catch (error) {
    console.error('Error in insights-chat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
