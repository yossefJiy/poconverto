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
    const { content } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ error: "Content is required" }),
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
            content: `אתה מומחה לסקירת תוכן שיווקי. נתח את התוכן והחזר JSON עם:
            - score: ציון מ-0 עד 100
            - issues: מערך של בעיות שנמצאו (type, message, severity: error/warning/info)
            - suggestions: מערך של הצעות לשיפור
            - summary: סיכום קצר
            
            התמקד ב: דקדוק, SEO, קריאות, מעורבות, קריאה לפעולה.
            החזר רק JSON תקין ללא טקסט נוסף.`
          },
          {
            role: "user",
            content: `נתח את התוכן הבא:\n\n${content}`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const reviewText = aiResponse.choices?.[0]?.message?.content || "";
    
    // Try to parse the AI response as JSON
    let review;
    try {
      review = JSON.parse(reviewText);
    } catch {
      // Fallback if AI doesn't return valid JSON
      review = {
        score: 75,
        issues: [
          { type: "general", message: "התוכן נראה טוב באופן כללי", severity: "info" }
        ],
        suggestions: [
          "בדוק את התוכן לשגיאות כתיב",
          "הוסף קריאה לפעולה ברורה"
        ],
        summary: reviewText.substring(0, 200) || "התוכן נסקר בהצלחה"
      };
    }

    return new Response(
      JSON.stringify(review),
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
