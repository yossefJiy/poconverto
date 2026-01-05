// KPI Alerts Edge Function
// Checks KPIs against thresholds and sends notifications

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrandKPI {
  id: string;
  client_id: string;
  name: string;
  current_value: number | null;
  target_value: number;
  threshold_warning: number | null;
  threshold_critical: number | null;
  status: string;
  category: string;
}

interface AlertConfig {
  clientId: string;
  kpiId?: string;
  checkAll?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const config: AlertConfig = await req.json();
    console.log('[kpi-alerts] Processing request:', config);

    // Build query
    let query = supabase
      .from('brand_kpis')
      .select('*')
      .eq('is_active', true);

    if (config.clientId) {
      query = query.eq('client_id', config.clientId);
    }

    if (config.kpiId) {
      query = query.eq('id', config.kpiId);
    }

    const { data: kpis, error: kpiError } = await query;

    if (kpiError) {
      console.error('[kpi-alerts] Error fetching KPIs:', kpiError);
      throw kpiError;
    }

    console.log(`[kpi-alerts] Found ${kpis?.length || 0} KPIs to check`);

    const alerts: Array<{
      kpi_id: string;
      kpi_name: string;
      alert_type: 'warning' | 'critical' | 'achieved';
      current_value: number;
      target_value: number;
      progress_percent: number;
      message: string;
    }> = [];

    for (const kpi of (kpis || []) as BrandKPI[]) {
      if (kpi.current_value === null) continue;

      const progress = (kpi.current_value / kpi.target_value) * 100;
      const warningThreshold = kpi.threshold_warning || 80;
      const criticalThreshold = kpi.threshold_critical || 60;

      let alertType: 'warning' | 'critical' | 'achieved' | null = null;
      let message = '';

      if (progress >= 100) {
        alertType = 'achieved';
        message = `🎉 יעד "${kpi.name}" הושג! הגעת ל-${progress.toFixed(1)}% מהיעד`;
      } else if (progress < criticalThreshold) {
        alertType = 'critical';
        message = `🚨 יעד "${kpi.name}" במצב קריטי - רק ${progress.toFixed(1)}% מהיעד הושג`;
      } else if (progress < warningThreshold) {
        alertType = 'warning';
        message = `⚠️ יעד "${kpi.name}" בסיכון - ${progress.toFixed(1)}% מהיעד הושג`;
      }

      if (alertType) {
        alerts.push({
          kpi_id: kpi.id,
          kpi_name: kpi.name,
          alert_type: alertType,
          current_value: kpi.current_value,
          target_value: kpi.target_value,
          progress_percent: progress,
          message,
        });

        // Log to activity_logs if it exists
        try {
          await supabase.from('activity_logs').insert({
            client_id: kpi.client_id,
            action_type: `kpi_alert_${alertType}`,
            description: message,
            metadata: {
              kpi_id: kpi.id,
              kpi_name: kpi.name,
              progress_percent: progress,
            },
          });
        } catch {
          // Table might not exist, ignore
        }
      }
    }

    console.log(`[kpi-alerts] Generated ${alerts.length} alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        alerts,
        checked_count: kpis?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[kpi-alerts] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
