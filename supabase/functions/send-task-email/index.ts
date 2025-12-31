import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TaskEmailRequest {
  to: string;
  tasks: Array<{
    title: string;
    description?: string;
    status: string;
    priority: string;
    due_date?: string;
  }>;
  message?: string;
  clientId: string;
}

const statusLabels: Record<string, string> = {
  pending: "ממתין",
  "in-progress": "בתהליך",
  completed: "הושלם",
};

const priorityLabels: Record<string, string> = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
};

const priorityColors: Record<string, string> = {
  low: "#6b7280",
  medium: "#f59e0b",
  high: "#ef4444",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client for logging
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.49.9");
  const supabase = createClient(supabaseUrl, supabaseKey);

  let to = "";
  let clientId = "";
  let taskId: string | null = null;

  try {
    const body: TaskEmailRequest = await req.json();
    to = body.to;
    clientId = body.clientId;
    const tasks = body.tasks;
    const message = body.message;

    // Get first task id for logging
    if (tasks.length > 0) {
      taskId = (tasks[0] as any).id || null;
    }

    console.log(`[send-task-email] Sending to ${to} with ${tasks.length} tasks`);

    const tasksHtml = tasks
      .map(
        (task) => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: #f9fafb;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; color: #111827;">${task.title}</h3>
          <span style="background: ${priorityColors[task.priority] || "#6b7280"}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
            ${priorityLabels[task.priority] || task.priority}
          </span>
        </div>
        ${task.description ? `<p style="margin: 8px 0; color: #6b7280; font-size: 14px;">${task.description}</p>` : ""}
        <div style="display: flex; gap: 16px; font-size: 13px; color: #6b7280;">
          <span>סטטוס: <strong>${statusLabels[task.status] || task.status}</strong></span>
          ${task.due_date ? `<span>תאריך יעד: <strong>${new Date(task.due_date).toLocaleDateString("he-IL")}</strong></span>` : ""}
        </div>
      </div>
    `
      )
      .join("");

    const emailResponse = await resend.emails.send({
      from: "Converto <tasks@converto.co.il>",
      to: [to],
      subject: `משימות חדשות עבורך (${tasks.length})`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px; text-align: center;">
              <img src="https://ovkuabbfubtiwnlksmxd.supabase.co/storage/v1/object/public/assets/converto-logo-white.png" alt="Converto" style="height: 40px; margin-bottom: 15px;" onerror="this.style.display='none'">
              <h1 style="margin: 0; color: white; font-size: 24px;">משימות חדשות</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                ${tasks.length} משימות שותפו איתך
              </p>
            </div>
            
            <div style="padding: 24px;">
              ${message ? `
                <div style="background: #eff6ff; border-right: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
                  <p style="margin: 0; color: #1e40af; font-size: 14px;">${message}</p>
                </div>
              ` : ""}
              
              ${tasksHtml}
              
              <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 12px;">
                  נשלח מ-Converto Task Management
                </p>
                <img src="https://ovkuabbfubtiwnlksmxd.supabase.co/storage/v1/object/public/assets/by-jiy-logo.png" alt="by JIY" style="height: 18px;" onerror="this.style.display='none'">
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if ((emailResponse as any)?.error) {
      const errorMessage = (emailResponse as any).error?.message ?? "Resend error";
      console.error("[send-task-email] Resend error:", (emailResponse as any).error);

      // Log failure to notification_history
      await supabase.from("notification_history").insert({
        notification_type: "email",
        recipient: to,
        subject: `משימות חדשות (${tasks.length})`,
        message: message || null,
        status: "failed",
        error_message: errorMessage,
        client_id: clientId || null,
        task_id: taskId,
        metadata: { tasks_count: tasks.length, error: (emailResponse as any).error },
      });

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("[send-task-email] Email sent successfully:", emailResponse);

    // Log success to notification_history
    await supabase.from("notification_history").insert({
      notification_type: "email",
      recipient: to,
      subject: `משימות חדשות (${tasks.length})`,
      message: message || null,
      status: "sent",
      sent_at: new Date().toISOString(),
      client_id: clientId || null,
      task_id: taskId,
      metadata: { tasks_count: tasks.length, resend_id: (emailResponse as any).id },
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[send-task-email] Error:", error);

    // Log error to notification_history
    if (to) {
      await supabase.from("notification_history").insert({
        notification_type: "email",
        recipient: to,
        subject: "משימות חדשות",
        status: "failed",
        error_message: error.message,
        client_id: clientId || null,
        task_id: taskId,
        metadata: { error: error.message },
      });
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
