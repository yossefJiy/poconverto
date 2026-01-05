import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { clientId } = await req.json();

    // Fetch active budget rules
    const { data: rules, error: rulesError } = await supabase
      .from("budget_rules")
      .select("*")
      .eq("is_active", true)
      .eq("client_id", clientId);

    if (rulesError) throw rulesError;

    // Fetch ad placements
    const { data: placements, error: placementsError } = await supabase
      .from("ad_placements")
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "active");

    if (placementsError) throw placementsError;

    const optimizations: any[] = [];

    // Process each rule
    for (const rule of rules || []) {
      const conditions = rule.conditions as any[];
      const actions = rule.actions as any[];

      // Check if conditions are met (simplified logic)
      let conditionsMet = true;
      for (const condition of conditions) {
        // Add condition checking logic here
      }

      if (conditionsMet) {
        // Execute actions
        for (const action of actions) {
          if (action.type === "adjust_bid") {
            for (const placement of placements || []) {
              const newBid = (placement.bid_amount || 0) * (1 + (action.value / 100));
              
              await supabase
                .from("ad_placements")
                .update({ bid_amount: newBid })
                .eq("id", placement.id);

              optimizations.push({
                rule: rule.name,
                placement: placement.placement_name,
                action: `Bid adjusted by ${action.value}%`,
                newValue: newBid,
              });
            }
          }

          if (action.type === "pause_placement") {
            await supabase
              .from("ad_placements")
              .update({ status: "paused" })
              .eq("id", action.placementId);

            optimizations.push({
              rule: rule.name,
              action: "Placement paused",
              placementId: action.placementId,
            });
          }
        }

        // Update rule trigger count
        await supabase
          .from("budget_rules")
          .update({
            trigger_count: (rule.trigger_count || 0) + 1,
            last_triggered_at: new Date().toISOString(),
          })
          .eq("id", rule.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        optimizations,
        rulesProcessed: rules?.length || 0,
        placementsChecked: placements?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
