import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceHealth {
  name: string;
  displayName: string;
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs: number;
  message?: string;
  version?: string;
}

interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: ServiceHealth[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

interface HealthHistoryRecord {
  service_name: string;
  status: string;
  checked_at: string;
}

// Admin email for alerts
const ADMIN_EMAIL = "yossef@jiy.co.il";

// Cooldown period in minutes to prevent alert spam
const ALERT_COOLDOWN_MINUTES = 15;

// Continuous failure threshold - only alert after service is down for this many minutes
const CONTINUOUS_FAILURE_THRESHOLD_MINUTES = 5;

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    console.log("[Health Monitor] Starting health check...");

    // Step 1: Get connected integrations to determine which services to monitor
    const { data: connectedIntegrations, error: integrationsError } = await supabase
      .from("integrations")
      .select("platform")
      .eq("is_connected", true);

    if (integrationsError) {
      console.error("[Health Monitor] Error fetching integrations:", integrationsError);
    }

    // Map platform names to service names
    const platformToServiceMap: Record<string, string> = {
      'shopify': 'shopify-api',
      'google_ads': 'google-ads',
      'google_analytics': 'google-analytics',
      'facebook_ads': 'facebook-ads',
      'woocommerce': 'woocommerce-api'
    };

    // Get list of connected service names
    const connectedServices = new Set<string>(
      (connectedIntegrations || [])
        .map(i => platformToServiceMap[i.platform])
        .filter(Boolean)
    );

    // System services are always monitored
    const systemServices = ['send-2fa-code', 'ai-marketing', 'generate-report'];
    systemServices.forEach(s => connectedServices.add(s));

    console.log("[Health Monitor] Services to monitor:", Array.from(connectedServices));

    // Step 2: Call the aggregate health-check endpoint
    const healthCheckUrl = `${supabaseUrl}/functions/v1/health-check`;
    const healthResponse = await fetch(healthCheckUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
    });

    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }

    const responseJson = await healthResponse.json();
    // The health-check function wraps response in { success: true, data: {...} }
    const healthData: HealthCheckResponse = responseJson.data || responseJson;
    
    if (!healthData || !healthData.services) {
      throw new Error("Invalid health check response: missing services");
    }
    
    console.log("[Health Monitor] Health check completed:", healthData.summary);

    // Step 2: Get the latest status for each service from the database
    const { data: previousStatuses, error: fetchError } = await supabase
      .from("service_health_history")
      .select("service_name, status, checked_at")
      .order("checked_at", { ascending: false });

    if (fetchError) {
      console.error("[Health Monitor] Error fetching previous statuses:", fetchError);
    }

    // Create a map of the latest status per service
    const latestStatusMap = new Map<string, HealthHistoryRecord>();
    if (previousStatuses) {
      for (const record of previousStatuses) {
        if (!latestStatusMap.has(record.service_name)) {
          latestStatusMap.set(record.service_name, record);
        }
      }
    }

    // Step 4: Get user monitoring preferences
    const { data: monitoringPrefs, error: prefsError } = await supabase
      .from("monitoring_preferences")
      .select("user_id, service_name, notify_on_down, notify_on_recovery");

    if (prefsError) {
      console.error("[Health Monitor] Error fetching monitoring preferences:", prefsError);
    }

    // Create a map of users who want alerts for each service
    const serviceAlertUsers = new Map<string, Set<string>>();
    if (monitoringPrefs) {
      for (const pref of monitoringPrefs) {
        if (pref.notify_on_down) {
          if (!serviceAlertUsers.has(pref.service_name)) {
            serviceAlertUsers.set(pref.service_name, new Set());
          }
          serviceAlertUsers.get(pref.service_name)!.add(pref.user_id);
        }
      }
    }

    // Step 5: Compare and detect changes - ONLY for connected services
    const alerts: { service: ServiceHealth; type: "down" | "recovered"; previousStatus?: string; downtime?: number }[] = [];
    const newRecords: { service_name: string; status: string; latency_ms: number; message: string | null; alert_sent: boolean }[] = [];

    for (const service of healthData.services) {
      const previousRecord = latestStatusMap.get(service.name);
      const previousStatus = previousRecord?.status || "healthy"; // Assume healthy if no previous record
      const currentStatus = service.status;

      // Prepare record for insertion (log all services)
      newRecords.push({
        service_name: service.name,
        status: currentStatus,
        latency_ms: service.latencyMs,
        message: service.message || null,
        alert_sent: false,
      });

      // Only alert for connected/monitored services
      if (!connectedServices.has(service.name)) {
        continue; // Skip alerting for unconnected services
      }

      // Check for status changes
      const wasHealthy = previousStatus === "healthy";
      const isHealthy = currentStatus === "healthy";

      if (wasHealthy && !isHealthy) {
        // Service went down - check if it's been down continuously for threshold period
        const isDownContinuously = await isServiceDownContinuously(
          supabase, 
          service.name, 
          CONTINUOUS_FAILURE_THRESHOLD_MINUTES
        );
        
        if (isDownContinuously) {
          alerts.push({ service, type: "down" });
          console.log(`[Health Monitor] ALERT: ${service.displayName} has been ${currentStatus} for ${CONTINUOUS_FAILURE_THRESHOLD_MINUTES}+ minutes`);
        } else {
          console.log(`[Health Monitor] ${service.displayName} is ${currentStatus} but hasn't reached ${CONTINUOUS_FAILURE_THRESHOLD_MINUTES} min threshold yet`);
        }
      } else if (!wasHealthy && isHealthy && previousRecord) {
        // Service recovered - calculate downtime
        const downtime = previousRecord.checked_at 
          ? Math.round((Date.now() - new Date(previousRecord.checked_at).getTime()) / 60000)
          : 0;
        alerts.push({ service, type: "recovered", previousStatus, downtime });
        console.log(`[Health Monitor] RECOVERY: ${service.displayName} is back online after ${downtime} minutes`);
      }
    }

    // Step 5: Insert new health records
    if (newRecords.length > 0) {
      const { error: insertError } = await supabase
        .from("service_health_history")
        .insert(newRecords);

      if (insertError) {
        console.error("[Health Monitor] Error inserting health records:", insertError);
      }
    }

    // Step 6: Send email alerts if there are status changes (only for connected services)
    if (alerts.length > 0 && resend) {
      // Check cooldown - get the most recent alert sent
      const { data: recentAlerts } = await supabase
        .from("service_health_history")
        .select("checked_at")
        .eq("alert_sent", true)
        .order("checked_at", { ascending: false })
        .limit(1);

      const lastAlertTime = recentAlerts?.[0]?.checked_at;
      const cooldownExpired = !lastAlertTime || 
        (Date.now() - new Date(lastAlertTime).getTime()) > ALERT_COOLDOWN_MINUTES * 60 * 1000;

      if (cooldownExpired) {
        await sendAlertEmail(resend, alerts, healthData.timestamp);

        // Mark alerts as sent
        await supabase
          .from("service_health_history")
          .update({ alert_sent: true })
          .in("service_name", alerts.map(a => a.service.name))
          .order("checked_at", { ascending: false })
          .limit(alerts.length);

        console.log(`[Health Monitor] Sent ${alerts.length} alert(s) for connected services`);
      } else {
        console.log("[Health Monitor] Skipping alerts - cooldown period not expired");
      }
    }

    // Step 7: Cleanup old records (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { error: cleanupError } = await supabase
      .from("service_health_history")
      .delete()
      .lt("checked_at", thirtyDaysAgo.toISOString());

    if (cleanupError) {
      console.error("[Health Monitor] Error cleaning up old records:", cleanupError);
    }

    const duration = Date.now() - startTime;
    console.log(`[Health Monitor] Completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: healthData.timestamp,
        summary: healthData.summary,
        alertsSent: alerts.length,
        duration,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("[Health Monitor] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

// Check if a service has been continuously down for the specified duration
async function isServiceDownContinuously(
  supabase: any,
  serviceName: string,
  thresholdMinutes: number
): Promise<boolean> {
  const thresholdTime = new Date(Date.now() - thresholdMinutes * 60 * 1000).toISOString();
  
  // Get all health records for this service in the threshold period
  const { data: records, error } = await supabase
    .from("service_health_history")
    .select("status, checked_at")
    .eq("service_name", serviceName)
    .gte("checked_at", thresholdTime)
    .order("checked_at", { ascending: false });

  if (error) {
    console.error(`[Health Monitor] Error checking continuous failure for ${serviceName}:`, error);
    return false; // Don't alert on error
  }

  // If no records in the threshold period, service might be newly unhealthy
  if (!records || records.length === 0) {
    return false;
  }

  // Need at least 2 records to confirm continuous failure (to avoid single-check alerts)
  if (records.length < 2) {
    return false;
  }

  // Check if ALL records in the period are unhealthy
  const allUnhealthy = records.every((r: any) => r.status !== "healthy");
  
  console.log(`[Health Monitor] ${serviceName}: ${records.length} records in last ${thresholdMinutes} min, all unhealthy: ${allUnhealthy}`);
  
  return allUnhealthy;
}

async function sendAlertEmail(
  resend: any,
  alerts: { service: ServiceHealth; type: "down" | "recovered"; previousStatus?: string; downtime?: number }[],
  timestamp: string
) {
  const downAlerts = alerts.filter(a => a.type === "down");
  const recoveryAlerts = alerts.filter(a => a.type === "recovered");

  // Generate HTML for down services
  const downServicesHtml = downAlerts.length > 0 ? `
    <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 15px 0;">
      <h3 style="color: #dc2626; margin: 0 0 10px 0;">⚠️ שירותים שנפלו</h3>
      ${downAlerts.map(a => `
        <div style="background: white; border-radius: 4px; padding: 10px; margin: 5px 0;">
          <strong>${a.service.displayName}</strong>
          <br><span style="color: ${a.service.status === 'unhealthy' ? '#dc2626' : '#f59e0b'};">
            סטטוס: ${a.service.status === 'unhealthy' ? 'לא זמין' : 'מופחת'}
          </span>
          ${a.service.message ? `<br><span style="color: #64748b; font-size: 12px;">${a.service.message}</span>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  // Generate HTML for recovered services
  const recoveryServicesHtml = recoveryAlerts.length > 0 ? `
    <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin: 15px 0;">
      <h3 style="color: #16a34a; margin: 0 0 10px 0;">✅ שירותים שחזרו לפעול</h3>
      ${recoveryAlerts.map(a => `
        <div style="background: white; border-radius: 4px; padding: 10px; margin: 5px 0;">
          <strong>${a.service.displayName}</strong>
          <br><span style="color: #16a34a;">חזר לפעול</span>
          ${a.downtime ? `<br><span style="color: #64748b; font-size: 12px;">משך התקלה: ${a.downtime} דקות</span>` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  const subject = downAlerts.length > 0 
    ? `🔴 התראת תקלה: ${downAlerts.length} שירות${downAlerts.length > 1 ? 'ים' : ''} לא זמין${downAlerts.length > 1 ? 'ים' : ''}`
    : `✅ שירותים חזרו לפעול: ${recoveryAlerts.length} שירות${recoveryAlerts.length > 1 ? 'ים' : ''}`;

  await resend.emails.send({
    from: "JIY Dashboard <onboarding@resend.dev>",
    to: [ADMIN_EMAIL],
    subject,
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; text-align: right; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
          .footer { background: #1e293b; color: #94a3b8; padding: 15px; border-radius: 0 0 10px 10px; font-size: 12px; }
          .timestamp { color: #64748b; font-size: 12px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔔 התראת מערכת</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">מערכת ניטור השירותים זיהתה שינוי</p>
          </div>
          <div class="content">
            ${downServicesHtml}
            ${recoveryServicesHtml}
            <p class="timestamp">
              זמן הבדיקה: ${new Date(timestamp).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
            </p>
            <p style="margin-top: 20px;">
              <a href="https://jiy-dashboard.lovable.app/status" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
                צפה בדף סטטוס
              </a>
            </p>
          </div>
          <div class="footer">
            <p>הודעה זו נשלחה אוטומטית ממערכת ניטור JIY Dashboard</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
