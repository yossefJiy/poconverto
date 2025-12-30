import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  to: string;         // destination phone number
  message: string;    // SMS body
  sender?: string;    // sender identity (optional, uses default from settings)
}

interface ExtraAPIResponse {
  success: boolean;
  id?: string;
  messages_count?: {
    sent: number;
    charged: number;
  };
  errors?: Array<{
    id: string;
    code: string;
    description: string;
  }>;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const extraApiToken = Deno.env.get("EXTRA_API_TOKEN");
    const defaultSender = "ExtraMobile"; // Verified sender name

    // Check if SMS is configured
    if (!extraApiToken) {
      console.log("[SMS] Extra API token not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "SMS service not configured",
          configured: false 
        }),
        {
          status: 200, // Return 200 to indicate service is reachable but not configured
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { to, message, sender }: SMSRequest = await req.json();

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, message" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`[SMS] Sending SMS to ${to} via Extra API`);

    // Send SMS via Extra API
    // API: POST https://www.exm.co.il/api/v1/sms/send/
    const extraResponse = await fetch("https://www.exm.co.il/api/v1/sms/send/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${extraApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        destination: to,
        sender: sender || defaultSender,
      }),
    });

    const extraData: ExtraAPIResponse = await extraResponse.json();

    if (!extraResponse.ok || !extraData.success) {
      console.error("[SMS] Extra API error:", extraData);
      const errorMessage = extraData.errors?.[0]?.description || "Failed to send SMS";
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          details: extraData.errors 
        }),
        {
          status: extraResponse.status >= 400 ? extraResponse.status : 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("[SMS] SMS sent successfully:", extraData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: extraData.id,
        messagesCount: extraData.messages_count,
        configured: true 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("[SMS] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
