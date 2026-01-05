import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  action: 'analyze' | 'suggest-fix' | 'scan-duplicates' | 'auto-close';
  issueId?: string;
  issueTitle?: string;
  issueDescription?: string;
  category?: string;
  context?: string;
  model?: string;
  userId?: string;
  clientId?: string;
}

// Model pricing (per 1M tokens in USD)
const MODEL_PRICING: Record<string, { input: number; output: number; premium: boolean }> = {
  'openai/gpt-4o-mini': { input: 0.15, output: 0.60, premium: false },
  'google/gemini-2.0-flash': { input: 0.075, output: 0.30, premium: false },
  'google/gemini-2.5-flash': { input: 0.075, output: 0.30, premium: false },
  'perplexity/sonar-pro': { input: 3.00, output: 15.00, premium: true },
  'anthropic/claude-sonnet-4': { input: 3.00, output: 15.00, premium: true },
  'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00, premium: true },
  'openai/gpt-4o': { input: 2.50, output: 10.00, premium: true },
  'openai/gpt-4-turbo': { input: 10.00, output: 30.00, premium: true },
};

// Estimate tokens from text (rough: 1 token ≈ 4 chars)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Calculate cost in USD
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['openai/gpt-4o-mini'];
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1000000;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const useOpenRouter = !!OPENROUTER_API_KEY;
    
    if (!OPENROUTER_API_KEY && !LOVABLE_API_KEY) {
      throw new Error('No AI API key configured (OPENROUTER_API_KEY or LOVABLE_API_KEY required)');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, issueId, issueTitle, issueDescription, category, context, model, userId, clientId } = await req.json() as AnalysisRequest;
    
    let selectedModel = model || 'openai/gpt-4o-mini';
    const modelInfo = MODEL_PRICING[selectedModel] || MODEL_PRICING['openai/gpt-4o-mini'];

    // Check if user can use premium models
    if (modelInfo.premium && userId) {
      const { data: userRole } = await supabase.rpc('get_user_role', { _user_id: userId });
      
      if (userRole !== 'admin' && userRole !== 'manager') {
        // Check if user has premium access
        const { data: limits } = await supabase
          .from('ai_usage_limits')
          .select('premium_models_enabled')
          .or(`target_id.eq.${userId},target_id.is.null`)
          .order('limit_type', { ascending: true })
          .limit(1);
        
        if (!limits?.[0]?.premium_models_enabled) {
          console.log(`User ${userId} tried to use premium model ${selectedModel}, downgrading to gpt-4o-mini`);
          selectedModel = 'openai/gpt-4o-mini';
        }
      }
    }

    // Check usage limits
    if (userId) {
      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      
      // Get user's limits
      const { data: limits } = await supabase
        .from('ai_usage_limits')
        .select('*')
        .or(`and(limit_type.eq.user,target_id.eq.${userId}),limit_type.eq.global`)
        .order('limit_type', { ascending: true })
        .limit(1);
      
      const userLimits = limits?.[0] || {
        daily_requests_limit: 50,
        daily_cost_limit: 5.00,
        monthly_requests_limit: 500,
        monthly_cost_limit: 50.00,
        max_input_tokens: 4000,
      };

      // Get today's usage
      const { data: todayUsage } = await supabase
        .from('ai_query_history')
        .select('estimated_cost')
        .eq('created_by', userId)
        .gte('created_at', today);

      const dailyCost = todayUsage?.reduce((sum, r) => sum + Number(r.estimated_cost || 0), 0) || 0;
      const dailyCount = todayUsage?.length || 0;

      // Get monthly usage
      const { data: monthUsage } = await supabase
        .from('ai_query_history')
        .select('estimated_cost')
        .eq('created_by', userId)
        .gte('created_at', monthStart);

      const monthlyCost = monthUsage?.reduce((sum, r) => sum + Number(r.estimated_cost || 0), 0) || 0;
      const monthlyCount = monthUsage?.length || 0;

      // Check limits
      if (dailyCount >= userLimits.daily_requests_limit) {
        return new Response(
          JSON.stringify({ success: false, error: 'הגעת למגבלת הבקשות היומית', limitType: 'daily_requests' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (dailyCost >= userLimits.daily_cost_limit) {
        return new Response(
          JSON.stringify({ success: false, error: 'הגעת למגבלת העלות היומית', limitType: 'daily_cost' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (monthlyCount >= userLimits.monthly_requests_limit) {
        return new Response(
          JSON.stringify({ success: false, error: 'הגעת למגבלת הבקשות החודשית', limitType: 'monthly_requests' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (monthlyCost >= userLimits.monthly_cost_limit) {
        return new Response(
          JSON.stringify({ success: false, error: 'הגעת למגבלת העלות החודשית', limitType: 'monthly_cost' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send alerts at 80% and 90%
      const dailyPercent = (dailyCost / userLimits.daily_cost_limit) * 100;
      const monthlyPercent = (monthlyCost / userLimits.monthly_cost_limit) * 100;

      // Check if we need to send 80% alert
      for (const { percent, type, periodType, currentUsage, limitValue } of [
        { percent: dailyPercent, type: dailyCost, periodType: 'daily', currentUsage: dailyCost, limitValue: userLimits.daily_cost_limit },
        { percent: monthlyPercent, type: monthlyCost, periodType: 'monthly', currentUsage: monthlyCost, limitValue: userLimits.monthly_cost_limit },
      ]) {
        if (percent >= 80 && percent < 90) {
          // Check if alert already sent today
          const { data: existingAlert } = await supabase
            .from('ai_usage_alerts')
            .select('id')
            .eq('user_id', userId)
            .eq('alert_type', '80_percent')
            .eq('period_type', periodType)
            .gte('created_at', today)
            .limit(1);

          if (!existingAlert?.length) {
            await supabase.from('ai_usage_alerts').insert({
              user_id: userId,
              client_id: clientId || null,
              alert_type: '80_percent',
              period_type: periodType,
              threshold_percent: 80,
              current_usage: currentUsage,
              limit_value: limitValue,
            });
          }
        } else if (percent >= 90) {
          const { data: existingAlert } = await supabase
            .from('ai_usage_alerts')
            .select('id')
            .eq('user_id', userId)
            .eq('alert_type', '90_percent')
            .eq('period_type', periodType)
            .gte('created_at', today)
            .limit(1);

          if (!existingAlert?.length) {
            await supabase.from('ai_usage_alerts').insert({
              user_id: userId,
              client_id: clientId || null,
              alert_type: '90_percent',
              period_type: periodType,
              threshold_percent: 90,
              current_usage: currentUsage,
              limit_value: limitValue,
            });
          }
        }
      }
    }

    console.log(`AI Code Analyzer: Action=${action}, IssueId=${issueId}, Model=${selectedModel}, Provider=${useOpenRouter ? 'OpenRouter' : 'Lovable AI'}`);

    let systemPrompt = `אתה מומחה לבריאות קוד ואבטחה. אתה מנתח בעיות קוד ומספק פתרונות מפורטים בעברית.
תמיד תן תשובות מעשיות עם קוד לדוגמה כשרלוונטי.
פורמט התשובה שלך צריך להיות ברור ומסודר עם כותרות.
השתמש בפורמט Markdown לתשובות.
אם יש לך מקורות רלוונטיים מהאינטרנט, הוסף אותם בסוף התשובה.`;

    let userPrompt = '';

    switch (action) {
      case 'analyze':
        userPrompt = `נתח את הבעיה הבאה ותן המלצות לפתרון:

**כותרת:** ${issueTitle}
**קטגוריה:** ${category}
**תיאור:** ${issueDescription || 'לא צוין'}

${context ? `**הקשר נוסף:** ${context}` : ''}

אנא ספק:
1. ניתוח מעמיק של הבעיה
2. השלכות אפשריות אם לא תטופל
3. פתרון מומלץ עם קוד לדוגמה
4. צעדים למניעה בעתיד

חפש מידע עדכני באינטרנט על best practices לפתרון בעיות כאלה.`;
        break;

      case 'suggest-fix':
        systemPrompt = `אתה מומחה לתיקון באגים וקוד React/TypeScript.
תן קוד מלא ומפורט שניתן להעתיק ולהשתמש בו ישירות.
השתמש בפורמט Markdown עם בלוקי קוד מסומנים כראוי.
חפש באינטרנט פתרונות עדכניים ו-best practices.`;
        
        userPrompt = `תן לי פתרון קוד מלא לבעיה הבאה:

**בעיה:** ${issueTitle}
**קטגוריה:** ${category}
**תיאור:** ${issueDescription || 'לא צוין'}

אנא ספק:
1. הקוד המלא לתיקון (ב-TypeScript/React)
2. הסבר קצר על מה הקוד עושה
3. היכן לשים את הקוד (שם הקובץ והמיקום)
4. בדיקות שצריך לעשות לאחר התיקון`;
        break;

      case 'scan-duplicates':
        const { data: openIssues, error: fetchError } = await supabase
          .from('code_health_issues')
          .select('id, title, description, category, severity')
          .is('resolved_at', null)
          .is('ignored_at', null);

        if (fetchError) throw fetchError;

        if (!openIssues || openIssues.length === 0) {
          return new Response(
            JSON.stringify({
              success: true,
              response: 'אין בעיות פתוחות לסריקה.',
              action,
              executedActions: null,
              provider: useOpenRouter ? 'openrouter' : 'lovable',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        userPrompt = `נתח את רשימת הבעיות הבאות וזהה כפילויות או בעיות דומות:

${openIssues.map((issue, idx) => `${idx + 1}. [ID: ${issue.id}] ${issue.title} (${issue.category}): ${issue.description || 'ללא תיאור'}`).join('\n')}

אנא ספק:
1. רשימת קבוצות של בעיות כפולות או דומות (עם ה-IDs שלהן)
2. המלצה איזו בעיה לשמור ואיזו לסגור
3. בסוף התשובה, הוסף JSON בפורמט הבא (חובה!):
\`\`\`json
{"duplicates": [{"keepId": "id-to-keep", "closeIds": ["id-to-close-1", "id-to-close-2"]}]}
\`\`\``;
        break;

      case 'auto-close':
        const { data: allIssues, error: issuesError } = await supabase
          .from('code_health_issues')
          .select('*')
          .is('resolved_at', null)
          .is('ignored_at', null);

        if (issuesError) throw issuesError;

        if (!allIssues || allIssues.length === 0) {
          return new Response(
            JSON.stringify({
              success: true,
              response: 'אין בעיות פתוחות לבדיקה.',
              action,
              executedActions: null,
              provider: useOpenRouter ? 'openrouter' : 'lovable',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        userPrompt = `בדוק את רשימת הבעיות הבאות וזהה בעיות שכבר לא רלוונטיות או שנפתרו מעצמן:

${allIssues.map((issue, idx) => `${idx + 1}. [ID: ${issue.id}] ${issue.title} (${issue.severity})
   - נוצר: ${issue.detected_at}
   - תיאור: ${issue.description || 'ללא'}
   - קטגוריה: ${issue.category}`).join('\n\n')}

בדוק אם:
- הבעיה ישנה מאוד (יותר מ-30 יום) וכנראה כבר טופלה
- הבעיה מסוג info ולא קריטית
- הבעיה כבר לא רלוונטית לפי התיאור

אנא ספק:
1. רשימת בעיות שניתן לסגור אוטומטית (עם ה-IDs)
2. סיבה לסגירה לכל בעיה
3. בסוף התשובה, הוסף JSON בפורמט הבא (חובה!):
\`\`\`json
{"autoClose": [{"id": "issue-id", "reason": "סיבה לסגירה"}]}
\`\`\``;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Estimate input tokens
    const fullPrompt = systemPrompt + userPrompt;
    const inputTokens = estimateTokens(fullPrompt);

    let aiResponse = '';
    let citations: string[] = [];
    let provider = '';

    if (useOpenRouter) {
      console.log(`Calling OpenRouter with model: ${selectedModel}...`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://jiy.app',
          'X-Title': 'JIY Code Health Analyzer',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter error:', response.status, errorText);
        
        if (LOVABLE_API_KEY) {
          console.log('OpenRouter failed, falling back to Lovable AI...');
          const fallbackResponse = await callLovableAI(LOVABLE_API_KEY, systemPrompt, userPrompt);
          aiResponse = fallbackResponse.content;
          provider = 'lovable (fallback)';
        } else {
          throw new Error(`OpenRouter error: ${response.status} - ${errorText}`);
        }
      } else {
        const data = await response.json();
        aiResponse = data.choices?.[0]?.message?.content || 'לא התקבלה תשובה מה-AI';
        
        if (selectedModel.includes('perplexity')) {
          citations = data.citations || [];
        }
        
        provider = `openrouter/${selectedModel.split('/')[0]}`;
        
        console.log(`OpenRouter response received, model: ${selectedModel}, citations: ${citations.length}`);
      }
    } else {
      console.log('Calling Lovable AI Gateway...');
      const lovableResponse = await callLovableAI(LOVABLE_API_KEY!, systemPrompt, userPrompt);
      aiResponse = lovableResponse.content;
      provider = 'lovable';
    }

    // Estimate output tokens
    const outputTokens = estimateTokens(aiResponse);
    const estimatedCost = calculateCost(selectedModel, inputTokens, outputTokens);

    console.log(`AI Response received, length: ${aiResponse.length}, cost: $${estimatedCost.toFixed(6)}`);

    // Parse and execute actions if needed
    let executedActions: any = null;

    if (action === 'scan-duplicates' || action === 'auto-close') {
      const jsonCodeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonMatch = jsonCodeBlockMatch ? jsonCodeBlockMatch[1] : aiResponse.match(/\{[\s\S]*\}/)?.[0];
      
      if (jsonMatch) {
        try {
          const actionData = JSON.parse(jsonMatch);
          
          if (action === 'auto-close' && actionData.autoClose && Array.isArray(actionData.autoClose)) {
            const closedIds: string[] = [];
            for (const item of actionData.autoClose) {
              if (item.id) {
                const { error: closeError } = await supabase
                  .from('code_health_issues')
                  .update({
                    resolved_at: new Date().toISOString(),
                    resolved_by: 'ai-agent',
                  })
                  .eq('id', item.id);
                
                if (!closeError) {
                  closedIds.push(item.id);
                  console.log(`Closed issue: ${item.id} - ${item.reason}`);
                }
              }
            }
            executedActions = { closedIds, total: actionData.autoClose.length };
          }
          
          if (action === 'scan-duplicates' && actionData.duplicates && Array.isArray(actionData.duplicates)) {
            executedActions = { duplicates: actionData.duplicates, found: actionData.duplicates.length };
          }
        } catch (parseError) {
          console.log('Could not parse JSON from response:', parseError);
        }
      }
    }

    // Save to history
    if (userId) {
      await supabase.from('ai_query_history').insert({
        action,
        model: selectedModel,
        issue_id: issueId || null,
        issue_title: issueTitle || null,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        estimated_cost: estimatedCost,
        prompt_summary: userPrompt.slice(0, 500),
        response: aiResponse,
        citations: citations,
        provider,
        executed_actions: executedActions || {},
        created_by: userId,
        client_id: clientId || null,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        action,
        executedActions,
        provider,
        citations,
        usage: {
          inputTokens,
          outputTokens,
          estimatedCost,
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('AI Code Analyzer error:', error);
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

async function callLovableAI(apiKey: string, systemPrompt: string, userPrompt: string) {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI Gateway error:', response.status, errorText);
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('Payment required. Please add credits to your workspace.');
    }
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || 'לא התקבלה תשובה מה-AI',
  };
}
