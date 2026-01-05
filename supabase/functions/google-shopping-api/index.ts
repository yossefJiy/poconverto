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

    const { action, clientId, feedId } = await req.json();

    switch (action) {
      case "sync_feed": {
        // Get feed details
        const { data: feed, error: feedError } = await supabase
          .from("product_feeds")
          .select("*")
          .eq("id", feedId)
          .single();

        if (feedError) throw feedError;

        // Simulate fetching products from feed URL
        // In production, this would actually fetch and parse the XML/JSON feed
        const mockProducts = Math.floor(Math.random() * 100) + 50;

        // Update feed with sync results
        await supabase
          .from("product_feeds")
          .update({
            last_sync_at: new Date().toISOString(),
            product_count: mockProducts,
            error_count: Math.floor(Math.random() * 5),
          })
          .eq("id", feedId);

        return new Response(
          JSON.stringify({
            success: true,
            productsProcessed: mockProducts,
            message: "Feed synced successfully",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_performance": {
        // Mock performance data
        const performance = {
          impressions: Math.floor(Math.random() * 100000) + 10000,
          clicks: Math.floor(Math.random() * 5000) + 500,
          conversions: Math.floor(Math.random() * 200) + 20,
          spend: Math.floor(Math.random() * 5000) + 1000,
          revenue: Math.floor(Math.random() * 20000) + 5000,
          roas: (Math.random() * 3 + 2).toFixed(2),
        };

        return new Response(
          JSON.stringify(performance),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_products": {
        // Mock product data
        const products = Array.from({ length: 10 }, (_, i) => ({
          id: `product-${i + 1}`,
          title: `מוצר ${i + 1}`,
          price: Math.floor(Math.random() * 500) + 50,
          availability: Math.random() > 0.1 ? "in_stock" : "out_of_stock",
          clicks: Math.floor(Math.random() * 100),
          impressions: Math.floor(Math.random() * 1000),
        }));

        return new Response(
          JSON.stringify({ products }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
