import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  clientName: string;
  dashboardUrl: string;
  inviterName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, clientName, dashboardUrl, inviterName }: InvitationRequest = await req.json();

    console.log(`Sending invitation email to ${email} for client ${clientName}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "JIY Marketing <onboarding@resend.dev>",
        to: [email],
        subject: `הוזמנת לצפות בדשבורד של ${clientName}`,
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #1a1a1a; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; }
              .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .link-box { background: #f0f0f0; padding: 12px; border-radius: 6px; word-break: break-all; margin: 15px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>שלום! 👋</h1>
              <p>${inviterName ? `${inviterName} הזמין/ה אותך` : 'הוזמנת'} לצפות בדשבורד של <strong>${clientName}</strong>.</p>
              <p>לחץ על הכפתור למטה כדי לגשת לדשבורד:</p>
              <a href="${dashboardUrl}" class="button">כניסה לדשבורד</a>
              <p>או העתק את הקישור הבא:</p>
              <div class="link-box">${dashboardUrl}</div>
              <div class="footer">
                <p>אם לא ביקשת גישה זו, התעלם מהודעה זו.</p>
                <p>© JIY Marketing</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const data = await res.json();
    console.log("Email sent response:", data);

    if (!res.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
