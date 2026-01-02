import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { messages, userMessage, context } = await req.json();

    console.log('Processing insights chat request...');

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
- ציין אינטגרציות רלוונטיות`;

    const allMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
      { role: "user", content: userMessage },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
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
