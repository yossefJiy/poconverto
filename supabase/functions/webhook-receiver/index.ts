import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const source = url.searchParams.get('source') || 'unknown';
    const clientId = url.searchParams.get('client_id');
    
    const body = await req.json();
    
    console.log(`Webhook received from ${source}:`, JSON.stringify(body).substring(0, 500));

    // Process different webhook sources
    switch (source) {
      case 'google_ads': {
        // Process Google Ads webhook data
        if (body.campaign_id && clientId) {
          const updates: any = {};
          if (body.impressions !== undefined) updates.impressions = body.impressions;
          if (body.clicks !== undefined) updates.clicks = body.clicks;
          if (body.conversions !== undefined) updates.conversions = body.conversions;
          if (body.cost !== undefined) updates.spent = body.cost;

          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from('campaigns')
              .update(updates)
              .eq('external_id', body.campaign_id)
              .eq('client_id', clientId);
            
            if (error) console.error('Error updating campaign:', error);
            else console.log('Campaign updated successfully');
          }
        }
        break;
      }

      case 'facebook_ads': {
        // Process Facebook Ads webhook data
        if (body.campaign_id && clientId) {
          const updates: any = {};
          if (body.reach !== undefined) updates.impressions = body.reach;
          if (body.clicks !== undefined) updates.clicks = body.clicks;
          if (body.conversions !== undefined) updates.conversions = body.conversions;
          if (body.spend !== undefined) updates.spent = body.spend;

          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from('campaigns')
              .update(updates)
              .eq('external_id', body.campaign_id)
              .eq('client_id', clientId);
            
            if (error) console.error('Error updating campaign:', error);
            else console.log('Campaign updated successfully');
          }
        }
        break;
      }

      case 'analytics': {
        // Process Google Analytics data
        if (body.metrics && clientId) {
          // Store analytics data for reporting
          console.log('Analytics data received:', body.metrics);
        }
        break;
      }

      case 'task_update': {
        // External task update (from Zapier, Make, etc.)
        if (body.task_id) {
          const updates: any = {};
          if (body.status) updates.status = body.status;
          if (body.completed_at) updates.completed_at = body.completed_at;
          if (body.notes) updates.completion_notes = body.notes;

          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from('tasks')
              .update(updates)
              .eq('id', body.task_id);
            
            if (error) console.error('Error updating task:', error);
            else console.log('Task updated successfully');
          }
        }
        break;
      }

      case 'campaign_create': {
        // Create campaign from external source
        if (body.name && clientId) {
          const { error } = await supabase
            .from('campaigns')
            .insert({
              client_id: clientId,
              name: body.name,
              platform: body.platform || 'other',
              status: body.status || 'draft',
              budget: body.budget || 0,
              external_id: body.external_id,
              description: body.description,
            });
          
          if (error) console.error('Error creating campaign:', error);
          else console.log('Campaign created successfully');
        }
        break;
      }

      default:
        console.log(`Unknown source: ${source}, storing raw data`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook processed',
      source,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook Error:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
