import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  to: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to }: TestEmailRequest = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ success: false, error: "Email address is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[test-email] Sending test email to: ${to}`);

    const emailResponse = await resend.emails.send({
      from: "Converto <tasks@converto.co.il>",
      to: [to],
      subject: "מייל בדיקה - Converto",
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 20px; margin: 0;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px;">✅ מייל בדיקה</h1>
            </div>
            <div style="padding: 24px; text-align: center;">
              <p style="font-size: 16px; color: #374151; margin: 0 0 16px;">
                אם אתה רואה את ההודעה הזו - המייל נשלח בהצלחה!
              </p>
              <p style="font-size: 14px; color: #6b7280; margin: 0;">
                נשלח בתאריך: ${new Date().toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}
              </p>
            </div>
            <div style="padding: 16px; background: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">Converto by JIY</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Check for Resend error
    if ((emailResponse as any)?.error) {
      const errorMessage = (emailResponse as any).error?.message || "Unknown Resend error";
      console.error("[test-email] Resend error:", (emailResponse as any).error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          details: (emailResponse as any).error 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[test-email] Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: (emailResponse as any).id,
        message: "מייל הבדיקה נשלח בהצלחה"
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[test-email] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
