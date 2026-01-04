import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-widget-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const widgetToken = req.headers.get("x-widget-token");
    
    if (!widgetToken) {
      console.error("Missing widget token");
      return new Response(
        JSON.stringify({ error: "Missing widget token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate token and get widget configuration
    const { data: tokenData, error: tokenError } = await supabase
      .from("client_agent_tokens")
      .select(`
        *,
        agent:ai_agents(*),
        client:clients(name, industry)
      `)
      .eq("token", widgetToken)
      .eq("is_active", true)
      .single();

    if (tokenError || !tokenData) {
      console.error("Invalid or inactive token:", tokenError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if token is expired
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      console.error("Token expired");
      return new Response(
        JSON.stringify({ error: "Token expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limits
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Simple rate limiting - increment usage count
    const { error: updateError } = await supabase
      .from("client_agent_tokens")
      .update({
        usage_count: (tokenData.usage_count || 0) + 1,
        last_used_at: now.toISOString(),
      })
      .eq("id", tokenData.id);

    if (updateError) {
      console.error("Failed to update usage count:", updateError);
    }

    // Check daily limit
    if (tokenData.rate_limit_per_day && tokenData.usage_count >= tokenData.rate_limit_per_day) {
      return new Response(
        JSON.stringify({ error: "Daily rate limit exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { message, sessionId, conversationHistory = [] } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build system prompt from agent settings
    const agent = tokenData.agent;
    const client = tokenData.client;
    
    const systemPrompt = `אתה ${agent?.name || "עוזר AI"} של ${client?.name || "הלקוח"}.
${agent?.description || ""}

תפקידך לעזור למבקרים באתר בצורה ידידותית ומקצועית.
ענה בעברית, בצורה תמציתית וברורה.
${client?.industry ? `התחום העסקי: ${client.industry}` : ""}

חשוב:
- היה אדיב ומקצועי
- ענה על שאלות בצורה ברורה ומדויקת
- אם אינך יודע את התשובה, הודה בכך והפנה לאנשי הקשר
- אל תמציא מידע`;

    // Call Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: "user", content: message },
    ];

    console.log("Calling Lovable AI with", messages.length, "messages");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service rate limited, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const responseContent = aiData.choices?.[0]?.message?.content || "מצטער, לא הצלחתי לעבד את הבקשה.";

    console.log("AI response received successfully");

    // Log conversation to widget_conversations (optional, for analytics)
    try {
      // Find or create conversation
      const { data: existingConv } = await supabase
        .from("widget_conversations")
        .select("id, messages")
        .eq("session_id", sessionId)
        .eq("is_active", true)
        .single();

      const newMessages = [
        ...(existingConv?.messages || []),
        { role: "user", content: message, timestamp: new Date().toISOString() },
        { role: "assistant", content: responseContent, timestamp: new Date().toISOString() },
      ];

      if (existingConv) {
        await supabase
          .from("widget_conversations")
          .update({ messages: newMessages })
          .eq("id", existingConv.id);
      } else {
        // Get widget_id from token
        const { data: widgetData } = await supabase
          .from("widget_configurations")
          .select("id")
          .eq("token_id", tokenData.id)
          .single();

        if (widgetData) {
          await supabase.from("widget_conversations").insert({
            widget_id: widgetData.id,
            session_id: sessionId,
            messages: newMessages,
            visitor_info: {
              user_agent: req.headers.get("user-agent"),
              origin: req.headers.get("origin"),
            },
          });
        }
      }
    } catch (convError) {
      console.error("Error logging conversation:", convError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({ 
        response: responseContent,
        sessionId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Widget chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
