import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate date range (last month)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const startDate = lastMonth.toISOString();
    const endDate = lastMonthEnd.toISOString();

    console.log(`Generating AI usage report for ${lastMonth.toLocaleDateString('he-IL')} - ${lastMonthEnd.toLocaleDateString('he-IL')}`);

    // Get all usage data for the period
    const { data: usageData, error: usageError } = await supabase
      .from('ai_query_history')
      .select(`
        id,
        action,
        model,
        estimated_cost,
        input_tokens,
        output_tokens,
        created_by,
        client_id,
        created_at
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (usageError) throw usageError;

    if (!usageData || usageData.length === 0) {
      console.log('No AI usage data for this period');
      return new Response(
        JSON.stringify({ success: true, message: 'No usage data for this period' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate by user
    const userStats: Record<string, { count: number; cost: number; tokens: number }> = {};
    const modelStats: Record<string, { count: number; cost: number }> = {};
    let totalCost = 0;
    let totalRequests = 0;

    for (const record of usageData) {
      const userId = record.created_by || 'unknown';
      const model = record.model || 'unknown';
      const cost = Number(record.estimated_cost || 0);
      const tokens = (record.input_tokens || 0) + (record.output_tokens || 0);

      // User stats
      if (!userStats[userId]) {
        userStats[userId] = { count: 0, cost: 0, tokens: 0 };
      }
      userStats[userId].count++;
      userStats[userId].cost += cost;
      userStats[userId].tokens += tokens;

      // Model stats
      if (!modelStats[model]) {
        modelStats[model] = { count: 0, cost: 0 };
      }
      modelStats[model].count++;
      modelStats[model].cost += cost;

      totalCost += cost;
      totalRequests++;
    }

    // Get user emails for the report
    const userIds = Object.keys(userStats).filter(id => id !== 'unknown');
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const userMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Get admin emails
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    const adminIds = adminRoles?.map(r => r.user_id) || [];
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('email')
      .in('id', adminIds);

    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) as string[] || [];

    // Build email content
    const reportMonth = lastMonth.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
    
    const userTableRows = Object.entries(userStats)
      .sort((a, b) => b[1].cost - a[1].cost)
      .map(([userId, stats]) => {
        const profile = userMap.get(userId);
        const name = profile?.full_name || profile?.email || userId.slice(0, 8);
        return `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${stats.count}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${stats.tokens.toLocaleString()}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: left;">$${stats.cost.toFixed(2)}</td>
          </tr>
        `;
      })
      .join('');

    const modelTableRows = Object.entries(modelStats)
      .sort((a, b) => b[1].cost - a[1].cost)
      .map(([model, stats]) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${model}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${stats.count}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: left;">$${stats.cost.toFixed(2)}</td>
        </tr>
      `)
      .join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; direction: rtl;">
        <h1 style="color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
          📊 דוח שימוש AI - ${reportMonth}
        </h1>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin: 0 0 10px 0; font-size: 18px;">סיכום כללי</h2>
          <p style="margin: 5px 0;"><strong>סה"כ בקשות:</strong> ${totalRequests.toLocaleString()}</p>
          <p style="margin: 5px 0;"><strong>סה"כ עלות:</strong> $${totalCost.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>משתמשים פעילים:</strong> ${Object.keys(userStats).length}</p>
        </div>

        <h2 style="color: #333; margin-top: 30px;">👥 שימוש לפי משתמש</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #6366f1; color: white;">
              <th style="padding: 10px; text-align: right;">משתמש</th>
              <th style="padding: 10px; text-align: center;">בקשות</th>
              <th style="padding: 10px; text-align: center;">Tokens</th>
              <th style="padding: 10px; text-align: left;">עלות</th>
            </tr>
          </thead>
          <tbody>
            ${userTableRows}
          </tbody>
        </table>

        <h2 style="color: #333; margin-top: 30px;">🤖 שימוש לפי מודל</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #6366f1; color: white;">
              <th style="padding: 10px; text-align: right;">מודל</th>
              <th style="padding: 10px; text-align: center;">בקשות</th>
              <th style="padding: 10px; text-align: left;">עלות</th>
            </tr>
          </thead>
          <tbody>
            ${modelTableRows}
          </tbody>
        </table>

        <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          דוח זה נוצר אוטומטית על ידי מערכת JIY.
        </p>
      </div>
    `;

    // Send email if Resend is configured
    if (resendApiKey && adminEmails.length > 0) {
      const resend = new Resend(resendApiKey);
      
      await resend.emails.send({
        from: 'JIY System <onboarding@resend.dev>',
        to: adminEmails,
        subject: `📊 דוח שימוש AI - ${reportMonth}`,
        html: emailHtml,
      });

      console.log(`Report sent to ${adminEmails.length} admins`);
    } else {
      console.log('Resend not configured or no admin emails found');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalRequests,
        totalCost,
        usersCount: Object.keys(userStats).length,
        emailsSent: adminEmails.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Usage Report error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
