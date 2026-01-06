import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Dialog questions
const questions: Record<string, { title: string; prompt: string }> = {
  "1": {
    title: "עיצוב ממשק ופסיכולוגיה",
    prompt: `אני בונה מערכת "סטודיו תוכן" (Content Studio) עבור סוכנות שיווק דיגיטלי.

הסטודיו אמור להיות סביבה ויזואלית ופסיכולוגית נוחה ומזמינה ליצירת תוכן - כרגע כתוב ובהמשך גם ויזואלי, עם חיבור ל-AI.

סוגי התוכן: מיתוג, בריפים, אסטרטגיות שיווק, מחקר קהלים, מודעות ממומנות (Meta/TikTok/Google/Taboola/Outbrain), מאמרי SEO, תוכן לאתרים, דיוורים, SMS, אוטומציות WhatsApp, תסריטים, קופי לקריאייטיב.

**שאלה**: איך לעצב את הממשק כך שיהיה מזמין ונוח ליצירה? מה הפסיכולוגיה והעקרונות? תן המלצות קונקרטיות לעיצוב, צבעים, Layout, אנימציות.`
  },
  "2": {
    title: "מבנה קומפוננטות תוכן",
    prompt: `בהמשך לשיחתנו על Content Studio לסוכנות שיווק.

**שאלה**: מה המבנה המומלץ לקומפוננטות תוכן? תן סכמה מפורטת של:
- השדות שצריכים להיות בכל קומפוננטת תוכן (מודעה, מאמר, דיוור וכו')
- ההירררכיה בין קומפוננטות
- כיצד לארגן Templates לפי פלטפורמה וסוג תוכן
- השדות הספציפיים לכל פלטפורמה (Meta, Google Search/Display/YouTube/PMAX, TikTok, Taboola, Outbrain)`
  },
  "3": {
    title: "ארכיטקטורת קמפיינים",
    prompt: `בהמשך לשיחתנו על Content Studio.

**שאלה**: איך לארגן את הקשר בין קמפיין/פרויקט לנכסים השונים?

דוגמה: קמפיין סוף שנה - מגדירים נושא וקריאייטיב מרכזי, והמערכת מייצרת קומפוננטות תוכן לכל הנכסים בו-זמנית.

תאר:
- המודל הנכון לניהול קמפיינים
- איך לקשר בין קמפיין לקומפוננטות התוכן
- איך לנהל גרסאות (A/B testing)
- איך לשייך לפרויקטים ומשימות`
  },
  "4": {
    title: "המלצות מודלי AI",
    prompt: `בהמשך לשיחתנו על Content Studio.

**שאלה חשובה**: לכל סוג תוכן - איזה מודל AI כדאי להשתמש?

התייחס ל:
1. כתיבת מודעות (Meta, Google, TikTok)
2. מאמרי SEO ו-AEO
3. תוכן לאתרים
4. דיוורים ו-SMS
5. תסריטים לוידאו
6. קופי לקריאייטיב ויזואלי
7. ניתוח מתחרים וקהלים
8. יצירת תמונות
9. יצירת וידאו

מודלים אפשריים: Claude, GPT-4/5, Gemini, DALL-E, Midjourney, Stable Diffusion, מודלי וידאו.
הסבר למה כל מודל מתאים.`
  },
  "5": {
    title: "Flow עבודה ופיצ'רים",
    prompt: `בהמשך לשיחתנו על Content Studio - שאלה אחרונה.

א) תאר את ה-Flow האידיאלי מרגע שמשתמש רוצה ליצור תוכן ועד שהוא מייצא לפלטפורמות.

ב) מה הפיצ'רים החיוניים ליום 1? מה לדחות לפאזות הבאות?

ג) אילו אינטגרציות (API) עם פלטפורמות הפרסום חיוניות?

ד) סיכום והמלצות סופיות.`
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const questionId = body.question || "1";
    const previousContext = body.context || "";

    const question = questions[questionId];
    if (!question) {
      return new Response(JSON.stringify({ error: "Invalid question ID (1-5)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Studio Dialog] Question ${questionId}: ${question.title}`);

    const systemPrompt = `אתה יועץ UX, אסטרטגיית תוכן ומומחה AI לסוכנויות שיווק דיגיטלי.
תן תשובות מקיפות ומעשיות עם דוגמאות קונקרטיות.
השב בעברית בלבד.`;

    const messages = [
      { role: "system", content: systemPrompt },
    ];

    // Add previous context if exists
    if (previousContext) {
      messages.push({ role: "assistant", content: previousContext });
    }

    messages.push({ role: "user", content: question.prompt });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://jiy.co.il",
        "X-Title": "JIY Studio Dialog",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4",
        messages,
        max_tokens: 2500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Studio Dialog] OpenRouter error:", err);
      throw new Error(`OpenRouter: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "";

    console.log(`[Studio Dialog] Got answer, length: ${answer.length}`);

    // Save to database for accumulation
    await supabase.from("ai_query_history").insert({
      action: "studio_dialog",
      model: "claude-opus-4.5",
      provider: "openrouter",
      prompt_summary: `Q${questionId}: ${question.title}`,
      response: answer,
    });

    // Extract key points
    const keyPoints = answer
      .split('\n')
      .filter((l: string) => l.startsWith('#') || l.startsWith('**') || l.match(/^\d+\./))
      .slice(0, 5)
      .map((l: string) => l.replace(/[#*]/g, '').trim());

    const nextQuestion = parseInt(questionId) < 5 ? String(parseInt(questionId) + 1) : null;

    return new Response(JSON.stringify({
      success: true,
      questionId,
      title: question.title,
      answer,
      keyPoints,
      nextQuestion,
      hasMore: nextQuestion !== null,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[Studio Dialog] Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
