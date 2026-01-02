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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { prompt, context, teamMembers, type = "analyze" } = await req.json();

    let systemPrompt = "";
    let userPrompt = prompt;

    if (type === "analyze_task") {
      systemPrompt = `אתה עוזר AI מומחה בניהול משימות ופרויקטים. 
תפקידך לנתח משימות ולהמליץ על:
1. מי צריך להיות האחראי על המשימה (מתוך רשימת חברי הצוות)
2. כמה זמן המשימה צפויה לקחת (בדקות)
3. עדיפות המשימה (low/medium/high)
4. קטגוריה מתאימה

ענה תמיד בפורמט JSON עם המבנה הבא:
{
  "assignee": "שם חבר הצוות המומלץ",
  "duration_minutes": מספר,
  "priority": "low" | "medium" | "high",
  "category": "קטגוריה מתאימה",
  "reasoning": "הסבר קצר להמלצות"
}`;

      userPrompt = `משימה לניתוח:
כותרת: ${context?.title || prompt}
תיאור: ${context?.description || "לא צוין"}
לקוח: ${context?.clientName || "לא צוין"}

חברי צוות זמינים:
${teamMembers?.map((m: any) => `- ${m.name} (${m.departments?.join(", ") || "כללי"})`).join("\n") || "לא צוינו"}

נתח את המשימה והמלץ על אחראי, משך זמן ועדיפות.`;
    } else if (type === "suggest_tasks") {
      systemPrompt = `אתה עוזר AI מומחה בניהול פרויקטים.
תפקידך להציע משימות רלוונטיות על בסיס ההקשר שניתן.
ענה תמיד בפורמט JSON עם מערך של משימות:
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
    } else if (type === "analyze_data") {
      systemPrompt = `אתה עוזר AI מומחה בניתוח נתונים עסקיים.
נתח את הנתונים שניתנים לך ותן תובנות מעשיות.
ענה בעברית בצורה ברורה ותמציתית.`;
    } else if (type === "analyze_campaigns") {
      systemPrompt = `אתה עוזר AI מומחה בשיווק דיגיטלי וניתוח קמפיינים.
תפקידך לנתח קמפיינים ולהציע פעולות לשיפור ביצועים.

ענה תמיד בפורמט JSON עם המבנה הבא:
{
  "proposals": [
    {
      "action_type": "סוג הפעולה (optimize_creative/reduce_cpc/increase_budget/improve_landing_page)",
      "title": "כותרת הפעולה",
      "description": "תיאור מפורט של הבעיה",
      "impact": "high" | "medium" | "low",
      "campaign_id": "מזהה הקמפיין",
      "campaign_name": "שם הקמפיין",
      "suggested_change": "שינוי מוצע ספציפי"
    }
  ],
  "summary": "סיכום כללי של מצב הקמפיינים"
}

נתח את הקמפיינים לפי:
1. CTR - אם נמוך מ-1% זה בעייתי
2. CPC - אם גבוה מ-10 ש"ח זה יקר
3. ניצול תקציב - פחות מ-50% או יותר מ-95%
4. יחס המרה - קליקים גבוהים עם המרות נמוכות`;

      userPrompt = `קמפיינים לניתוח:
${JSON.stringify(context?.campaigns || [], null, 2)}

לקוח: ${context?.clientName || "לא צוין"}

נתח את הקמפיינים והצע פעולות שיווקיות לשיפור ביצועים.`;
    } else {
      systemPrompt = `אתה עוזר AI חכם ומועיל. ענה בעברית בצורה ברורה ותמציתית.`;
    }

    console.log(`Processing ${type} request...`);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log('Generated response:', generatedText.substring(0, 200));

    // Try to extract JSON from the response
    let parsedResult = null;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('Could not parse JSON from response');
    }

    return new Response(JSON.stringify({ 
      text: generatedText,
      parsed: parsedResult,
      type 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-task-analyzer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
