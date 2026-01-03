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
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  details?: Record<string, unknown>;
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

    // 1. Check for stale integrations (connected but not synced in 30 days)
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
        severity: "warning",
        title: `${staleIntegrations.length} אינטגרציות לא סונכרנו 30+ יום`,
        description: `אינטגרציות מחוברות שלא סונכרנו לאחרונה: ${staleIntegrations.map(i => i.platform).join(", ")}`,
        details: { integrations: staleIntegrations }
      });
    }

    // 2. Check for tasks without assigned client
    console.log("[Code Health Audit] Checking orphan tasks...");
    const { count: orphanTasksCount } = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .is("client_id", null);

    if (orphanTasksCount && orphanTasksCount > 10) {
      issues.push({
        category: "database",
        severity: "info",
        title: `${orphanTasksCount} משימות ללא לקוח משויך`,
        description: "ישנן משימות רבות במערכת שאינן משויכות ללקוח ספציפי",
        details: { count: orphanTasksCount }
      });
    }

    // 3. Check for failed notifications
    console.log("[Code Health Audit] Checking failed notifications...");
    const { count: failedCount } = await supabase
      .from("notification_history")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (failedCount && failedCount > 5) {
      issues.push({
        category: "performance",
        severity: "warning",
        title: `${failedCount} הודעות נכשלו ב-30 יום האחרונים`,
        description: "מספר גבוה של הודעות דוא\"ל או SMS שנכשלו בשליחה",
        details: { count: failedCount }
      });
    }

    // 4. Check service health
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
        severity: "critical",
        title: `${affectedServices.length} שירותים לא זמינים`,
        description: `שירותים שדווחו כלא זמינים: ${affectedServices.join(", ")}`,
        details: { services: affectedServices, issues: recentHealthIssues }
      });
    }

    // 5. Check for expired trusted devices that should be cleaned
    console.log("[Code Health Audit] Checking expired trusted devices...");
    const { count: expiredDevicesCount } = await supabase
      .from("trusted_devices")
      .select("id", { count: "exact", head: true })
      .lt("trusted_until", new Date().toISOString());

    if (expiredDevicesCount && expiredDevicesCount > 20) {
      issues.push({
        category: "security",
        severity: "info",
        title: `${expiredDevicesCount} מכשירים מהימנים פגי תוקף`,
        description: "יש לנקות מכשירים מהימנים שפג תוקפם לשיפור ביצועים",
        details: { count: expiredDevicesCount }
      });
    }

    // 6. Check for users without roles
    console.log("[Code Health Audit] Checking users without roles...");
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id");
    
    if (profiles) {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id");
      
      const usersWithRoles = new Set(userRoles?.map(ur => ur.user_id) || []);
      const usersWithoutRoles = profiles.filter(p => !usersWithRoles.has(p.id));
      
      if (usersWithoutRoles.length > 0) {
        issues.push({
          category: "security",
          severity: "warning",
          title: `${usersWithoutRoles.length} משתמשים ללא תפקיד מוגדר`,
          description: "משתמשים ללא תפקיד עלולים לגשת לנתונים ללא הרשאה מתאימה",
          details: { count: usersWithoutRoles.length }
        });
      }
    }

    // 7. Check for too many Edge Functions (complexity check)
    console.log("[Code Health Audit] Checking system complexity...");
    const edgeFunctionsCount = 35; // Based on our directory listing
    if (edgeFunctionsCount > 30) {
      issues.push({
        category: "code",
        severity: "info",
        title: `${edgeFunctionsCount} Edge Functions - שקול איחוד`,
        description: "מספר גבוה של Edge Functions. שקול לאחד פונקציות קשורות לשיפור תחזוקה",
        details: { 
          count: edgeFunctionsCount,
          recommendation: "Consider Modular Monolith or API Gateway pattern"
        }
      });
    }

    // 8. Check for duplicate integrations (same platform, same client)
    console.log("[Code Health Audit] Checking duplicate integrations...");
    const { data: allIntegrations } = await supabase
      .from("integrations")
      .select("id, platform, client_id, is_connected");
    
    if (allIntegrations) {
      const integrationGroups = new Map<string, any[]>();
      allIntegrations.forEach(i => {
        const key = `${i.client_id}-${i.platform}`;
        if (!integrationGroups.has(key)) {
          integrationGroups.set(key, []);
        }
        integrationGroups.get(key)!.push(i);
      });
      
      const duplicates = Array.from(integrationGroups.entries())
        .filter(([_, items]) => items.filter(i => i.is_connected).length > 1);
      
      // This is now expected behavior for multi-account support
      // Just log for awareness
      if (duplicates.length > 0) {
        console.log(`[Code Health Audit] Found ${duplicates.length} clients with multiple accounts (expected)`);
      }
    }

    // 9. Check for campaigns without activity
    console.log("[Code Health Audit] Checking inactive campaigns...");
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const { data: staleCampaigns } = await supabase
      .from("campaigns")
      .select("id, name, status")
      .eq("status", "active")
      .lt("updated_at", sixtyDaysAgo.toISOString());
    
    if (staleCampaigns && staleCampaigns.length > 0) {
      issues.push({
        category: "database",
        severity: "info",
        title: `${staleCampaigns.length} קמפיינים פעילים ללא עדכון 60+ יום`,
        description: "קמפיינים שסומנו כפעילים אך לא עודכנו זמן רב",
        details: { campaigns: staleCampaigns.map(c => c.name) }
      });
    }

    // 10. Check for token expiry (Facebook integrations)
    console.log("[Code Health Audit] Checking token expiry...");
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const { data: facebookIntegrations } = await supabase
      .from("integrations")
      .select("id, client_id, settings")
      .eq("platform", "facebook_ads")
      .eq("is_connected", true);
    
    if (facebookIntegrations) {
      const expiringTokens = facebookIntegrations.filter(i => {
        const settings = i.settings as { token_expires_at?: string } | null;
        if (settings?.token_expires_at) {
          const expiryDate = new Date(settings.token_expires_at);
          return expiryDate <= sevenDaysFromNow;
        }
        return false;
      });
      
      if (expiringTokens.length > 0) {
        issues.push({
          category: "security",
          severity: "warning",
          title: `${expiringTokens.length} טוקנים של Facebook עומדים לפוג`,
          description: "יש לחדש את הטוקנים לפני שיפוגו כדי לשמור על החיבור",
          details: { count: expiringTokens.length }
        });
      }
    }

    // 11. Check for large data tables
    console.log("[Code Health Audit] Checking table sizes...");
    const { count: notificationCount } = await supabase
      .from("notification_history")
      .select("id", { count: "exact", head: true });
    
    if (notificationCount && notificationCount > 10000) {
      issues.push({
        category: "performance",
        severity: "warning",
        title: `טבלת notification_history מכילה ${notificationCount.toLocaleString()} שורות`,
        description: "שקול לארכב הודעות ישנות לשיפור ביצועים",
        details: { count: notificationCount }
      });
    }

    const { count: healthHistoryCount } = await supabase
      .from("service_health_history")
      .select("id", { count: "exact", head: true });
    
    if (healthHistoryCount && healthHistoryCount > 50000) {
      issues.push({
        category: "performance",
        severity: "warning",
        title: `טבלת service_health_history מכילה ${healthHistoryCount.toLocaleString()} שורות`,
        description: "שקול לארכב רשומות ישנות לשיפור ביצועים",
        details: { count: healthHistoryCount }
      });
    }

    console.log(`[Code Health Audit] Found ${issues.length} issues`);
    
    // Insert new issues to database
    if (issues.length > 0) {
      const issuesToInsert = issues.map(issue => ({
        category: issue.category,
        severity: issue.severity,
        title: issue.title,
        description: issue.description,
        details: issue.details || {},
        detected_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from("code_health_issues")
        .insert(issuesToInsert);

      if (insertError) {
        console.error("[Code Health Audit] Error inserting issues:", insertError);
      }
    }

    // Count issues by severity
    const criticalCount = issues.filter(i => i.severity === "critical").length;
    const warningCount = issues.filter(i => i.severity === "warning").length;
    const infoCount = issues.filter(i => i.severity === "info").length;

    // Create report
    const { error: reportError } = await supabase
      .from("code_health_reports")
      .insert({
        report_date: new Date().toISOString().split('T')[0],
        total_issues: issues.length,
        critical_count: criticalCount,
        warning_count: warningCount,
        info_count: infoCount,
        issues_data: issues,
        email_sent: false
      });

    if (reportError) {
      console.error("[Code Health Audit] Error creating report:", reportError);
    }

    // Send email if there are critical issues or multiple warnings
    const shouldSendEmail = criticalCount > 0 || warningCount >= 3;
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "yossef@jiy.co.il";

    if (shouldSendEmail) {
      console.log("[Code Health Audit] Sending email report...");
      
      const issueRows = issues.map(issue => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px;">
            <span style="background: ${
              issue.severity === "critical" ? "#dc2626" :
              issue.severity === "warning" ? "#f59e0b" : "#3b82f6"
            }; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
              ${issue.severity === "critical" ? "קריטי" : issue.severity === "warning" ? "אזהרה" : "מידע"}
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
        subject: `[דוח בריאות מערכת] ${criticalCount} קריטי, ${warningCount} אזהרות`,
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
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🔍 דוח בריאות מערכת שבועי</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">סריקה אוטומטית - ${new Date().toLocaleDateString('he-IL')}</p>
              </div>
              <div class="content">
                <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                  <div style="background: #fef2f2; padding: 20px; border-radius: 12px; flex: 1; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold; color: #dc2626;">${criticalCount}</div>
                    <div>קריטי</div>
                  </div>
                  <div style="background: #fffbeb; padding: 20px; border-radius: 12px; flex: 1; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${warningCount}</div>
                    <div>אזהרות</div>
                  </div>
                  <div style="background: #eff6ff; padding: 20px; border-radius: 12px; flex: 1; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold; color: #3b82f6;">${infoCount}</div>
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
                  <strong>💡 המלצה:</strong> יש לטפל בבעיות הקריטיות בהקדם. ניתן לצפות ולנהל את כל הבעיות בדשבורד בריאות הקוד.
                </p>
              </div>
              <div class="footer">
                <p>הודעה זו נשלחה אוטומטית ממערכת JIY Dashboard</p>
                <p>📍 <a href="https://ovkuabbfubtiwnlksmxd.supabase.co/code-health" style="color: #8b5cf6;">צפה בדשבורד בריאות הקוד</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      // Update report that email was sent
      await supabase
        .from("code_health_reports")
        .update({ 
          email_sent: true, 
          email_sent_at: new Date().toISOString() 
        })
        .eq("report_date", new Date().toISOString().split('T')[0])
        .order("created_at", { ascending: false })
        .limit(1);

      console.log("[Code Health Audit] Email sent successfully");
    }

    return new Response(
      JSON.stringify({
        success: true,
        issues_found: issues.length,
        critical: criticalCount,
        warnings: warningCount,
        info: infoCount,
        email_sent: shouldSendEmail,
        issues
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Code Health Audit] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
