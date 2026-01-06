import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(RESEND_API_KEY);

    console.log("[Claude Studio Advisor] Starting consultation with Claude Opus 4.5...");

    // The comprehensive prompt in Hebrew
    const systemPrompt = `אתה יועץ UX, אסטרטגיית תוכן ומומחה AI לסוכנויות שיווק דיגיטלי. 
אתה נדרש לתת תשובה מקיפה, מפורטת ומעשית.
השב בעברית בלבד.`;

    const userPrompt = `אני בונה מערכת "סטודיו תוכן" (Content Studio) עבור סוכנות שיווק דיגיטלי.

## הרקע והחזון

הסטודיו אמור להיות מקום שבו אני מייצר תוכן - כרגע כתוב ובהמשך גם ויזואלי, עם חיבור למערכות וכלים, במיוחד AI.

אני צריך ליצור **סביבה ויזואלית ופסיכולוגית נוחה ומזמינה ליצירת תוכן**.

## סוגי התוכן שצריך לתמוך:

### אסטרטגיה ומחקר:
- מיתוג ובריפים
- אסטרטגיות שיווק
- מחקר קהלי יעד
- מחקר מתחרים
- ניתוח מידע

### פרסום ממומן:
- **Meta** (Facebook, Instagram) - כל סוגי המודעות
- **TikTok** - מודעות וידאו ותמונה
- **Google** על כל גווניו:
  - Search
  - YouTube
  - Display
  - Performance Max (PMAX)
- **Taboola**
- **Outbrain**

### תוכן אורגני וקידום:
- מאמרים לקידום למנועי חיפוש (SEO)
- מאמרים למנועי AI (AEO/GEO)
- כתיבת תוכן לאתרים

### תקשורת ישירה:
- דיוורים (Email Marketing)
- SMS
- פלואו לאוטומציות WhatsApp או כל פלטפורמה אחרת
- עגלות נטושות (Abandoned Cart)

### קריאייטיב:
- כתיבת תסריטים
- קופי לתוכן ויזואלי (תמונות, וידאו)

## דרישות מפתח:

### 1. התאמה לפלטפורמות
כל התוכן צריך להיות מחובר ומתעדכן לפי הפרמטרים, הבקשות, השדות והפלייסמנטים של כל מערכת שיווק.

### 2. יצירת קמפיין מאוחדת
כמו קמפיין שעשינו לדרורי לסוף השנה - מגדירים את הנושא ואת הקריאייטיב, והמערכת מייצרת קומפוננטות תוכן לכל הנכסים בו-זמנית.
לאחר מכן ניתן:
- למשוך מה שנכון
- לתקן ידנית
- לתקן עם כלי AI

### 3. שיוך לפרויקטים
קומפוננטות תוכן צריכות להיות משויכות למשימה או/ו פרויקט.

## השאלות שלי אליך:

### 1. עיצוב הממשק
איך לעצב את הממשק כך שיהיה מזמין ונוח ליצירה? מה הפסיכולוגיה והעקרונות? תן לי המלצות קונקרטיות לעיצוב, צבעים, Layout, אנימציות.

### 2. מבנה קומפוננטות
מה המבנה המומלץ לקומפוננטות תוכן? תן לי סכמה מפורטת של:
- השדות שצריכים להיות בכל קומפוננטה
- ההירררכיה בין קומפוננטות
- כיצד לארגן Templates

### 3. ארכיטקטורת קמפיינים
איך לארגן את הקשר בין קמפיין/פרויקט לנכסים שונים? מה המודל הנכון לניהול?

### 4. המלצות מודלי AI
**חשוב מאוד**: לכל סוג תוכן וקומפוננטה - איזה מודל AI כדאי להשתמש?
התייחס למודלים הבאים ותסביר למה:
- Claude (Anthropic) - הגרסאות השונות
- GPT-4/GPT-5 (OpenAI)
- Gemini (Google)
- מודלים מיוחדים לתמונות (DALL-E, Midjourney, Stable Diffusion)
- מודלים לוידאו

### 5. Flow עבודה אידיאלי
תאר לי את ה-Flow האידיאלי מרגע שמשתמש רוצה ליצור תוכן ועד שהוא מייצא אותו לפלטפורמות.

### 6. פיצ'רים חיוניים
מה הפיצ'רים החיוניים שחייבים להיות ביום 1? מה אפשר לדחות לפאזות הבאות?

### 7. אינטגרציות
אילו אינטגרציות חיוניות (API) עם פלטפורמות הפרסום?

אנא תן תשובה מקיפה ומפורטת עם דוגמאות קונקרטיות.`;

    // Call Claude Opus 4.5 via OpenRouter
    console.log("[Claude Studio Advisor] Calling OpenRouter with Claude Opus 4.5...");
    
    const claudeResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://jiy.co.il",
        "X-Title": "JIY Content Studio Advisor",
      },
      body: JSON.stringify({
        model: "anthropic/claude-opus-4.5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 12000,
        temperature: 0.7,
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("[Claude Studio Advisor] OpenRouter error:", claudeResponse.status, errorText);
      throw new Error(`OpenRouter API error: ${claudeResponse.status} - ${errorText}`);
    }

    const claudeData = await claudeResponse.json();
    const fullResponse = claudeData.choices?.[0]?.message?.content || "";
    
    console.log("[Claude Studio Advisor] Received response, length:", fullResponse.length);

    // Extract key points for chat summary
    const extractKeyPoints = (text: string) => {
      const sections = text.split(/^#{1,3}\s+/m).filter(Boolean);
      const keyPoints: string[] = [];
      
      // Get first sentence or line from each major section
      sections.slice(0, 7).forEach(section => {
        const lines = section.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          const title = lines[0].replace(/[*#]/g, '').trim();
          if (title.length > 10 && title.length < 150) {
            keyPoints.push(title);
          }
        }
      });
      
      return keyPoints;
    };

    // Extract AI model recommendations
    const extractAIModels = (text: string) => {
      const models: { contentType: string; model: string; reason: string }[] = [];
      
      // Look for patterns mentioning models with context
      const modelPatterns = [
        { pattern: /Claude[^.]*מודעות|מודעות[^.]*Claude/gi, type: "מודעות ממומנות" },
        { pattern: /GPT[^.]*מאמרים|מאמרים[^.]*GPT/gi, type: "מאמרים" },
        { pattern: /Gemini[^.]*ניתוח|ניתוח[^.]*Gemini/gi, type: "ניתוח מידע" },
        { pattern: /DALL-E|Midjourney|Stable Diffusion/gi, type: "תמונות" },
      ];
      
      // Simple extraction based on common patterns
      if (text.includes("Claude") && text.includes("קופי")) {
        models.push({ contentType: "קופי ומודעות", model: "Claude", reason: "יכולות כתיבה מתקדמות" });
      }
      if (text.includes("GPT") && (text.includes("מאמר") || text.includes("SEO"))) {
        models.push({ contentType: "מאמרים ו-SEO", model: "GPT-4/5", reason: "אופטימיזציה למנועי חיפוש" });
      }
      if (text.includes("Gemini") && text.includes("ניתוח")) {
        models.push({ contentType: "ניתוח נתונים", model: "Gemini", reason: "עיבוד מידע מהיר" });
      }
      if (text.includes("DALL-E") || text.includes("Midjourney")) {
        models.push({ contentType: "יצירת תמונות", model: "DALL-E / Midjourney", reason: "איכות ויזואלית" });
      }
      
      return models;
    };

    const keyPoints = extractKeyPoints(fullResponse);
    const aiModels = extractAIModels(fullResponse);

    // Generate summary
    const summary = fullResponse.substring(0, 500).replace(/\n/g, ' ').trim() + "...";

    // Send full email
    console.log("[Claude Studio Advisor] Sending email with full response...");
    
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
    .header p { 
      margin: 0; 
      opacity: 0.9; 
      font-size: 16px;
    }
    .content { 
      padding: 40px; 
    }
    .section { 
      margin-bottom: 30px; 
      padding: 25px;
      background: #334155;
      border-radius: 12px;
      border-right: 4px solid #7c3aed;
    }
    h2 { 
      color: #a78bfa; 
      font-size: 22px; 
      margin-top: 30px;
      margin-bottom: 15px;
    }
    h3 { 
      color: #60a5fa; 
      font-size: 18px;
      margin-top: 20px;
    }
    h4 {
      color: #38bdf8;
      font-size: 16px;
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
    pre {
      background: #0f172a;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      color: #e2e8f0;
    }
    .highlight {
      background: linear-gradient(90deg, rgba(124, 58, 237, 0.2), transparent);
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
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
    .model-tag {
      display: inline-block;
      background: #0ea5e9;
      color: white;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      margin: 2px;
    }
    hr {
      border: none;
      border-top: 1px solid #475569;
      margin: 30px 0;
    }
    blockquote {
      border-right: 3px solid #7c3aed;
      padding-right: 15px;
      margin-right: 0;
      color: #94a3b8;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 12px;
      text-align: right;
      border: 1px solid #475569;
    }
    th {
      background: #475569;
      color: #f8fafc;
    }
    td {
      background: #334155;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨 ייעוץ Content Studio מ-Claude Opus 4.5</h1>
      <p>תשובה מקיפה לתכנון ועיצוב מערכת הסטודיו</p>
      <p style="margin-top: 15px; font-size: 13px; opacity: 0.7;">
        נוצר ב: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
        <span class="badge">Claude Opus 4.5</span>
      </p>
    </div>
    <div class="content">
      ${fullResponse
        .replace(/^#{1,6}\s+(.+)$/gm, (_match: string, title: string) => `<h2>${title}</h2>`)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/^\* (.+)$/gm, '<li>$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
      }
    </div>
    <div class="footer">
      <p>📧 מייל זה נשלח אוטומטית ממערכת JIY Content Studio</p>
      <p>המודל: anthropic/claude-opus-4.5 via OpenRouter</p>
    </div>
  </div>
</body>
</html>`;

    const emailResponse = await resend.emails.send({
      from: "JIY Studio <onboarding@resend.dev>",
      to: ["yossef@jiy.co.il"],
      subject: "🎨 ייעוץ מקיף לסטודיו התוכן - Claude Opus 4.5",
      html: emailHtml,
    });

    console.log("[Claude Studio Advisor] Email sent:", emailResponse);

    // Return summary to chat
    const chatResponse = {
      success: true,
      summary,
      keyPoints,
      aiModelsRecommendations: aiModels,
      emailSent: true,
      emailId: emailResponse?.data?.id,
      model: "anthropic/claude-opus-4.5",
      responseLength: fullResponse.length,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(chatResponse), {
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
