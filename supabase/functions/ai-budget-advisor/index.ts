import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { budget, goal } = await req.json();

    if (!budget) {
      return new Response(
        JSON.stringify({ error: "Budget is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const response = await fetch("https://api.lovable.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `אתה יועץ תקציב פרסום דיגיטלי מומחה. בהינתן תקציב ומטרה, החזר JSON עם:
            - totalBudget: התקציב הכולל
            - allocation: מערך של הקצאות (platform, amount, percentage, reason)
            - expectedROAS: ROAS צפוי (מספר)
            - tips: מערך של טיפים לאופטימיזציה
            
            פלטפורמות אפשריות: Google Ads, Facebook Ads, Instagram, TikTok, LinkedIn
            החזר רק JSON תקין ללא טקסט נוסף.`
          },
          {
            role: "user",
            content: `תקציב: ₪${budget}\nמטרה: ${goal || "הגדלת מכירות"}`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const advisorText = aiResponse.choices?.[0]?.message?.content || "";
    
    let recommendation;
    try {
      recommendation = JSON.parse(advisorText);
    } catch {
      // Fallback recommendation
      const budgetNum = Number(budget);
      recommendation = {
        totalBudget: budgetNum,
        allocation: [
          { platform: "Google Ads", amount: budgetNum * 0.4, percentage: 40, reason: "חיפוש מבוסס כוונה" },
          { platform: "Facebook Ads", amount: budgetNum * 0.3, percentage: 30, reason: "טירגוט מדויק" },
          { platform: "Instagram", amount: budgetNum * 0.2, percentage: 20, reason: "מעורבות ויזואלית" },
          { platform: "TikTok", amount: budgetNum * 0.1, percentage: 10, reason: "חשיפה לקהל צעיר" },
        ],
        expectedROAS: 3.2,
        tips: [
          "בצע A/B testing על מודעות",
          "עקוב אחרי ביצועים יומיים",
          "התאם תקציב לפי יום בשבוע"
        ]
      };
    }

    return new Response(
      JSON.stringify(recommendation),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
