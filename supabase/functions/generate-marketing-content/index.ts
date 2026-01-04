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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { contentType } = await req.json();

    // Define comprehensive system prompt for marketing content generation
    const systemPrompt = `אתה מומחה לשיווק דיגיטלי, כתיבת תוכן ואסטרטגיית מותג. 
    המשימה שלך היא לייצר תוכן שיווקי עבור Converto - פלטפורמה מתקדמת לשיווק דיגיטלי ואיקומרס.

    ## על Converto:
    Converto היא מערכת All-in-One לשיווק דיגיטלי שכוללת:

    ### מערכת ניהול שיווק אינטגרטיבית (לא רק דשבורד):
    - ניהול קמפיינים מרכזי: יצירה, עריכה והפעלת קמפיינים ישירות מהמערכת
    - פרסום פרוגרמטי: פרסום ישיר לטיקטוק, מטא וגוגל ממקום אחד
    - AI Agents: סוכנים חכמים שמנהלים קמפיינים, מבצעים אופטימיזציה ומזהים הזדמנויות
    - אנליטיקס מאוחד: Google Analytics, Google Ads, Meta Ads, TikTok Ads במקום אחד
    - דוחות אוטומטיים: PDF מעוצבים עם תובנות AI
    - ניהול משימות: Kanban board לצוותי שיווק עם AI שמקצה משימות
    - התראות חכמות: זיהוי אנומליות ובעיות בקמפיינים בזמן אמת
    - ניתוח מתחרים: מעקב אחרי מתחרים וזיהוי הזדמנויות
    - ניהול לקוחות: CRM מובנה לסוכנויות שיווק

    ### אתרי איקומרס חכמים:
    - Shopify ו-WooCommerce: אינטגרציה מלאה עם פלטפורמות המובילות
    - חיבור למערכות פרסום: סנכרון אוטומטי של מוצרים לקטלוגים
    - WhatsApp Agents: בוטים חכמים לטיפול בהזמנות בוואטסאפ
    - קופה חכמה: תהליך checkout ממיר עם upsells ו-cross-sells
    - ניהול מלאי: התראות וסנכרון מלאי בזמן אמת
    - אנליטיקס מכירות: ROI, ROAS ומעקב המרות מדויק
    - A/B Testing: בדיקות אוטומטיות לשיפור המרות
    - SEO מובנה: אופטימיזציה למנועי חיפוש

    ## קהלי יעד:
    1. בעלי עסקים קטנים ובינוניים שרוצים למכור אונליין
    2. סוכנויות שיווק שמנהלות מספר לקוחות
    3. מנהלי שיווק שרוצים לייעל את העבודה
    4. יזמי איקומרס שרוצים לצמוח

    ## כאבי לקוח:
    - בזבוז זמן על מעבר בין פלטפורמות
    - חוסר שקיפות בROI של קמפיינים
    - קושי בניהול מספר ערוצי פרסום
    - עלויות גבוהות על כלים נפרדים
    - חוסר אופטימיזציה אוטומטית
    - קושי בהבנת נתונים

    ## יתרונות ייחודיים:
    - הכל במקום אחד (אין צורך ב-10 כלים שונים)
    - AI שעובד בשבילך 24/7
    - פרסום ישיר מהמערכת (לא רק צפייה בנתונים)
    - תמיכה בעברית מלאה
    - מחיר אחד לכל הפיצ'רים

    ## הבטחות שיווקיות:
    - "הגדילו את ההמרות ב-300%"
    - "חסכו 15 שעות בשבוע"
    - "פרסום חכם בקליק אחד"
    - "AI שמנהל את הקמפיינים בשבילכם"

    כתוב בעברית, בסגנון מקצועי אך נגיש, עם דגש על תועלות ללקוח.`;

    let userPrompt = "";

    if (contentType === "analyze_and_generate_all") {
      userPrompt = `צור תוכן שיווקי מקיף עבור האתר. החזר JSON עם המבנה הבא:

{
  "homepage": {
    "headline": "כותרת ראשית מרשימה",
    "subheadline": "תת כותרת שמסבירה את הערך",
    "cta": "טקסט לכפתור פעולה",
    "trustIndicators": ["יתרון 1", "יתרון 2", "יתרון 3"],
    "products": [
      {
        "id": "marketing-system",
        "title": "שם המוצר",
        "description": "תיאור קצר",
        "features": ["פיצ'ר 1", "פיצ'ר 2"]
      }
    ],
    "whyUs": {
      "title": "למה Converto",
      "items": [
        {"icon": "clock", "title": "כותרת", "description": "תיאור"}
      ]
    }
  },
  "marketingSystemPage": {
    "headline": "כותרת",
    "subheadline": "תת כותרת",
    "stats": [{"value": "מספר", "label": "תיאור"}],
    "features": [{"icon": "icon-name", "title": "שם", "description": "תיאור"}],
    "integrations": ["פלטפורמה 1", "פלטפורמה 2"],
    "process": [{"step": 1, "title": "שלב", "description": "תיאור"}]
  },
  "ecommercePage": {
    "headline": "כותרת",
    "subheadline": "תת כותרת",
    "stats": [{"value": "מספר", "label": "תיאור"}],
    "features": [{"icon": "icon-name", "title": "שם", "description": "תיאור"}],
    "whyUs": ["יתרון 1", "יתרון 2"]
  },
  "targetAudiences": [
    {
      "name": "שם קהל",
      "painPoints": ["כאב 1", "כאב 2"],
      "solutions": ["פתרון 1", "פתרון 2"],
      "marketingPromise": "ההבטחה"
    }
  ]
}

שים לב:
- התוכן צריך להיות מותאם לשוק הישראלי
- להדגיש את היכולות המתקדמות של AI
- לכלול את כל הפיצ'רים הקיימים והעתידיים
- להיות משכנע ומקצועי`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse JSON from response
    let parsedContent;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      parsedContent = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      parsedContent = { raw: content };
    }

    return new Response(JSON.stringify({ success: true, content: parsedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
