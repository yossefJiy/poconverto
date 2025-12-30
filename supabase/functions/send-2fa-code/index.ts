import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { healthCheckResponse, checkEnvVars, createLogger } from "../_shared/utils.ts";
import { SERVICE_VERSIONS, REQUIRED_ENV_VARS } from "../_shared/constants.ts";

const log = createLogger('2FA');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TwoFactorRequest {
  email?: string;
  phone?: string; // User's phone number for SMS
  action: "send" | "verify" | "health";
  code?: string;
}

// Generate a 6-digit numeric code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send SMS via Extra API
async function sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  const extraApiToken = Deno.env.get("EXTRA_API_TOKEN");
  const sender = "ExtraMobile"; // Verified sender name
  
  if (!extraApiToken) {
    console.log("[2FA-SMS] Extra API token not configured");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const response = await fetch("https://www.exm.co.il/api/v1/sms/send/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${extraApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        destination: to,
        sender,
      }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      const errorMessage = data.errors?.[0]?.description || "Failed to send SMS";
      console.error("[2FA-SMS] Error:", errorMessage);
      return { success: false, error: errorMessage };
    }

    console.log("[2FA-SMS] SMS sent successfully:", data.id);
    return { success: true };
  } catch (error: any) {
    console.error("[2FA-SMS] Exception:", error);
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, phone, action, code }: TwoFactorRequest = body;

    // Health check endpoint - no auth required
    if (action === 'health') {
      const envCheck = checkEnvVars(REQUIRED_ENV_VARS.RESEND);
      return healthCheckResponse('send-2fa-code', SERVICE_VERSIONS.SEND_2FA_CODE, [envCheck]);
    }

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if SMS is available (preferred) or fall back to email
    const extraApiToken = Deno.env.get("EXTRA_API_TOKEN");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!extraApiToken && !resendApiKey && action === "send") {
      console.error("[2FA] No messaging service configured (SMS or Email)");
      return new Response(
        JSON.stringify({ error: "Messaging service not configured" }),
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

      let sendMethod = "email";
      let sendSuccess = false;
      let sendError = "";

      // Try SMS first if phone is provided and SMS is configured
      if (phone && extraApiToken) {
        console.log(`[2FA] Sending code via SMS to: ${phone}`);
        const smsResult = await sendSMS(phone, `קוד האימות שלך: ${newCode}\nתוקף: 5 דקות`);
        if (smsResult.success) {
          sendSuccess = true;
          sendMethod = "sms";
        } else {
          console.log(`[2FA] SMS failed, will try email: ${smsResult.error}`);
          sendError = smsResult.error || "";
        }
      }

      // Fall back to email if SMS wasn't sent or failed
      if (!sendSuccess && resendApiKey) {
        console.log(`[2FA] Sending code via email to: ${email}`);
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

        if (emailResponse.ok) {
          sendSuccess = true;
          sendMethod = "email";
        } else {
          const errorData = await emailResponse.text();
          console.error("[2FA] Email sending failed:", errorData);
          sendError = "Failed to send email";
        }
      }

      if (!sendSuccess) {
        return new Response(
          JSON.stringify({ error: sendError || "Failed to send code" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[2FA] Code sent successfully via ${sendMethod}`);

      return new Response(
        JSON.stringify({ success: true, message: "Code sent successfully", method: sendMethod }),
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

      // Helper to format time in Hebrew
      const formatTimeAgo = (dateStr: string): string => {
        const created = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        
        if (diffMin < 1) return `לפני ${diffSec} שניות`;
        if (diffMin === 1) return "לפני דקה";
        return `לפני ${diffMin} דקות`;
      };

      const codeCreatedAt = storedCode.created_at;
      const timeAgoText = formatTimeAgo(codeCreatedAt);
      const createdDate = new Date(codeCreatedAt);
      const formattedTime = createdDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Check if code is expired
      if (new Date(storedCode.expires_at) < new Date()) {
        console.log("[2FA] Code expired, created at:", codeCreatedAt);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: `הקוד פג תוקף. הקוד נוצר ${timeAgoText} (${formattedTime}). בקש קוד חדש.`,
            code_created_at: codeCreatedAt,
            code_created_ago: timeAgoText
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check attempts (max 5)
      if (storedCode.attempts >= 5) {
        console.log("[2FA] Too many attempts, code created at:", codeCreatedAt);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: `יותר מדי נסיונות. הקוד נוצר ${timeAgoText} (${formattedTime}). בקש קוד חדש.`,
            code_created_at: codeCreatedAt,
            code_created_ago: timeAgoText,
            attempts: storedCode.attempts
          }),
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

        const remainingAttempts = 5 - (storedCode.attempts + 1);
        console.log("[2FA] Invalid code, created at:", codeCreatedAt, "remaining attempts:", remainingAttempts);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            error: `קוד שגוי. הקוד נוצר ${timeAgoText} (${formattedTime}). נותרו ${remainingAttempts} נסיונות.`,
            code_created_at: codeCreatedAt,
            code_created_ago: timeAgoText,
            remaining_attempts: remainingAttempts
          }),
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
