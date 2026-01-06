import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Dialog parts - each builds on previous context
const dialogParts = [
  {
    id: "intro",
    title: "רקע והקדמה",
    prompt: `אני בונה מערכת "סטודיו תוכן" (Content Studio) עבור סוכנות שיווק דיגיטלי.

הסטודיו אמור להיות סביבה ויזואלית ופסיכולוגית נוחה ומזמינה ליצירת תוכן - כרגע כתוב ובהמשך גם ויזואלי, עם חיבור ל-AI.

סוגי התוכן שצריך לתמוך:
• אסטרטגיה: מיתוג, בריפים, אסטרטגיות שיווק, מחקר קהלים ומתחרים
• פרסום ממומן: Meta, TikTok, Google (Search/YouTube/Display/PMAX), Taboola, Outbrain
• תוכן אורגני: מאמרי SEO/AEO, תוכן לאתרים
• תקשורת ישירה: Email, SMS, אוטומציות WhatsApp, עגלות נטושות
• קריאייטיב: תסריטים, קופי לתמונות ווידאו

**שאלה 1**: איך לעצב את הממשק כך שיהיה מזמין ונוח ליצירה? מה הפסיכולוגיה והעקרונות? תן לי המלצות קונקרטיות לעיצוב, צבעים, Layout, אנימציות.`
  },
  {
    id: "components",
    title: "מבנה קומפוננטות תוכן",
    prompt: `תודה על התשובה המפורטת לגבי העיצוב.

**שאלה 2**: מה המבנה המומלץ לקומפוננטות תוכן? תן לי סכמה מפורטת של:
- השדות שצריכים להיות בכל קומפוננטת תוכן (מודעה, מאמר, דיוור וכו')
- ההירררכיה בין קומפוננטות
- כיצד לארגן Templates לפי פלטפורמה וסוג תוכן
- מהם השדות הספציפיים לכל פלטפורמה (Meta, Google, TikTok וכו')`
  },
  {
    id: "campaigns",
    title: "ארכיטקטורת קמפיינים",
    prompt: `מעולה, עכשיו אני מבין טוב יותר את מבנה הקומפוננטות.

**שאלה 3**: איך לארגן את הקשר בין קמפיין/פרויקט לנכסים השונים?

דוגמה: קמפיין סוף שנה - מגדירים נושא וקריאייטיב מרכזי, והמערכת מייצרת קומפוננטות תוכן לכל הנכסים בו-זמנית.

תאר לי:
- המודל הנכון לניהול קמפיינים
- איך לקשר בין קמפיין לקומפוננטות התוכן השונות
- איך לנהל גרסאות (A/B testing)
- איך לשייך לפרויקטים ומשימות במערכת`
  },
  {
    id: "ai_models",
    title: "המלצות מודלי AI",
    prompt: `תודה רבה על ההסבר על ארכיטקטורת הקמפיינים.

**שאלה 4 - חשוב מאוד**: לכל סוג תוכן וקומפוננטה - איזה מודל AI כדאי להשתמש?

התייחס לכל אחד מהבאים:
1. כתיבת מודעות (Meta, Google, TikTok)
2. מאמרי SEO ו-AEO
3. תוכן לאתרים
4. דיוורים ו-SMS
5. תסריטים לוידאו
6. קופי לקריאייטיב ויזואלי
7. ניתוח מתחרים וקהלים
8. יצירת תמונות
9. יצירת וידאו

למודלים האפשריים:
- Claude (Anthropic) - הגרסאות השונות
- GPT-4/GPT-5 (OpenAI)
- Gemini (Google)
- DALL-E, Midjourney, Stable Diffusion
- מודלים לוידאו

הסבר למה כל מודל מתאים לכל משימה.`
  },
  {
    id: "flow_features",
    title: "Flow עבודה ופיצ'רים",
    prompt: `מעולה, עכשיו יש לי תמונה ברורה על מודלי ה-AI.

**שאלה 5 - אחרונה**: 

א) תאר לי את ה-Flow האידיאלי מרגע שמשתמש רוצה ליצור תוכן ועד שהוא מייצא אותו לפלטפורמות.

ב) מה הפיצ'רים החיוניים שחייבים להיות ביום 1? מה אפשר לדחות לפאזות הבאות?

ג) אילו אינטגרציות (API) עם פלטפורמות הפרסום חיוניות?

ד) סיכום והמלצות סופיות לפרויקט.`
  }
];

