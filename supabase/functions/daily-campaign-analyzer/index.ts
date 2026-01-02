import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget?: number;
  spent?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  client_id: string;
}

interface ActionProposal {
  action_type: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  campaign_id: string;
  campaign_name: string;
  suggested_change: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting daily campaign analysis...');

    // Fetch all active clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name');

    if (clientsError) {
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);
    }

    console.log(`Found ${clients?.length || 0} clients to analyze`);

    const allProposals: any[] = [];
    const performanceRecords: any[] = [];

    for (const client of clients || []) {
      // Fetch campaigns for this client
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', client.id);

      if (campaignsError) {
        console.error(`Failed to fetch campaigns for client ${client.id}:`, campaignsError);
        continue;
      }

      if (!campaigns || campaigns.length === 0) {
        continue;
      }

      console.log(`Analyzing ${campaigns.length} campaigns for client ${client.name}`);

      // Analyze each campaign and generate proposals
      const proposals = analyzeCampaigns(campaigns);
      
      // Store action proposals in ai_agent_actions
      for (const proposal of proposals) {
        const { data: agent } = await supabase
          .from('ai_agents')
          .select('id')
          .eq('client_id', client.id)
          .eq('agent_type', 'campaign_optimizer')
          .single();

        const agentId = agent?.id;

        const { data: actionData, error: actionError } = await supabase
          .from('ai_agent_actions')
          .insert({
            agent_id: agentId,
            client_id: client.id,
            action_type: proposal.action_type,
            action_data: {
              title: proposal.title,
              description: proposal.description,
              impact: proposal.impact,
              campaign_id: proposal.campaign_id,
              campaign_name: proposal.campaign_name,
              suggested_change: proposal.suggested_change,
            },
            status: proposal.impact === 'high' ? 'urgent' : 'pending',
          })
          .select()
          .single();

        if (actionError) {
          console.error('Failed to insert action:', actionError);
        } else {
          allProposals.push(actionData);
        }
      }

      // Save performance history for each campaign
      for (const campaign of campaigns) {
        const metrics = [
          { name: 'impressions', value: campaign.impressions || 0 },
          { name: 'clicks', value: campaign.clicks || 0 },
          { name: 'conversions', value: campaign.conversions || 0 },
          { name: 'spent', value: campaign.spent || 0 },
          { name: 'ctr', value: campaign.impressions ? ((campaign.clicks || 0) / campaign.impressions) * 100 : 0 },
          { name: 'cpc', value: campaign.clicks ? (campaign.spent || 0) / campaign.clicks : 0 },
        ];

        for (const metric of metrics) {
          const record = {
            client_id: client.id,
            metric_name: `campaign_${campaign.id}_${metric.name}`,
            metric_value: metric.value,
            metric_unit: metric.name === 'spent' || metric.name === 'cpc' ? 'ILS' : 
                        metric.name === 'ctr' ? '%' : 'count',
            source: 'daily_analyzer',
            metadata: {
              campaign_id: campaign.id,
              campaign_name: campaign.name,
              platform: campaign.platform,
            },
          };
          performanceRecords.push(record);
        }

        // Also save aggregated metrics per client
        const clientAggMetrics = [
          { name: 'total_impressions', value: campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0) },
          { name: 'total_clicks', value: campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0) },
          { name: 'total_spent', value: campaigns.reduce((sum, c) => sum + (c.spent || 0), 0) },
          { name: 'total_conversions', value: campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0) },
          { name: 'active_campaigns', value: campaigns.filter(c => c.status === 'active' || c.status === 'ENABLED').length },
        ];

        for (const metric of clientAggMetrics) {
          performanceRecords.push({
            client_id: client.id,
            metric_name: metric.name,
            metric_value: metric.value,
            metric_unit: metric.name.includes('spent') ? 'ILS' : 'count',
            source: 'daily_analyzer',
            metadata: { aggregated: true, campaign_count: campaigns.length },
          });
        }
      }

      // Check for urgent proposals and send alerts
      const urgentProposals = proposals.filter(p => p.impact === 'high');
      if (urgentProposals.length > 0) {
        // Create credit alert for urgent actions
        await supabase
          .from('credit_alerts')
          .insert({
            client_id: client.id,
            alert_type: 'ai_urgent_action',
            message: `נמצאו ${urgentProposals.length} פעולות דחופות לשיפור קמפיינים`,
            is_read: false,
          });

        console.log(`Created alert for ${urgentProposals.length} urgent actions for client ${client.name}`);
      }
    }

    // Bulk insert performance records
    if (performanceRecords.length > 0) {
      const { error: perfError } = await supabase
        .from('client_performance_history')
        .insert(performanceRecords);

      if (perfError) {
        console.error('Failed to insert performance records:', perfError);
      } else {
        console.log(`Saved ${performanceRecords.length} performance records`);
      }
    }

    console.log(`Daily analysis complete. Generated ${allProposals.length} proposals.`);

    return new Response(JSON.stringify({
      success: true,
      proposalsGenerated: allProposals.length,
      performanceRecordsSaved: performanceRecords.length,
      clientsAnalyzed: clients?.length || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in daily-campaign-analyzer:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeCampaigns(campaigns: Campaign[]): ActionProposal[] {
  const proposals: ActionProposal[] = [];

  for (const campaign of campaigns) {
    // Skip non-active campaigns
    if (campaign.status !== 'active' && campaign.status !== 'ENABLED' && campaign.status !== 'ACTIVE') {
      continue;
    }

    const ctr = campaign.impressions ? ((campaign.clicks || 0) / campaign.impressions) * 100 : 0;
    const cpc = campaign.clicks ? (campaign.spent || 0) / campaign.clicks : 0;
    const budgetUtilization = campaign.budget ? ((campaign.spent || 0) / campaign.budget) * 100 : 0;
    const conversionRate = campaign.clicks ? ((campaign.conversions || 0) / campaign.clicks) * 100 : 0;

    // Low CTR
    if (campaign.impressions && campaign.impressions > 100 && ctr < 1) {
      proposals.push({
        action_type: 'optimize_creative',
        title: `שיפור CTR בקמפיין ${campaign.name}`,
        description: `ה-CTR של הקמפיין עומד על ${ctr.toFixed(2)}% בלבד, נמוך משמעותית מהממוצע.`,
        impact: ctr < 0.5 ? 'high' : 'medium',
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        suggested_change: 'שדרג את הקריאייטיב, שפר כותרות ותמונות, בדוק טירגוט קהל',
      });
    }

    // High CPC
    if (campaign.clicks && campaign.clicks > 10 && cpc > 10) {
      proposals.push({
        action_type: 'reduce_cpc',
        title: `הפחתת עלות קליק בקמפיין ${campaign.name}`,
        description: `עלות הקליק הממוצעת היא ${cpc.toFixed(2)} ש"ח, גבוהה מהמקובל.`,
        impact: cpc > 20 ? 'high' : 'medium',
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        suggested_change: 'בדוק מילות מפתח שליליות, שפר ציון איכות, התמקד בקהלים ממירים',
      });
    }

    // Low budget utilization
    if (campaign.budget && budgetUtilization < 50 && campaign.impressions && campaign.impressions > 100) {
      proposals.push({
        action_type: 'increase_budget',
        title: `ניצול תקציב נמוך בקמפיין ${campaign.name}`,
        description: `רק ${budgetUtilization.toFixed(0)}% מהתקציב נוצל. יש פוטנציאל להגדלת חשיפה.`,
        impact: 'medium',
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        suggested_change: 'הגדל הצעות מחיר, הרחב טירגוט קהל, או העבר תקציב לקמפיינים אחרים',
      });
    }

    // Budget nearly exhausted
    if (campaign.budget && budgetUtilization > 95) {
      proposals.push({
        action_type: 'budget_alert',
        title: `תקציב כמעט נגמר בקמפיין ${campaign.name}`,
        description: `${budgetUtilization.toFixed(0)}% מהתקציב נוצל. נדרשת החלטה להמשך.`,
        impact: 'high',
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        suggested_change: 'הגדל תקציב או הפסק קמפיין למניעת עצירה פתאומית',
      });
    }

    // Low conversion rate with high clicks
    if (campaign.clicks && campaign.clicks > 50 && conversionRate < 1) {
      proposals.push({
        action_type: 'improve_landing_page',
        title: `שיפור יחס המרה בקמפיין ${campaign.name}`,
        description: `יחס ההמרה עומד על ${conversionRate.toFixed(2)}% בלבד למרות ${campaign.clicks} קליקים.`,
        impact: 'high',
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        suggested_change: 'בדוק דף נחיתה, שפר UX, וודא התאמה בין מודעה לדף',
      });
    }
  }

  return proposals;
}
