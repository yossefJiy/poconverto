import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrustedDeviceRequest {
  email: string;
  device_fingerprint: string;
  action: 'check' | 'add';
}

const TRUST_DURATION_DAYS = 30;

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, device_fingerprint, action } = await req.json() as TrustedDeviceRequest;

    if (!email || !device_fingerprint) {
      return new Response(
        JSON.stringify({ error: 'Missing email or device_fingerprint' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (action === 'check') {
      // Check if device is trusted and not expired
      const { data, error } = await supabase
        .from('trusted_devices')
        .select('id, trusted_until')
        .eq('email', email)
        .eq('device_fingerprint', device_fingerprint)
        .gte('trusted_until', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('[TrustedDevice] Check error:', error);
        return new Response(
          JSON.stringify({ trusted: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (data) {
        // Update last_used_at
        await supabase
          .from('trusted_devices')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', data.id);

        console.log('[TrustedDevice] Device is trusted for:', email);
        return new Response(
          JSON.stringify({ trusted: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[TrustedDevice] Device not trusted for:', email);
      return new Response(
        JSON.stringify({ trusted: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'add') {
      const trustedUntil = new Date();
      trustedUntil.setDate(trustedUntil.getDate() + TRUST_DURATION_DAYS);

      // Upsert trusted device
      const { error } = await supabase
        .from('trusted_devices')
        .upsert({
          email,
          device_fingerprint,
          trusted_until: trustedUntil.toISOString(),
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'email,device_fingerprint',
        });

      if (error) {
        console.error('[TrustedDevice] Add error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to add trusted device' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[TrustedDevice] Device added as trusted for:', email, 'until:', trustedUntil.toISOString());
      return new Response(
        JSON.stringify({ success: true, trusted_until: trustedUntil.toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[TrustedDevice] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
