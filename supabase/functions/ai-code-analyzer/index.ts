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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Try OpenRouter first, fallback to Lovable AI
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const useOpenRouter = !!OPENROUTER_API_KEY;
    
    if (!OPENROUTER_API_KEY && !LOVABLE_API_KEY) {
      throw new Error('No AI API key configured (OPENROUTER_API_KEY or LOVABLE_API_KEY required)');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, issueId, issueTitle, issueDescription, category, context, model } = await req.json() as AnalysisRequest;
    
    const selectedModel = model || 'perplexity/sonar-pro';

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
        // Get all open issues
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
        // Get all open issues and check if they're still relevant
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

    let aiResponse = '';
    let citations: string[] = [];
    let provider = '';

    if (useOpenRouter) {
      // Use OpenRouter with selected model
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
        
        // Fallback to Lovable AI if OpenRouter fails
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
        
        // Citations available from Perplexity models
        if (selectedModel.includes('perplexity')) {
          citations = data.citations || [];
        }
        
        provider = `openrouter/${selectedModel.split('/')[0]}`;
        
        console.log(`OpenRouter response received, model: ${selectedModel}, citations: ${citations.length}`);
      }
    } else {
      // Use Lovable AI as primary
      console.log('Calling Lovable AI Gateway...');
      const lovableResponse = await callLovableAI(LOVABLE_API_KEY!, systemPrompt, userPrompt);
      aiResponse = lovableResponse.content;
      provider = 'lovable';
    }

    console.log('AI Response received, length:', aiResponse.length);

    // Parse and execute actions if needed
    let executedActions: any = null;

    if (action === 'scan-duplicates' || action === 'auto-close') {
      // Try to extract JSON from response (including from code blocks)
      const jsonCodeBlockMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonMatch = jsonCodeBlockMatch ? jsonCodeBlockMatch[1] : aiResponse.match(/\{[\s\S]*\}/)?.[0];
      
      if (jsonMatch) {
        try {
          const actionData = JSON.parse(jsonMatch);
          
          if (action === 'auto-close' && actionData.autoClose && Array.isArray(actionData.autoClose)) {
            // Auto-close issues
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

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        action,
        executedActions,
        provider,
        citations,
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

// Helper function for Lovable AI calls
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
