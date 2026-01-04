import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { validateAuth, unauthorizedResponse } from "../_shared/auth.ts";
import { healthCheckResponse, createLogger } from "../_shared/utils.ts";
import { SERVICE_VERSIONS } from "../_shared/constants.ts";
import { checkAIModulePermission, incrementAIUsage } from "../_shared/ai-permissions.ts";

const log = createLogger('AI Marketing');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Track AI usage
async function trackAIUsage(params: {
  action: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  promptSummary?: string;
  clientId?: string;
  userId?: string;
}) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const estimatedCost = ((params.inputTokens / 1000) * 0.00005) + ((params.outputTokens / 1000) * 0.00015);
    
    await supabase.from('ai_query_history').insert({
      action: params.action,
      model: params.model,
      provider: 'lovable',
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      estimated_cost: estimatedCost,
      prompt_summary: params.promptSummary?.slice(0, 500),
      client_id: params.clientId || null,
      created_by: params.userId || null,
    });
    console.log('AI usage tracked:', { action: params.action, estimatedCost });
  } catch (err) {
    console.error('Error tracking AI usage:', err);
  }
}

interface AIRequest {
  type: 'content' | 'insights' | 'strategy' | 'optimize' | 'analyze' | 'health';
  context?: {
    client_name?: string;
    industry?: string;
    platform?: string;
    campaign_data?: any;
    personas?: any[];
    competitors?: any[];
    brand_messages?: any[];
    goals?: any[];
  };
  input?: string;
}

