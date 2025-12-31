import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assignee: string | null;
  department: string | null;
  category: string | null;
  reminder_at: string;
  notification_email: boolean;
  notification_sms: boolean;
  notification_phone: string | null;
  notification_email_address: string | null;
  client_id: string | null;
}

interface Client {
  id: string;
  name: string;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const extraApiToken = Deno.env.get("EXTRA_API_TOKEN");

// Helper function to log notification to history
async function logNotification(
  supabase: any,
  taskId: string,
  clientId: string | null,
  type: 'email' | 'sms',
  recipient: string,
  status: 'sent' | 'failed',
  subject?: string,
  message?: string,
  errorMessage?: string
) {
  const { error } = await supabase
    .from("notification_history")
    .insert({
      task_id: taskId,
      client_id: clientId,
      notification_type: type,
      recipient,
      status,
      subject,
      message,
      error_message: errorMessage,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    });

  if (error) {
    console.error(`[task-reminder] Failed to log ${type} notification:`, error);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[task-reminder] Starting reminder check...");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a test request
    let testMode = false;
    let testTaskId: string | null = null;
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        testMode = body.test === true;
        testTaskId = body.taskId || null;
        console.log("[task-reminder] Test mode:", testMode, "Task ID:", testTaskId);
      } catch (e) {
        // Not a JSON body, continue normally
      }
    }

    let tasks;
    let tasksError;

    if (testMode && testTaskId) {
      // Fetch specific task for testing (ignore reminder_sent flag)
      const result = await supabase
        .from("tasks")
        .select("*, clients(name)")
        .eq("id", testTaskId)
        .maybeSingle();
      
      tasks = result.data ? [result.data] : [];
      tasksError = result.error;
    } else {
      // Get tasks that need reminders (reminder_at has passed and not yet sent)
      const now = new Date().toISOString();
      const result = await supabase
        .from("tasks")
        .select("*, clients(name)")
        .lte("reminder_at", now)
        .eq("reminder_sent", false)
        .not("reminder_at", "is", null);
      
      tasks = result.data;
      tasksError = result.error;
    }

    if (tasksError) {
      console.error("[task-reminder] Error fetching tasks:", tasksError);
      throw tasksError;
    }

    console.log(`[task-reminder] Found ${tasks?.length || 0} tasks needing reminders`);

    const results = {
      processed: 0,
      emailsSent: 0,
      smsSent: 0,
      errors: [] as string[],
    };

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No pending reminders", results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process each task
    for (const task of tasks) {
      console.log(`[task-reminder] Processing task: ${task.id} - ${task.title}`);

      try {
        const clientName = task.clients?.name || "לא משויך ללקוח";
        const priorityMap: Record<string, string> = {
          low: "נמוכה",
          medium: "בינונית",
          high: "גבוהה",
        };
        const priorityHebrew = priorityMap[task.priority as string] || task.priority;

        const statusMap: Record<string, string> = {
          pending: "ממתין",
          "in-progress": "בתהליך",
          completed: "הושלם",
        };
        const statusHebrew = statusMap[task.status as string] || task.status;

        // Send email if enabled
        if (task.notification_email && task.notification_email_address && resendApiKey) {
          const resend = new Resend(resendApiKey);
          const emailSubject = `⏰ תזכורת: ${task.title}`;
          
          const emailHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">⏰ תזכורת משימה</h2>
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px;">
                <h3 style="margin: 0 0 10px 0;">${task.title}</h3>
                ${task.description ? `<p style="color: #6B7280; margin: 0 0 15px 0;">${task.description}</p>` : ""}
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>לקוח:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">${clientName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>סטטוס:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">${statusHebrew}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>עדיפות:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">${priorityHebrew}</td>
                  </tr>
                  ${task.due_date ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>תאריך יעד:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">${new Date(task.due_date).toLocaleDateString("he-IL")}</td>
                  </tr>
                  ` : ""}
                  ${task.assignee ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"><strong>אחראי:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">${task.assignee}</td>
                  </tr>
                  ` : ""}
                  ${task.category ? `
                  <tr>
                    <td style="padding: 8px 0;"><strong>קטגוריה:</strong></td>
                    <td style="padding: 8px 0;">${task.category}</td>
                  </tr>
                  ` : ""}
                </table>
              </div>
              <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">
                הודעה זו נשלחה אוטומטית ממערכת JIY Tasks
              </p>
            </div>
          `;

          const { error: emailError } = await resend.emails.send({
            from: "Converto <reminders@converto.co.il>",
            to: [task.notification_email_address],
            subject: emailSubject,
            html: emailHtml,
          });

          if (emailError) {
            console.error(`[task-reminder] Email error for task ${task.id}:`, emailError);
            results.errors.push(`Email error for ${task.id}: ${emailError.message}`);
            await logNotification(
              supabase,
              task.id,
              task.client_id,
              'email',
              task.notification_email_address,
              'failed',
              emailSubject,
              emailHtml,
              emailError.message
            );
          } else {
            console.log(`[task-reminder] Email sent for task ${task.id} to ${task.notification_email_address}`);
            results.emailsSent++;
            await logNotification(
              supabase,
              task.id,
              task.client_id,
              'email',
              task.notification_email_address,
              'sent',
              emailSubject,
              emailHtml
            );
          }
        }

        // Send SMS if enabled
        if (task.notification_sms && task.notification_phone && extraApiToken) {
          const smsMessage = `תזכורת משימה: ${task.title}\nלקוח: ${clientName}\nעדיפות: ${priorityHebrew}`;
          
          // Format phone number for Israeli format
          let phone = task.notification_phone.replace(/\D/g, "");
          if (phone.startsWith("0")) {
            phone = "972" + phone.substring(1);
          } else if (!phone.startsWith("972")) {
            phone = "972" + phone;
          }

          const smsResponse = await fetch("https://www.exm.co.il/api/v1/sms/send/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${extraApiToken}`,
            },
            body: JSON.stringify({
              message: smsMessage,
              destination: phone,
              sender: "JIY",
            }),
          });

          if (!smsResponse.ok) {
            const smsError = await smsResponse.text();
            console.error(`[task-reminder] SMS error for task ${task.id}:`, smsError);
            results.errors.push(`SMS error for ${task.id}: ${smsError}`);
            await logNotification(
              supabase,
              task.id,
              task.client_id,
              'sms',
              task.notification_phone,
              'failed',
              undefined,
              smsMessage,
              smsError
            );
          } else {
            console.log(`[task-reminder] SMS sent for task ${task.id} to ${task.notification_phone}`);
            results.smsSent++;
            await logNotification(
              supabase,
              task.id,
              task.client_id,
              'sms',
              task.notification_phone,
              'sent',
              undefined,
              smsMessage
            );
          }
        }

        // Mark reminder as sent (skip in test mode to allow retesting)
        if (!testMode) {
          const { error: updateError } = await supabase
            .from("tasks")
            .update({ reminder_sent: true })
            .eq("id", task.id);

          if (updateError) {
            console.error(`[task-reminder] Error updating task ${task.id}:`, updateError);
            results.errors.push(`Update error for ${task.id}: ${updateError.message}`);
          } else {
            results.processed++;
          }
        } else {
          results.processed++;
        }
      } catch (taskError) {
        console.error(`[task-reminder] Error processing task ${task.id}:`, taskError);
        results.errors.push(`Processing error for ${task.id}: ${String(taskError)}`);
      }
    }

    console.log("[task-reminder] Reminder check complete:", results);

    return new Response(
      JSON.stringify({ success: true, results, testMode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[task-reminder] Fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
