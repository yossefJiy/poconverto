import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Action types and their required permission levels
const ACTION_PERMISSIONS: Record<string, string> = {
  search_data: "demo",
  generate_report: "premium_client",
  create_task: "employee",
  send_notification: "team_manager",
  update_campaign: "team_manager",
  schedule_reminder: "employee",
  analyze_data: "basic_client",
  get_insights: "basic_client",
};

// Actions that require approval before execution
const REQUIRES_APPROVAL: string[] = [
  "update_campaign",
  "send_notification",
];

interface ActionRequest {
  action: string;
  clientId: string;
  agentId?: string;
  params: Record<string, any>;
  skipApproval?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, clientId, agentId, params, skipApproval } = await req.json() as ActionRequest;

    console.log(`Agent action requested: ${action} for client ${clientId} by user ${user.id}`);

    // Check if user has permission for this action
    const requiredRole = ACTION_PERMISSIONS[action];
    if (!requiredRole) {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const userRole = roleData?.role || "demo";

    // Check if user has required role level
    const roleHierarchy = [
      "super_admin", "admin", "agency_manager", "team_manager", 
      "employee", "premium_client", "basic_client", "demo"
    ];
    
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    if (userRoleIndex > requiredRoleIndex) {
      return new Response(JSON.stringify({ 
        error: "Permission denied",
        message: `נדרשת הרשאת ${requiredRole} לביצוע פעולה זו`
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if action requires approval
    if (REQUIRES_APPROVAL.includes(action) && !skipApproval) {
      // Create pending action for approval
      const { data: pendingAction, error: insertError } = await supabase
        .from("ai_agent_actions")
        .insert({
          agent_id: agentId,
          client_id: clientId,
          action_type: action,
          action_data: params,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to create pending action:", insertError);
        throw insertError;
      }

      return new Response(JSON.stringify({
        status: "pending_approval",
        actionId: pendingAction.id,
        message: "הפעולה נשמרה וממתינה לאישור"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Execute the action
    let result: any;

    switch (action) {
      case "search_data":
        result = await searchData(supabase, clientId, params);
        break;

      case "generate_report":
        result = await generateReport(supabase, clientId, params);
        break;

      case "create_task":
        result = await createTask(supabase, clientId, user.id, params);
        break;

      case "send_notification":
        result = await sendNotification(supabase, clientId, params);
        break;

      case "update_campaign":
        result = await updateCampaign(supabase, clientId, params);
        break;

      case "schedule_reminder":
        result = await scheduleReminder(supabase, clientId, user.id, params);
        break;

      case "analyze_data":
        result = await analyzeData(supabase, clientId, params);
        break;

      case "get_insights":
        result = await getInsights(supabase, clientId, params);
        break;

      default:
        return new Response(JSON.stringify({ error: "Action not implemented" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Log the action in agent memory
    if (agentId) {
      await supabase.from("agent_memory").insert({
        agent_id: agentId,
        client_id: clientId,
        memory_type: "action_history",
        content: `ביצעתי פעולה: ${action}`,
        source: "action",
        metadata: { action, params, result: result?.summary || "success" },
      });

      // Update agent stats
      await supabase.from("ai_agents")
        .update({
          settings: supabase.rpc("jsonb_set", {
            target: "settings",
            path: "{total_interactions}",
            new_value: "settings->>'total_interactions'::int + 1"
          })
        })
        .eq("id", agentId);
    }

    // Record executed action
    if (agentId) {
      await supabase.from("ai_agent_actions").insert({
        agent_id: agentId,
        client_id: clientId,
        action_type: action,
        action_data: params,
        status: "executed",
        result,
        executed_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({
      status: "success",
      action,
      result,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Agent executor error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Action implementations

async function searchData(supabase: any, clientId: string, params: any) {
  const { query, tables = ["tasks", "campaigns", "analytics_snapshots"] } = params;
  const results: Record<string, any[]> = {};

  for (const table of tables) {
    const { data } = await supabase
      .from(table)
      .select("*")
      .eq("client_id", clientId)
      .textSearch("name", query, { type: "websearch" })
      .limit(10);
    
    results[table] = data || [];
  }

  return {
    query,
    results,
    summary: `נמצאו ${Object.values(results).flat().length} תוצאות`
  };
}

async function generateReport(supabase: any, clientId: string, params: any) {
  const { reportType = "summary", dateRange } = params;

  // Get relevant data for report
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("client_id", clientId);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("client_id", clientId);

  const { data: snapshots } = await supabase
    .from("analytics_snapshots")
    .select("*")
    .eq("client_id", clientId)
    .order("snapshot_date", { ascending: false })
    .limit(30);

  return {
    reportType,
    generatedAt: new Date().toISOString(),
    data: {
      campaignCount: campaigns?.length || 0,
      taskCount: tasks?.length || 0,
      latestMetrics: snapshots?.[0]?.metrics || {},
    },
    summary: `דוח ${reportType} נוצר בהצלחה`
  };
}

async function createTask(supabase: any, clientId: string, userId: string, params: any) {
  const { title, description, priority = "medium", dueDate } = params;

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      client_id: clientId,
      title,
      description,
      priority,
      due_date: dueDate,
      created_by: userId,
      status: "todo",
    })
    .select()
    .single();

  if (error) throw error;

  return {
    taskId: task.id,
    title: task.title,
    summary: `משימה "${title}" נוצרה בהצלחה`
  };
}

async function sendNotification(supabase: any, clientId: string, params: any) {
  const { recipient, subject, message, type = "email" } = params;

  const { data, error } = await supabase
    .from("notification_history")
    .insert({
      client_id: clientId,
      recipient,
      subject,
      message,
      notification_type: type,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;

  return {
    notificationId: data.id,
    summary: `התראה נשלחה ל-${recipient}`
  };
}

async function updateCampaign(supabase: any, clientId: string, params: any) {
  const { campaignId, updates } = params;

  const { data, error } = await supabase
    .from("campaigns")
    .update(updates)
    .eq("id", campaignId)
    .eq("client_id", clientId)
    .select()
    .single();

  if (error) throw error;

  return {
    campaignId: data.id,
    campaignName: data.name,
    summary: `קמפיין "${data.name}" עודכן בהצלחה`
  };
}

async function scheduleReminder(supabase: any, clientId: string, userId: string, params: any) {
  const { title, description, reminderDate, taskId } = params;

  // Create a task as a reminder
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      client_id: clientId,
      title: `תזכורת: ${title}`,
      description,
      due_date: reminderDate,
      created_by: userId,
      status: "todo",
      priority: "medium",
    })
    .select()
    .single();

  if (error) throw error;

  return {
    reminderId: data.id,
    reminderDate,
    summary: `תזכורת נקבעה ל-${new Date(reminderDate).toLocaleDateString("he-IL")}`
  };
}

async function analyzeData(supabase: any, clientId: string, params: any) {
  const { analysisType = "performance" } = params;

  // Get recent snapshots for analysis
  const { data: snapshots } = await supabase
    .from("analytics_snapshots")
    .select("*")
    .eq("client_id", clientId)
    .order("snapshot_date", { ascending: false })
    .limit(30);

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "active");

  // Calculate basic metrics
  const totalSpent = campaigns?.reduce((sum: number, c: any) => sum + (c.spent || 0), 0) || 0;
  const totalConversions = campaigns?.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0) || 0;

  return {
    analysisType,
    metrics: {
      totalSpent,
      totalConversions,
      avgCPA: totalConversions > 0 ? totalSpent / totalConversions : 0,
      activeCampaigns: campaigns?.length || 0,
    },
    summary: `ניתוח ${analysisType} הושלם - ${campaigns?.length || 0} קמפיינים פעילים`
  };
}

async function getInsights(supabase: any, clientId: string, params: any) {
  const { insightType = "recommendations" } = params;

  // Get latest insights from the database
  const { data: insights } = await supabase
    .from("client_insights")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(5);

  // Get agent memory for additional context
  const { data: memories } = await supabase
    .from("agent_memory")
    .select("*")
    .eq("client_id", clientId)
    .eq("memory_type", "insight")
    .order("importance", { ascending: false })
    .limit(10);

  return {
    insightType,
    insights: insights || [],
    memories: memories || [],
    summary: `נמצאו ${(insights?.length || 0) + (memories?.length || 0)} תובנות`
  };
}