const systemPrompts: Record<string, string> = {
  content: `You are an expert marketing copywriter for Israeli businesses. 
Generate compelling marketing content in Hebrew.
Focus on:
- Clear value propositions
- Emotional connection with the target audience
- Strong calls to action
- Platform-specific best practices
Always respond in Hebrew.`,

  insights: `You are a senior marketing analyst specializing in digital advertising.
Analyze campaign performance data and provide actionable insights.
Focus on:
- Key performance indicators
- Areas for improvement
- Budget optimization recommendations
- Audience targeting suggestions
Provide insights in Hebrew with specific numbers and recommendations.`,

  strategy: `You are a marketing strategist with expertise in the Israeli market.
Create comprehensive marketing strategies based on client context.
Include:
- Target audience analysis
- Channel recommendations
- Content pillars
- Budget allocation suggestions
- Timeline and milestones
Respond in Hebrew with actionable strategies.`,

  optimize: `You are an expert in digital ad optimization.
Suggest specific optimizations for campaigns.
Focus on:
- A/B testing recommendations
- Audience refinement
- Creative improvements
- Bidding strategy adjustments
- Timing optimizations
Provide concrete, actionable suggestions in Hebrew.`,

  analyze: `You are a competitive intelligence analyst.
Analyze competitors and market positioning.
Include:
- Competitive advantages and weaknesses
- Market opportunities
- Differentiation strategies
- Pricing insights
Respond in Hebrew with strategic recommendations.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: AIRequest = await req.json();
    
    // Health check endpoint - no auth required
    if (body.type === 'health') {
      return healthCheckResponse('ai-marketing', SERVICE_VERSIONS.AI_MARKETING, []);
    }
    
    // Validate user authentication for all other actions
    const auth = await validateAuth(req);
    if (!auth.authenticated) {
      console.error('[AI Marketing] Auth failed:', auth.error);
      return unauthorizedResponse(auth.error);
    }
    console.log('[AI Marketing] Authenticated user:', auth.user.id);

    const ctx = body.context || {};

    // Check AI module permission
    const clientId = (ctx as any).client_id || null;
    const permissionCheck = await checkAIModulePermission(clientId, 'marketing', auth.user.id);
    if (!permissionCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: permissionCheck.reason || 'AI is not available for this module' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }
    
    log.info('Request:', body.type);

    const systemPrompt = systemPrompts[body.type] || systemPrompts.content;
    
    let userPrompt = '';

    switch (body.type) {
      case 'content':
        userPrompt = `
לקוח: ${ctx.client_name || 'לא צוין'}
תעשייה: ${ctx.industry || 'כללי'}
פלטפורמה: ${ctx.platform || 'כללי'}

פרסונות יעד:
${ctx.personas?.map(p => `- ${p.name}: ${p.occupation}, גילאים ${p.age_range}`).join('\n') || 'לא צוינו'}

מסרי מותג:
${ctx.brand_messages?.map(m => `- ${m.message}`).join('\n') || 'לא צוינו'}

בקשת המשתמש: ${body.input || 'צור תוכן שיווקי מעניין'}

צור 3 גרסאות של תוכן שיווקי (קצר, בינוני, ארוך) שמתאימות לפלטפורמה.`;
        break;

      case 'insights':
        userPrompt = `
לקוח: ${ctx.client_name || 'לא צוין'}
נתוני קמפיין:
${JSON.stringify(ctx.campaign_data || {}, null, 2)}

יעדים:
${ctx.goals?.map(g => `- ${g.name}: יעד ${g.target_value}${g.unit || ''}, נוכחי ${g.current_value || 0}`).join('\n') || 'לא צוינו'}

נתח את הנתונים וספק:
1. סיכום ביצועים
2. נקודות חוזק
3. נקודות לשיפור
4. המלצות ספציפיות`;
        break;

      case 'strategy':
        userPrompt = `
לקוח: ${ctx.client_name || 'לא צוין'}
תעשייה: ${ctx.industry || 'כללי'}

פרסונות יעד:
${ctx.personas?.map(p => `- ${p.name}: ${p.occupation}, תחומי עניין: ${p.interests?.join(', ')}, כאבים: ${p.pain_points?.join(', ')}`).join('\n') || 'לא צוינו'}

מתחרים:
${ctx.competitors?.map(c => `- ${c.name}: חוזקות: ${c.strengths?.join(', ')}, חולשות: ${c.weaknesses?.join(', ')}`).join('\n') || 'לא צוינו'}

יעדים:
${ctx.goals?.map(g => `- ${g.name}: ${g.target_value}${g.unit || ''} (${g.period || 'חודשי'})`).join('\n') || 'לא צוינו'}

${body.input || 'צור אסטרטגיית שיווק מקיפה'}`;
        break;

      case 'optimize':
        userPrompt = `
לקוח: ${ctx.client_name || 'לא צוין'}
פלטפורמה: ${ctx.platform || 'כללי'}

נתוני קמפיין:
${JSON.stringify(ctx.campaign_data || {}, null, 2)}

ספק המלצות אופטימיזציה ספציפיות ל-3 תחומים עיקריים.`;
        break;

      case 'analyze':
        userPrompt = `
לקוח: ${ctx.client_name || 'לא צוין'}
תעשייה: ${ctx.industry || 'כללי'}

מתחרים:
${ctx.competitors?.map(c => `
${c.name}:
- אתר: ${c.website || 'לא צוין'}
- חוזקות: ${c.strengths?.join(', ') || 'לא צוינו'}
- חולשות: ${c.weaknesses?.join(', ') || 'לא צוינו'}
- הערות: ${c.notes || 'אין'}
`).join('\n') || 'לא צוינו'}

נתח את התחרות וספק אסטרטגיית בידול.`;
        break;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'חריגה ממגבלת בקשות, נסה שוב מאוחר יותר' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'נדרש תשלום נוסף עבור שימוש ב-AI' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('[AI Marketing] Error:', response.status, errorText);
      throw new Error('AI service error');
    }

    // Track AI usage (estimate tokens since streaming)
    const inputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
    
    // Increment daily usage counter
    await incrementAIUsage(auth.user.id, 'marketing');
    
    // For streaming, we estimate based on typical response length
    trackAIUsage({
      action: `marketing_${body.type}`,
      model: 'google/gemini-2.5-flash',
      inputTokens,
      outputTokens: 500, // Estimated for streaming
      promptSummary: userPrompt.slice(0, 500),
      clientId: clientId || undefined,
      userId: auth.user.id,
    });

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('[AI Marketing] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
