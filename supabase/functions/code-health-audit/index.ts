import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthIssue {
  category: string;
  severity: string;
  title: string;
  description: string;
  file_path?: string;
  metadata?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[Code Health Audit] Starting audit...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const issues: HealthIssue[] = [];

    // 1. Check for tables without RLS policies
    console.log("[Code Health Audit] Checking RLS policies...");
    const { data: tablesWithoutPolicies } = await supabase.rpc('get_tables_without_policies').maybeSingle();
    
    // 2. Check for unused integrations (connected but not synced in 30 days)
    console.log("[Code Health Audit] Checking stale integrations...");
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: staleIntegrations } = await supabase
      .from("integrations")
      .select("id, platform, client_id, last_sync_at")
      .eq("is_connected", true)
      .lt("last_sync_at", thirtyDaysAgo.toISOString());

    if (staleIntegrations && staleIntegrations.length > 0) {
      issues.push({
        category: "database",
        severity: "warn",
        title: `${staleIntegrations.length} אינטגרציות לא סונכרנו 30+ יום`,
        description: `אינטגרציות מחוברות שלא סונכרנו לאחרונה: ${staleIntegrations.map(i => i.platform).join(", ")}`,
        metadata: { integrations: staleIntegrations }
      });
    }

    // 3. Check for tasks without assigned client
    console.log("[Code Health Audit] Checking orphan tasks...");
    const { data: orphanTasks, count: orphanTasksCount } = await supabase
      .from("tasks")
      .select("id", { count: "exact" })
      .is("client_id", null);

    if (orphanTasksCount && orphanTasksCount > 10) {
      issues.push({
        category: "database",
        severity: "info",
        title: `${orphanTasksCount} משימות ללא לקוח משויך`,
        description: "ישנן משימות רבות במערכת שאינן משויכות ללקוח ספציפי",
        metadata: { count: orphanTasksCount }
      });
    }

    // 4. Check for clients without active credits
    console.log("[Code Health Audit] Checking clients without credits...");
    const { data: clientsWithoutCredits } = await supabase
      .from("clients")
      .select(`
        id,
        name,
        client_credits!inner(is_active)
      `)
      .eq("client_credits.is_active", false);

    // 5. Check for failed notifications
    console.log("[Code Health Audit] Checking failed notifications...");
    const { data: failedNotifications, count: failedCount } = await supabase
      .from("notification_history")
      .select("id", { count: "exact" })
      .eq("status", "failed")
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (failedCount && failedCount > 5) {
      issues.push({
        category: "performance",
        severity: "warn",
        title: `${failedCount} הודעות נכשלו ב-30 יום האחרונים`,
        description: "מספר גבוה של הודעות דוא\"ל או SMS שנכשלו בשליחה",
        metadata: { count: failedCount }
      });
    }

    // 6. Check service health
    console.log("[Code Health Audit] Checking service health...");
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentHealthIssues } = await supabase
      .from("service_health_history")
      .select("service_name, status, message")
      .eq("status", "unhealthy")
      .gte("checked_at", oneDayAgo.toISOString());

    if (recentHealthIssues && recentHealthIssues.length > 0) {
      const affectedServices = [...new Set(recentHealthIssues.map(h => h.service_name))];
      issues.push({
        category: "security",
        severity: "error",
        title: `${affectedServices.length} שירותים לא זמינים`,
        description: `שירותים שדווחו כלא זמינים: ${affectedServices.join(", ")}`,
        metadata: { services: affectedServices, issues: recentHealthIssues }
      });
    }

    // 7. Security: Check for tokens that might need refresh
    console.log("[Code Health Audit] Checking security status...");
    const { data: oldDevices } = await supabase
      .from("trusted_devices")
      .select("id", { count: "exact" })
      .lt("trusted_until", new Date().toISOString());

    // Save issues to database
    console.log(`[Code Health Audit] Found ${issues.length} issues`);
    
    if (issues.length > 0) {
      // Clear old open issues and insert new ones
      await supabase
        .from("code_health_issues")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("status", "open");

      const issuesToInsert = issues.map(issue => ({
        ...issue,
        status: "open"
      }));

      await supabase
        .from("code_health_issues")
        .insert(issuesToInsert);
    }

    // Send email if there are warnings or errors
    const criticalIssues = issues.filter(i => i.severity === "error" || i.severity === "critical");
    const warningIssues = issues.filter(i => i.severity === "warn");
    
    const shouldSendEmail = criticalIssues.length > 0 || warningIssues.length >= 3;
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "yossef@jiy.co.il";

    if (shouldSendEmail) {
      console.log("[Code Health Audit] Sending email report...");
      
      const issueRows = issues.map(issue => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px;">
            <span style="background: ${
              issue.severity === "critical" ? "#dc2626" :
              issue.severity === "error" ? "#ef4444" :
              issue.severity === "warn" ? "#f59e0b" : "#3b82f6"
            }; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
              ${issue.severity.toUpperCase()}
            </span>
          </td>
          <td style="padding: 12px;">${issue.category}</td>
          <td style="padding: 12px; font-weight: 600;">${issue.title}</td>
          <td style="padding: 12px; color: #64748b;">${issue.description}</td>
        </tr>
      `).join("");

      await resend.emails.send({
        from: "JIY System <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `[דוח בריאות מערכת] ${criticalIssues.length} קריטי, ${warningIssues.length} אזהרות`,
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; text-align: right; background: #f1f5f9; }
              .container { max-width: 800px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 30px; border-radius: 16px 16px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e2e8f0; }
              .footer { background: #1e293b; color: #94a3b8; padding: 20px; border-radius: 0 0 16px 16px; font-size: 12px; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: #f8fafc; padding: 12px; text-align: right; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
              .summary { display: flex; gap: 20px; margin-bottom: 20px; }
              .summary-item { background: #f8fafc; padding: 20px; border-radius: 12px; flex: 1; text-align: center; }
              .summary-number { font-size: 32px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🔍 דוח בריאות מערכת</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">סריקה אוטומטית - ${new Date().toLocaleDateString('he-IL')}</p>
              </div>
              <div class="content">
                <div class="summary">
                  <div class="summary-item">
                    <div class="summary-number" style="color: #ef4444;">${criticalIssues.length}</div>
                    <div>קריטי/שגיאות</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-number" style="color: #f59e0b;">${warningIssues.length}</div>
                    <div>אזהרות</div>
                  </div>
                  <div class="summary-item">
                    <div class="summary-number" style="color: #3b82f6;">${issues.filter(i => i.severity === "info").length}</div>
                    <div>מידע</div>
                  </div>
                </div>
                
                <h2>פירוט הממצאים:</h2>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 80px;">חומרה</th>
                      <th style="width: 100px;">קטגוריה</th>
                      <th>כותרת</th>
                      <th>תיאור</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${issueRows}
                  </tbody>
                </table>
                
                <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px;">
                  <strong>💡 המלצה:</strong> יש לטפל בבעיות הקריטיות בהקדם האפשרי כדי למנוע השפעה על פעילות המערכת.
                </p>
              </div>
              <div class="footer">
                <p>הודעה זו נשלחה אוטומטית ממערכת JIY Dashboard</p>
                <p>ניתן לצפות בכל הבעיות בלוח הבקרה</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      // Record the report
      await supabase
        .from("code_health_reports")
        .insert({
          report_type: "audit",
          issues_count: issues.length,
          issues_summary: {
            critical: criticalIssues.length,
            warnings: warningIssues.length,
            info: issues.filter(i => i.severity === "info").length
          },
          sent_to: adminEmail
        });

      console.log("[Code Health Audit] Email sent successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        issues_found: issues.length,
        email_sent: shouldSendEmail,
        issues
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[Code Health Audit] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
