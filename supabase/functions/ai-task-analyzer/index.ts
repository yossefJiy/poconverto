import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AnalyzerType = "analyze" | "analyze_task" | "suggest_tasks" | "analyze_data" | "analyze_campaigns";

// Track AI usage
async function trackAIUsage(params: {
  action: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  promptSummary?: string;
  response?: string;
  clientId?: string;
  userId?: string;
}) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const estimatedCost = ((params.inputTokens / 1000) * 0.00005) + ((params.outputTokens / 1000) * 0.00015);
    
    await supabase.from('ai_query_history').insert({
      action: params.action,
      model: params.model,
      provider: 'lovable',
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      estimated_cost: estimatedCost,
      prompt_summary: params.promptSummary?.slice(0, 500),
      response: params.response?.slice(0, 2000),
      client_id: params.clientId || null,
      created_by: params.userId || null,
    });
    console.log('AI usage tracked:', { action: params.action, estimatedCost });
  } catch (err) {
    console.error('Error tracking AI usage:', err);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json().catch(() => ({}));
    const {
      prompt,
      context,
      teamMembers,
      type = "analyze" as AnalyzerType,
    } = body as {
      prompt?: string;
      context?: any;
      teamMembers?: any[];
      type?: AnalyzerType;
    };

    let systemPrompt = "";
    let userPrompt = prompt || "";

    if (type === "analyze_task") {
      systemPrompt = `אתה עוזר AI מומחה בניהול משימות ופרויקטים.
נתח משימה והחזר תמיד JSON תקין במבנה:
{
  "assignee": "שם חבר הצוות המומלץ",
  "duration_minutes": מספר,
  "priority": "low" | "medium" | "high",
  "category": "קטגוריה מתאימה",
  "reasoning": "הסבר קצר להמלצות"
}`;

      userPrompt = `משימה לניתוח:
כותרת: ${context?.title || prompt || ""}
תיאור: ${context?.description || "לא צוין"}
לקוח: ${context?.clientName || "לא צוין"}

חברי צוות זמינים:
${teamMembers?.map((m: any) => `- ${m.name} (${m.departments?.join(", ") || "כללי"})`).join("\n") || "לא צוינו"}

החזר רק JSON.`;
    } else if (type === "suggest_tasks") {
      systemPrompt = `אתה עוזר AI מומחה בניהול פרויקטים.
הצע 3-5 משימות רלוונטיות והחזר תמיד JSON תקין במבנה:
{
  "suggestions": [
    {
      "title": "כותרת המשימה",
      "description": "תיאור קצר",
      "priority": "low" | "medium" | "high",
      "estimated_minutes": מספר
    }
  ]
}`;

      userPrompt = `${prompt || "הצע משימות"}

הקשר:
${JSON.stringify(context || {}, null, 2)}

החזר רק JSON.`;
    } else if (type === "analyze_data") {
      systemPrompt = `אתה עוזר AI מומחה בניתוח נתונים עסקיים.
נתח את הנתונים ותן תובנות מעשיות והמלצות קצרות וברורות בעברית.`;

      userPrompt = `${prompt || "נתח נתונים"}

נתונים:
${JSON.stringify(context || {}, null, 2)}`;
    } else if (type === "analyze_campaigns") {
      systemPrompt = `אתה עוזר AI מומחה בשיווק דיגיטלי וניתוח קמפיינים.
החזר תמיד JSON תקין במבנה:
{
  "proposals": [
    {
      "action_type": "optimize_creative" | "reduce_cpc" | "increase_budget" | "improve_landing_page" | "budget_alert",
      "title": "כותרת הפעולה",
      "description": "תיאור הבעיה",
      "impact": "high" | "medium" | "low",
      "campaign_id": "מזהה הקמפיין",
      "campaign_name": "שם הקמפיין",
      "suggested_change": "שינוי מוצע ספציפי"
    }
  ],
  "summary": "סיכום קצר"
}

קריטריונים:
- CTR נמוך מ-1%
- CPC גבוה מ-10 ש\"ח
- ניצול תקציב פחות מ-50% או יותר מ-95%
- יחס המרה נמוך (קליקים גבוהים עם המרות נמוכות)

החזר רק JSON.`;

      userPrompt = `קמפיינים לניתוח:
${JSON.stringify(context?.campaigns || [], null, 2)}

לקוח: ${context?.clientName || "לא צוין"}

החזר רק JSON.`;
    } else {
      systemPrompt = `אתה עוזר AI חכם ומועיל. ענה בעברית בצורה ברורה ותמציתית.`;
    }

    console.log(`ai-task-analyzer: Processing type=${type}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const generatedText: string = data?.choices?.[0]?.message?.content || "";

    // Try to extract JSON from the response
    let parsedResult: any = null;
    if (type === "analyze_task" || type === "suggest_tasks" || type === "analyze_campaigns") {
      try {
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsedResult = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.log("Could not parse JSON from response");
      }
    }

    // Track AI usage
    const inputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
    const outputTokens = Math.ceil(generatedText.length / 4);
    
    // Extract user ID from authorization header
    const authHeader = req.headers.get('authorization');
    let userId: string | undefined;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch {}
    }
    
    await trackAIUsage({
      action: `task_analyzer_${type}`,
      model: 'google/gemini-2.5-flash',
      inputTokens,
      outputTokens,
      promptSummary: userPrompt.slice(0, 500),
      response: generatedText.slice(0, 2000),
      clientId: context?.clientId,
      userId,
    });

    return new Response(
      JSON.stringify({
        text: generatedText,
        parsed: parsedResult,
        type,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in ai-task-analyzer:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

