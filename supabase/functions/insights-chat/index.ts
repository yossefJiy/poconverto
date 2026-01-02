import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Models available through OpenRouter
const AI_MODELS = {
  // General Purpose
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
  'claude-sonnet': {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet',
    description: 'מצוין לכתיבה יצירתית ותוכן שיווקי',
    provider: 'openrouter',
    category: 'general',
  },
  'gpt-4o': {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'רב-תכליתי עם יכולות ויזואליות',
    provider: 'openrouter',
    category: 'general',
  },
  
  // Search & Research
  'sonar-pro': {
    id: 'perplexity/sonar-pro',
    name: 'Perplexity Sonar Pro',
    description: 'חיפוש AI עם מקורות מאומתים - מושלם למחקר',
    provider: 'openrouter',
    category: 'search',
  },
  'sonar-reasoning': {
    id: 'perplexity/sonar-reasoning-pro',
    name: 'Perplexity Reasoning',
    description: 'חשיבה מעמיקה עם חיפוש - לניתוח מורכב',
    provider: 'openrouter',
    category: 'search',
  },
  'sonar-deep': {
    id: 'perplexity/sonar-deep-research',
    name: 'Perplexity Deep Research',
    description: 'מחקר מעמיק עם מקורות מרובים',
    provider: 'openrouter',
    category: 'search',
  },
  
  // Coding & Technical
  'deepseek-coder': {
    id: 'deepseek/deepseek-coder-v2',
    name: 'DeepSeek Coder',
    description: 'מתמחה בקוד ופיתוח',
    provider: 'openrouter',
    category: 'coding',
  },
  
  // Reasoning
  'o1-preview': {
    id: 'openai/o1-preview',
    name: 'OpenAI O1',
    description: 'חשיבה עמוקה - לבעיות מורכבות',
    provider: 'openrouter',
    category: 'reasoning',
  },
};

// Keywords that suggest which model to use
const modelSuggestions = {
  search: ['חפש', 'מצא', 'מה זה', 'מה הכי', 'טכנולוגי', 'חדש', 'עדכני', 'מחיר', 'עלות', 'מתחרים', 'השוואה', '2025', '2026', 'trends'],
  coding: ['קוד', 'פייתון', 'javascript', 'api', 'אלגוריתם', 'פונקציה', 'באג', 'debug'],
  creative: ['כתוב', 'נסח', 'תוכן', 'פוסט', 'מייל', 'קופי', 'סלוגן', 'קריאייטיב'],
  analysis: ['נתח', 'ביצועים', 'metrics', 'kpi', 'roi', 'roas', 'המרות', 'דוח'],
};

function suggestModel(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (modelSuggestions.search.some(kw => lowerMessage.includes(kw))) {
    return 'sonar-pro';
  }
  if (modelSuggestions.coding.some(kw => lowerMessage.includes(kw))) {
    return 'deepseek-coder';
  }
  if (modelSuggestions.creative.some(kw => lowerMessage.includes(kw))) {
    return 'claude-sonnet';
  }
  
  return 'gemini-flash'; // Default
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

    // Return available models list
    if (action === 'list-models') {
      const hasOpenRouter = !!OPENROUTER_API_KEY;
      const availableModels = Object.entries(AI_MODELS)
        .filter(([_, model]) => model.provider === 'lovable' || hasOpenRouter)
        .reduce((acc, [key, model]) => {
          acc[key] = {
            name: model.name,
            description: model.description,
            category: model.category,
            available: model.provider === 'lovable' || hasOpenRouter,
          };
          return acc;
        }, {} as Record<string, any>);
      
      return new Response(JSON.stringify({ models: availableModels }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Determine which model to use
    let selectedModelKey = modelKey || suggestModel(userMessage);
    let selectedModel = AI_MODELS[selectedModelKey as keyof typeof AI_MODELS];
    
    // Fallback if model not found or OpenRouter not available
    if (!selectedModel || (selectedModel.provider === 'openrouter' && !OPENROUTER_API_KEY)) {
      selectedModelKey = 'gemini-flash';
      selectedModel = AI_MODELS['gemini-flash'];
    }

    console.log('Processing insights chat request...', { 
      hasOpenRouter: !!OPENROUTER_API_KEY,
      messageLength: userMessage?.length,
      conversationId,
      selectedModel: selectedModelKey,
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
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
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
