import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { validateAuth, unauthorizedResponse } from "../_shared/auth.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminAlertRequest {
  issue: string;
  context: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication - only authenticated users can send admin alerts
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      console.error("[Admin Alert] Unauthorized request:", auth.error);
      return unauthorizedResponse(auth.error);
    }

    console.log("[Admin Alert] Authenticated user:", auth.user?.id);

    const { issue, context, timestamp }: AdminAlertRequest = await req.json();

    console.log(`[Admin Alert] Issue: ${issue}, Context: ${context}`);

    // Admin email - update this to the actual admin email
    const adminEmail = "yossef@jiy.co.il";

    const emailResponse = await resend.emails.send({
      from: "JIY Dashboard <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `[פעולה נדרשת] ${context}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; text-align: right; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
            .issue { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 15px 0; }
            .footer { background: #1e293b; color: #94a3b8; padding: 15px; border-radius: 0 0 10px 10px; font-size: 12px; }
            .timestamp { color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🔔 התראת מערכת</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${context}</p>
            </div>
            <div class="content">
              <h2>פרטי הבעיה:</h2>
              <div class="issue">
                <p style="margin: 0;">${issue}</p>
              </div>
              <p class="timestamp">זמן הדיווח: ${new Date(timestamp).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</p>
              
              <h3>פעולות מומלצות:</h3>
              <ul>
                <li>בדוק את הרשאות ה-Shopify Access Token</li>
                <li>וודא שיש הרשאת <code>read_reports</code></li>
                <li>עדכן את ה-Token בהגדרות המערכת</li>
              </ul>
            </div>
            <div class="footer">
              <p>הודעה זו נשלחה אוטומטית ממערכת JIY Dashboard</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[Admin Alert] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("[Admin Alert] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
