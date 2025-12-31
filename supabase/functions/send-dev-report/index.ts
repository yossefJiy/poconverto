import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { validateAuth, unauthorizedResponse } from "../_shared/auth.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DevReportRequest {
  reportTitle: string;
  reportContent: string;
  fixedIssues: string[];
  remainingIssues: string[];
  cleanedFiles: string[];
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }

    const { 
      reportTitle, 
      reportContent, 
      fixedIssues, 
      remainingIssues, 
      cleanedFiles,
      timestamp 
    }: DevReportRequest = await req.json();

    console.log(`[Dev Report] Sending report: ${reportTitle}`);

    const adminEmail = "yossef@jiy.co.il";

    const emailResponse = await resend.emails.send({
      from: "JIY Dashboard <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `📊 דוח פיתוח - ${reportTitle}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; text-align: right; background: #f8fafc; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 25px; border-radius: 12px 12px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: white; padding: 25px; border: 1px solid #e2e8f0; }
            .section { margin-bottom: 25px; }
            .section-title { color: #1e293b; font-size: 18px; font-weight: bold; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
            .success-list { background: #dcfce7; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; }
            .warning-list { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; }
            .info-list { background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; }
            ul { margin: 0; padding-right: 20px; }
            li { margin-bottom: 8px; line-height: 1.6; }
            .footer { background: #1e293b; color: #94a3b8; padding: 15px; border-radius: 0 0 12px 12px; font-size: 12px; text-align: center; }
            .timestamp { color: #64748b; font-size: 14px; margin-top: 10px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-left: 8px; }
            .badge-success { background: #22c55e; color: white; }
            .badge-warning { background: #f59e0b; color: white; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 ${reportTitle}</h1>
              <p class="timestamp">נוצר ב: ${new Date(timestamp).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</p>
            </div>
            <div class="content">
              ${reportContent ? `
              <div class="section">
                <div class="section-title">📝 סיכום</div>
                <p>${reportContent}</p>
              </div>
              ` : ''}
              
              ${fixedIssues.length > 0 ? `
              <div class="section">
                <div class="section-title">✅ בעיות שתוקנו <span class="badge badge-success">${fixedIssues.length}</span></div>
                <div class="success-list">
                  <ul>
                    ${fixedIssues.map(issue => `<li>${issue}</li>`).join('')}
                  </ul>
                </div>
              </div>
              ` : ''}
              
              ${cleanedFiles.length > 0 ? `
              <div class="section">
                <div class="section-title">🧹 קבצים שנוקו/נמחקו</div>
                <div class="info-list">
                  <ul>
                    ${cleanedFiles.map(file => `<li><code>${file}</code></li>`).join('')}
                  </ul>
                </div>
              </div>
              ` : ''}
              
              ${remainingIssues.length > 0 ? `
              <div class="section">
                <div class="section-title">⚠️ בעיות נותרות <span class="badge badge-warning">${remainingIssues.length}</span></div>
                <div class="warning-list">
                  <ul>
                    ${remainingIssues.map(issue => `<li>${issue}</li>`).join('')}
                  </ul>
                </div>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>דוח זה נשלח אוטומטית ממערכת JIY Dashboard</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[Dev Report] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[Dev Report] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
