import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "yossef@jiy.co.il";

interface LeadNotificationRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  source?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, company, message, source }: LeadNotificationRequest = await req.json();

    console.log(`[Lead Notification] New lead from ${source}: ${name} (${email})`);

    const emailResponse = await resend.emails.send({
      from: "Converto <noreply@converto.co.il>",
      to: [ADMIN_EMAIL],
      subject: `🔔 ליד חדש מ-Converto: ${name}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; text-align: right; line-height: 1.6; background: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .logo-container { text-align: center; margin-bottom: 15px; }
            .logo { height: 40px; }
            .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
            .field { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #f1f5f9; }
            .field:last-child { border-bottom: none; margin-bottom: 0; }
            .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
            .value { color: #1e293b; font-size: 16px; }
            .footer { background: #1e293b; color: #94a3b8; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; }
            .footer-logo { height: 20px; margin-top: 10px; }
            .badge { display: inline-block; background: #8b5cf6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <img src="https://ovkuabbfubtiwnlksmxd.supabase.co/storage/v1/object/public/assets/converto-logo-white.png" alt="Converto" class="logo" onerror="this.style.display='none'">
              </div>
              <h1>🎉 ליד חדש!</h1>
              <span class="badge">${source || 'website'}</span>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">שם</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">מייל</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>
              ${phone ? `
              <div class="field">
                <div class="label">טלפון</div>
                <div class="value"><a href="tel:${phone}">${phone}</a></div>
              </div>
              ` : ''}
              ${company ? `
              <div class="field">
                <div class="label">חברה</div>
                <div class="value">${company}</div>
              </div>
              ` : ''}
              ${message ? `
              <div class="field">
                <div class="label">הודעה</div>
                <div class="value">${message}</div>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>התקבל דרך Converto</p>
              <p>${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</p>
              <img src="https://ovkuabbfubtiwnlksmxd.supabase.co/storage/v1/object/public/assets/by-jiy-logo.png" alt="by JIY" class="footer-logo" onerror="this.style.display='none'">
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[Lead Notification] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[Lead Notification] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
