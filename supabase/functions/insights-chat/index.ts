import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Keywords that indicate a web search is needed
const webSearchKeywords = [
  'טכנולוגי', 'חדש', 'עדכני', 'מתחרים', 'מחיר', 'עלות', 'השוואה',
  'שירות', 'פלטפורמה', 'כלי', 'tool', 'platform', 'service', 'pricing',
  'alternative', 'אלטרנטיבה', 'המלצה על', 'איזה כלי', 'מה הכי טוב',
  'trends', 'טרנד', 'חדשות', '2025', '2026', 'AI', 'בינה מלאכותית',
  'CDP', 'attribution', 'Shopify', 'Klaviyo', 'Triple Whale', 'סטארטאפ'
];

function needsWebSearch(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return webSearchKeywords.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
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

    const { messages, userMessage, context, conversationId, clientId, userId } = await req.json();

    console.log('Processing insights chat request...', { 
      hasOpenRouter: !!OPENROUTER_API_KEY,
      messageLength: userMessage?.length,
      conversationId 
    });

    // Initialize Supabase client for saving messages
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Check if web search is needed
    const useWebSearch = OPENROUTER_API_KEY && needsWebSearch(userMessage);
    
    let apiEndpoint: string;
    let apiKey: string;
    let model: string;
    let extraHeaders: Record<string, string> = {};

    if (useWebSearch) {
      console.log('Using OpenRouter/Perplexity for web search');
      apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
      apiKey = OPENROUTER_API_KEY!;
      model = 'perplexity/sonar-pro';
      extraHeaders = {
        'HTTP-Referer': 'https://jiy.co.il',
        'X-Title': 'JIY Insights Agent',
      };
    } else {
      console.log('Using Lovable AI');
      apiEndpoint = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      apiKey = LOVABLE_API_KEY;
      model = 'google/gemini-2.5-flash';
    }

    const systemPrompt = `${context}

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

${useWebSearch ? `
**חיפוש אינטרנט פעיל** - יש לך גישה למידע עדכני מהאינטרנט.
כשמספק מידע מחיפוש:
- ציין שהמידע מבוסס על חיפוש עדכני
- הוסף קישורים למקורות אם זמינים
` : ''}`;

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
        model,
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

    // If we have conversation context, save the user message
    if (conversationId && userId && supabase) {
      try {
        await supabase.from('chat_messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: userMessage,
          metadata: { usedWebSearch: useWebSearch }
        });
      } catch (saveError) {
        console.error('Error saving user message:', saveError);
      }
    }

    // Create a transform stream to capture the full response
    let fullResponse = '';
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        // Pass through the chunk
        controller.enqueue(chunk);
        
        // Try to extract content for saving
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
        // Save the assistant message when stream ends
        if (conversationId && userId && supabase && fullResponse) {
          try {
            await supabase.from('chat_messages').insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: fullResponse,
              metadata: { usedWebSearch: useWebSearch, model }
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
        "X-Used-Web-Search": useWebSearch ? "true" : "false"
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