async function callClaude(
  apiKey: string, 
  messages: { role: string; content: string }[]
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://jiy.co.il",
      "X-Title": "JIY Content Studio Advisor",
    },
    body: JSON.stringify({
      model: "anthropic/claude-opus-4.5",
      messages,
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const resend = new Resend(RESEND_API_KEY);
    
    // Check if specific part requested
    const body = await req.json().catch(() => ({}));
    const requestedPart = body.part;

    console.log(`[Claude Studio Advisor] Starting dialog consultation...`);

    const systemPrompt = `אתה יועץ UX, אסטרטגיית תוכן ומומחה AI לסוכנויות שיווק דיגיטלי.
אתה נדרש לתת תשובות מקיפות, מפורטות ומעשיות עם דוגמאות קונקרטיות.
השב בעברית בלבד.
השתמש בכותרות, רשימות וארגון ברור.`;

    const conversationHistory: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt }
    ];

    const allResponses: { id: string; title: string; response: string }[] = [];
    const keyPointsAll: string[] = [];
    const aiModelsRecommendations: { contentType: string; model: string; reason: string }[] = [];

    // Run through all dialog parts
    for (const part of dialogParts) {
      // If specific part requested and not this one, skip
      if (requestedPart && part.id !== requestedPart && allResponses.length > 0) {
        continue;
      }

      console.log(`[Claude Studio Advisor] Part ${part.id}: ${part.title}...`);

      // Add user message
      conversationHistory.push({ role: "user", content: part.prompt });

      // Call Claude
      const response = await callClaude(OPENROUTER_API_KEY, conversationHistory);
      
      console.log(`[Claude Studio Advisor] Got response for ${part.id}, length: ${response.length}`);

      // Add assistant response to history
      conversationHistory.push({ role: "assistant", content: response });

      // Store response
      allResponses.push({
        id: part.id,
        title: part.title,
        response
      });

      // Extract key points from this response
      const lines = response.split('\n').filter(l => l.trim());
      const headers = lines.filter(l => l.startsWith('#') || l.startsWith('**'));
      keyPointsAll.push(...headers.slice(0, 3).map(h => h.replace(/[#*]/g, '').trim()));

      // Extract AI model recommendations if this is the AI models part
      if (part.id === "ai_models") {
        const modelMatches = [
          { pattern: /מודעות.*?Claude|Claude.*?מודעות/i, type: "מודעות ממומנות", model: "Claude" },
          { pattern: /SEO.*?GPT|GPT.*?SEO|מאמרים.*?GPT/i, type: "מאמרי SEO", model: "GPT-4/5" },
          { pattern: /Gemini.*?ניתוח|ניתוח.*?Gemini/i, type: "ניתוח נתונים", model: "Gemini" },
          { pattern: /DALL-E|Midjourney/i, type: "יצירת תמונות", model: "DALL-E / Midjourney" },
        ];
        
        for (const m of modelMatches) {
          if (m.pattern.test(response)) {
            aiModelsRecommendations.push({ 
              contentType: m.type, 
              model: m.model,
              reason: "מומלץ על ידי Claude"
            });
          }
        }
      }

      // If specific part requested, stop after it
      if (requestedPart && part.id === requestedPart) {
        break;
      }
    }

    // Build full email content
    const fullContent = allResponses.map(r => `
## ${r.title}

${r.response}

---
`).join('\n\n');

    // Send email with all responses
    console.log("[Claude Studio Advisor] Sending complete email...");
    
    const emailHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: 'Segoe UI', Arial, sans-serif; 
      direction: rtl; 
      text-align: right; 
      background: #0f172a; 
      color: #e2e8f0;
      line-height: 1.8;
      margin: 0;
      padding: 20px;
    }
    .container { 
      max-width: 900px; 
      margin: 0 auto; 
      background: #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
    }
    .header { 
      background: linear-gradient(135deg, #7c3aed, #2563eb, #0ea5e9); 
      color: white; 
      padding: 40px; 
    }
    .header h1 { 
      margin: 0 0 10px 0; 
      font-size: 28px; 
      font-weight: 700;
    }
    .content { 
      padding: 40px; 
    }
    .part { 
      margin-bottom: 40px; 
      padding: 30px;
      background: #334155;
      border-radius: 12px;
      border-right: 4px solid #7c3aed;
    }
    .part-title {
      color: #a78bfa;
      font-size: 22px;
      margin-bottom: 20px;
      font-weight: bold;
    }
    h2 { 
      color: #60a5fa; 
      font-size: 20px; 
      margin-top: 25px;
      margin-bottom: 15px;
    }
    h3 { 
      color: #38bdf8; 
      font-size: 17px;
      margin-top: 20px;
    }
    p { 
      color: #cbd5e1; 
      margin-bottom: 12px;
    }
    ul, ol { 
      color: #cbd5e1; 
      padding-right: 25px;
    }
    li { 
      margin-bottom: 8px; 
    }
    code { 
      background: #475569; 
      padding: 2px 8px; 
      border-radius: 4px; 
      font-family: 'Courier New', monospace;
      color: #f472b6;
    }
    strong { 
      color: #f8fafc; 
    }
    .footer { 
      background: #0f172a; 
      color: #64748b; 
      padding: 25px 40px; 
      font-size: 13px; 
      text-align: center;
      border-top: 1px solid #334155;
    }
    .badge {
      display: inline-block;
      background: #7c3aed;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      margin-left: 8px;
    }
    hr {
      border: none;
      border-top: 1px solid #475569;
      margin: 30px 0;
    }
    .toc {
      background: #1e293b;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .toc-title {
      color: #a78bfa;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .toc a {
      color: #60a5fa;
      text-decoration: none;
      display: block;
      padding: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨 ייעוץ מקיף לסטודיו התוכן</h1>
      <p>דיאלוג מלא עם Claude Opus 4.5</p>
      <p style="margin-top: 15px; font-size: 13px; opacity: 0.7;">
        נוצר ב: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
        <span class="badge">${allResponses.length} חלקים</span>
      </p>
    </div>
    <div class="content">
      <div class="toc">
        <div class="toc-title">📑 תוכן העניינים</div>
        ${allResponses.map((r, i) => `<a href="#part-${r.id}">${i + 1}. ${r.title}</a>`).join('')}
      </div>
      
      ${allResponses.map((r, i) => `
        <div class="part" id="part-${r.id}">
          <div class="part-title">חלק ${i + 1}: ${r.title}</div>
          ${r.response
            .replace(/^#{1,6}\s+(.+)$/gm, '<h2>$1</h2>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/^\* (.+)$/gm, '<li>$1</li>')
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
          }
        </div>
      `).join('')}
    </div>
    <div class="footer">
      <p>📧 מייל זה נשלח אוטומטית ממערכת JIY Content Studio</p>
      <p>המודל: anthropic/claude-opus-4.5 via OpenRouter | ${allResponses.length} חלקי דיאלוג</p>
    </div>
  </div>
</body>
</html>`;

    const emailResponse = await resend.emails.send({
      from: "JIY Studio <onboarding@resend.dev>",
      to: ["yossef@jiy.co.il"],
      subject: `🎨 ייעוץ מקיף לסטודיו התוכן - ${allResponses.length} חלקים`,
      html: emailHtml,
    });

    console.log("[Claude Studio Advisor] Email sent:", emailResponse);

    // Build summary for chat
    const summary = allResponses.length > 0 
      ? allResponses[0].response.substring(0, 300).replace(/\n/g, ' ').trim() + "..."
      : "לא התקבלה תשובה";

    return new Response(JSON.stringify({
      success: true,
      partsCompleted: allResponses.length,
      parts: allResponses.map(r => ({
        id: r.id,
        title: r.title,
        preview: r.response.substring(0, 200) + "..."
      })),
      keyPoints: keyPointsAll.slice(0, 10),
      aiModelsRecommendations,
      summary,
      emailSent: true,
      emailId: emailResponse?.data?.id,
      model: "anthropic/claude-opus-4.5",
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("[Claude Studio Advisor] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
