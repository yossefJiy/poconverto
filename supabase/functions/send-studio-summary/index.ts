import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(RESEND_API_KEY);

    console.log("[Send Studio Summary] Fetching all dialog responses...");

    // Get all dialog responses
    const { data: responses, error } = await supabase
      .from("ai_query_history")
      .select("prompt_summary, response, created_at")
      .eq("action", "studio_dialog")
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) throw error;
    if (!responses || responses.length === 0) {
      throw new Error("No dialog responses found");
    }

    console.log(`[Send Studio Summary] Found ${responses.length} responses`);

    // Build email HTML
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
    pre {
      background: #0f172a;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      color: #e2e8f0;
      font-size: 13px;
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
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 10px;
      text-align: right;
      border: 1px solid #475569;
    }
    th {
      background: #475569;
    }
    .toc {
      background: #1e293b;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border: 1px solid #334155;
    }
    .toc-title {
      color: #a78bfa;
      font-weight: bold;
      margin-bottom: 15px;
      font-size: 18px;
    }
    .toc a {
      color: #60a5fa;
      text-decoration: none;
      display: block;
      padding: 8px 0;
      border-bottom: 1px solid #334155;
    }
    .toc a:last-child {
      border-bottom: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎨 ייעוץ מקיף לסטודיו התוכן</h1>
      <p>דיאלוג מלא עם Claude Sonnet 4</p>
      <p style="margin-top: 15px; font-size: 13px; opacity: 0.7;">
        נוצר ב: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
        <span class="badge">${responses.length} חלקים</span>
      </p>
    </div>
    <div class="content">
      <div class="toc">
        <div class="toc-title">📑 תוכן העניינים</div>
        ${responses.map((r: any, i: number) => 
          `<a href="#part-${i + 1}">${i + 1}. ${r.prompt_summary.replace(/^Q\d+:\s*/, '')}</a>`
        ).join('')}
      </div>
      
      ${responses.map((r: any, i: number) => `
        <div class="part" id="part-${i + 1}">
          <div class="part-title">חלק ${i + 1}: ${r.prompt_summary.replace(/^Q\d+:\s*/, '')}</div>
          ${r.response
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre>$2</pre>')
            .replace(/^#{1,6}\s+(.+)$/gm, '<h2>$1</h2>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/^\* (.+)$/gm, '<li>$1</li>')
            .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
            .replace(/\n\n/g, '</p><p>')
          }
        </div>
      `).join('')}
    </div>
    <div class="footer">
      <p>📧 מייל זה נשלח אוטומטית ממערכת JIY Content Studio</p>
      <p>המודל: Claude Sonnet 4 via OpenRouter | ${responses.length} חלקי דיאלוג</p>
    </div>
  </div>
</body>
</html>`;

    // Send email
    console.log("[Send Studio Summary] Sending email...");
    
    const emailResponse = await resend.emails.send({
      from: "JIY Studio <onboarding@resend.dev>",
      to: ["yossef@jiy.co.il"],
      subject: `🎨 ייעוץ מקיף לסטודיו התוכן - ${responses.length} חלקים`,
      html: emailHtml,
    });

    console.log("[Send Studio Summary] Email sent:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      emailSent: true,
      emailId: emailResponse?.data?.id,
      partsCount: responses.length,
      parts: responses.map((r: any) => r.prompt_summary),
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[Send Studio Summary] Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
