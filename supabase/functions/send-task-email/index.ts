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

  try {
    const { to, tasks, message, clientId }: TaskEmailRequest = await req.json();

    console.log(`Sending task email to ${to} with ${tasks.length} tasks`);

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
      from: "JIY Tasks <onboarding@resend.dev>",
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
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  נשלח מ-JIY Tasks Management System
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-task-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
