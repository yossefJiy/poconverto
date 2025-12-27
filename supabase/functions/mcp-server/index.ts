import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// MCP-like server for AI assistants to interact with the marketing system
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, params } = body;

    console.log(`MCP Action: ${action}`, params);

    let result: any = null;

    switch (action) {
      // ===== CLIENT OPERATIONS =====
      case 'list_clients': {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('name');
        if (error) throw error;
        result = { clients: data };
        break;
      }

      case 'get_client': {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', params.client_id)
          .single();
        if (error) throw error;
        result = { client: data };
        break;
      }

      case 'create_client': {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            name: params.name,
            industry: params.industry,
            website: params.website,
            description: params.description,
          })
          .select()
          .single();
        if (error) throw error;
        result = { client: data, message: 'Client created successfully' };
        break;
      }

      // ===== CAMPAIGN OPERATIONS =====
      case 'list_campaigns': {
        let query = supabase.from('campaigns').select('*').order('created_at', { ascending: false });
        if (params.client_id) query = query.eq('client_id', params.client_id);
        if (params.status) query = query.eq('status', params.status);
        const { data, error } = await query;
        if (error) throw error;
        result = { campaigns: data };
        break;
      }

      case 'get_campaign': {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', params.campaign_id)
          .single();
        if (error) throw error;
        result = { campaign: data };
        break;
      }

      case 'create_campaign': {
        const { data, error } = await supabase
          .from('campaigns')
          .insert({
            client_id: params.client_id,
            name: params.name,
            platform: params.platform || 'facebook',
            budget: params.budget || 0,
            status: params.status || 'draft',
            description: params.description,
            start_date: params.start_date,
            end_date: params.end_date,
          })
          .select()
          .single();
        if (error) throw error;
        result = { campaign: data, message: 'Campaign created successfully' };
        break;
      }

      case 'update_campaign': {
        const updates: any = {};
        if (params.name) updates.name = params.name;
        if (params.status) updates.status = params.status;
        if (params.budget) updates.budget = params.budget;
        if (params.spent !== undefined) updates.spent = params.spent;
        if (params.impressions !== undefined) updates.impressions = params.impressions;
        if (params.clicks !== undefined) updates.clicks = params.clicks;
        if (params.conversions !== undefined) updates.conversions = params.conversions;

        const { data, error } = await supabase
          .from('campaigns')
          .update(updates)
          .eq('id', params.campaign_id)
          .select()
          .single();
        if (error) throw error;
        result = { campaign: data, message: 'Campaign updated successfully' };
        break;
      }

      // ===== TASK OPERATIONS =====
      case 'list_tasks': {
        let query = supabase.from('tasks').select('*, team_members(name)').order('created_at', { ascending: false });
        if (params.client_id) query = query.eq('client_id', params.client_id);
        if (params.status) query = query.eq('status', params.status);
        if (params.assignee) query = query.eq('assignee', params.assignee);
        const { data, error } = await query;
        if (error) throw error;
        result = { tasks: data };
        break;
      }

      case 'create_task': {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            client_id: params.client_id,
            title: params.title,
            description: params.description,
            priority: params.priority || 'medium',
            status: params.status || 'pending',
            assignee: params.assignee,
            due_date: params.due_date,
            department: params.department,
          })
          .select()
          .single();
        if (error) throw error;
        result = { task: data, message: 'Task created successfully' };
        break;
      }

      case 'update_task': {
        const updates: any = {};
        if (params.title) updates.title = params.title;
        if (params.status) updates.status = params.status;
        if (params.priority) updates.priority = params.priority;
        if (params.assignee) updates.assignee = params.assignee;
        if (params.due_date) updates.due_date = params.due_date;
        if (params.status === 'completed') updates.completed_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', params.task_id)
          .select()
          .single();
        if (error) throw error;
        result = { task: data, message: 'Task updated successfully' };
        break;
      }

      // ===== TEAM OPERATIONS =====
      case 'list_team_members': {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (error) throw error;
        result = { team_members: data };
        break;
      }

      case 'create_team_member': {
        const { data, error } = await supabase
          .from('team_members')
          .insert({
            name: params.name,
            email: params.email,
            departments: params.departments || [],
          })
          .select()
          .single();
        if (error) throw error;
        result = { team_member: data, message: 'Team member created successfully' };
        break;
      }

      // ===== ANALYTICS & REPORTS =====
      case 'get_dashboard': {
        const clientId = params.client_id;
        
        const campaignsQuery = clientId 
          ? supabase.from('campaigns').select('*').eq('client_id', clientId)
          : supabase.from('campaigns').select('*');
        
        const tasksQuery = clientId 
          ? supabase.from('tasks').select('*').eq('client_id', clientId)
          : supabase.from('tasks').select('*');

        const [campaigns, tasks] = await Promise.all([
          campaignsQuery,
          tasksQuery,
        ]);

        const campaignsData = campaigns.data || [];
        const tasksData = tasks.data || [];

        result = {
          summary: {
            total_campaigns: campaignsData.length,
            active_campaigns: campaignsData.filter((c: any) => c.status === 'active').length,
            total_budget: campaignsData.reduce((sum: number, c: any) => sum + (c.budget || 0), 0),
            total_spent: campaignsData.reduce((sum: number, c: any) => sum + (c.spent || 0), 0),
            total_impressions: campaignsData.reduce((sum: number, c: any) => sum + (c.impressions || 0), 0),
            total_clicks: campaignsData.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0),
            total_conversions: campaignsData.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0),
            open_tasks: tasksData.filter((t: any) => t.status !== 'completed').length,
            completed_tasks: tasksData.filter((t: any) => t.status === 'completed').length,
          },
          top_campaigns: campaignsData
            .sort((a: any, b: any) => (b.conversions || 0) - (a.conversions || 0))
            .slice(0, 5),
          urgent_tasks: tasksData
            .filter((t: any) => t.priority === 'urgent' && t.status !== 'completed')
            .slice(0, 5),
        };
        break;
      }

      case 'get_analytics': {
        const clientId = params.client_id;
        
        const campaignsQuery = clientId 
          ? supabase.from('campaigns').select('*').eq('client_id', clientId)
          : supabase.from('campaigns').select('*');
        
        const { data: campaigns } = await campaignsQuery;
        const campaignsData = campaigns || [];

        // Group by platform
        const byPlatform: Record<string, any> = {};
        campaignsData.forEach((c: any) => {
          if (!byPlatform[c.platform]) {
            byPlatform[c.platform] = { impressions: 0, clicks: 0, conversions: 0, spent: 0, campaigns: 0 };
          }
          byPlatform[c.platform].impressions += c.impressions || 0;
          byPlatform[c.platform].clicks += c.clicks || 0;
          byPlatform[c.platform].conversions += c.conversions || 0;
          byPlatform[c.platform].spent += c.spent || 0;
          byPlatform[c.platform].campaigns++;
        });

        // Calculate CTR and CPC per platform
        Object.keys(byPlatform).forEach(platform => {
          const p = byPlatform[platform];
          p.ctr = p.impressions > 0 ? ((p.clicks / p.impressions) * 100).toFixed(2) : 0;
          p.cpc = p.clicks > 0 ? (p.spent / p.clicks).toFixed(2) : 0;
          p.cpa = p.conversions > 0 ? (p.spent / p.conversions).toFixed(2) : 0;
        });

        result = {
          by_platform: byPlatform,
          totals: {
            impressions: campaignsData.reduce((sum: number, c: any) => sum + (c.impressions || 0), 0),
            clicks: campaignsData.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0),
            conversions: campaignsData.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0),
            spent: campaignsData.reduce((sum: number, c: any) => sum + (c.spent || 0), 0),
          },
        };
        break;
      }

      // ===== GOALS =====
      case 'list_goals': {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('client_id', params.client_id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        result = { goals: data };
        break;
      }

      case 'create_goal': {
        const { data, error } = await supabase
          .from('goals')
          .insert({
            client_id: params.client_id,
            name: params.name,
            target_value: params.target_value,
            current_value: params.current_value || 0,
            unit: params.unit,
            period: params.period,
          })
          .select()
          .single();
        if (error) throw error;
        result = { goal: data, message: 'Goal created successfully' };
        break;
      }

      case 'update_goal': {
        const updates: any = {};
        if (params.current_value !== undefined) updates.current_value = params.current_value;
        if (params.target_value !== undefined) updates.target_value = params.target_value;

        const { data, error } = await supabase
          .from('goals')
          .update(updates)
          .eq('id', params.goal_id)
          .select()
          .single();
        if (error) throw error;
        result = { goal: data, message: 'Goal updated successfully' };
        break;
      }

      // ===== HELP =====
      case 'help':
      case 'list_actions': {
        result = {
          available_actions: [
            { action: 'list_clients', description: 'Get all clients' },
            { action: 'get_client', params: ['client_id'], description: 'Get a specific client' },
            { action: 'create_client', params: ['name', 'industry?', 'website?', 'description?'], description: 'Create a new client' },
            { action: 'list_campaigns', params: ['client_id?', 'status?'], description: 'Get campaigns' },
            { action: 'get_campaign', params: ['campaign_id'], description: 'Get a specific campaign' },
            { action: 'create_campaign', params: ['client_id', 'name', 'platform?', 'budget?'], description: 'Create a campaign' },
            { action: 'update_campaign', params: ['campaign_id', '...fields'], description: 'Update a campaign' },
            { action: 'list_tasks', params: ['client_id?', 'status?', 'assignee?'], description: 'Get tasks' },
            { action: 'create_task', params: ['title', 'client_id?', 'assignee?', 'priority?'], description: 'Create a task' },
            { action: 'update_task', params: ['task_id', '...fields'], description: 'Update a task' },
            { action: 'list_team_members', description: 'Get all team members' },
            { action: 'create_team_member', params: ['name', 'email?', 'departments?'], description: 'Add a team member' },
            { action: 'get_dashboard', params: ['client_id?'], description: 'Get dashboard summary' },
            { action: 'get_analytics', params: ['client_id?'], description: 'Get analytics by platform' },
            { action: 'list_goals', params: ['client_id'], description: 'Get client goals' },
            { action: 'create_goal', params: ['client_id', 'name', 'target_value', 'unit?'], description: 'Create a goal' },
            { action: 'update_goal', params: ['goal_id', 'current_value?', 'target_value?'], description: 'Update goal progress' },
          ],
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}. Use 'help' or 'list_actions' to see available actions.`);
    }

    console.log(`MCP Response for ${action}:`, JSON.stringify(result).substring(0, 300));

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('MCP Error:', error);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
