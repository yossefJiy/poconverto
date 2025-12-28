import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TwoFactorRequest {
  email: string;
  action: "send" | "verify";
  code?: string;
}

// Generate a 6-digit numeric code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, action, code }: TwoFactorRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey && action === "send") {
      console.error("[2FA] RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "send") {
      // Generate new code
      const newCode = generateCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

      console.log(`[2FA] Generating code for email: ${email}`);

      // Store code in database (upsert to replace any existing code)
      const { error: dbError } = await supabase
        .from("two_factor_codes")
        .upsert({
          email: email.toLowerCase(),
          code: newCode,
          expires_at: expiresAt.toISOString(),
          attempts: 0,
        }, {
          onConflict: "email"
        });

      if (dbError) {
        console.error("[2FA] Database error:", dbError);
        return new Response(
          JSON.stringify({ error: "Failed to generate code" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send email with code using Resend API
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "JIY Marketing <onboarding@resend.dev>",
          to: [email],
          subject: "קוד אימות - מערכת ניהול שיווק",
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #333; text-align: center;">קוד אימות</h1>
              <p style="color: #666; text-align: center; font-size: 16px;">
                הקוד שלך לאימות דו-שלבי הוא:
              </p>
              <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">
                  ${newCode}
                </span>
              </div>
              <p style="color: #999; text-align: center; font-size: 14px;">
                קוד זה יפוג תוך 5 דקות. אם לא ביקשת קוד זה, התעלם מאימייל זה.
              </p>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.text();
        console.error("[2FA] Email sending failed:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to send email" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[2FA] Email sent successfully");

      return new Response(
        JSON.stringify({ success: true, message: "Code sent successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "verify") {
      if (!code) {
        return new Response(
          JSON.stringify({ error: "Code is required for verification" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[2FA] Verifying code for email: ${email}`);

      // Get stored code
      const { data: storedCode, error: fetchError } = await supabase
        .from("two_factor_codes")
        .select("*")
        .eq("email", email.toLowerCase())
        .single();

      if (fetchError || !storedCode) {
        console.error("[2FA] Code not found:", fetchError);
        return new Response(
          JSON.stringify({ valid: false, error: "No code found. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if code is expired
      if (new Date(storedCode.expires_at) < new Date()) {
        console.log("[2FA] Code expired");
        return new Response(
          JSON.stringify({ valid: false, error: "Code has expired. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check attempts (max 5)
      if (storedCode.attempts >= 5) {
        console.log("[2FA] Too many attempts");
        return new Response(
          JSON.stringify({ valid: false, error: "Too many attempts. Please request a new code." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify code
      if (storedCode.code !== code) {
        // Increment attempts
        await supabase
          .from("two_factor_codes")
          .update({ attempts: storedCode.attempts + 1 })
          .eq("email", email.toLowerCase());

        console.log("[2FA] Invalid code");
        return new Response(
          JSON.stringify({ valid: false, error: "Invalid code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Code is valid - delete it
      await supabase
        .from("two_factor_codes")
        .delete()
        .eq("email", email.toLowerCase());

      console.log("[2FA] Code verified successfully");

      return new Response(
        JSON.stringify({ valid: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[2FA] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
