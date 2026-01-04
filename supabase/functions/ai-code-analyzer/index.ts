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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, issueId, issueTitle, issueDescription, category, context } = await req.json() as AnalysisRequest;

    console.log(`AI Code Analyzer: Action=${action}, IssueId=${issueId}`);

    let systemPrompt = `אתה מומחה לבריאות קוד ואבטחה. אתה מנתח בעיות קוד ומספק פתרונות מפורטים בעברית.
תמיד תן תשובות מעשיות עם קוד לדוגמה כשרלוונטי.
פורמט התשובה שלך צריך להיות ברור ומסודר.`;

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
4. צעדים למניעה בעתיד`;
        break;

      case 'suggest-fix':
        systemPrompt = `אתה מומחה לתיקון באגים וקוד. חפש בידע שלך מידע עדכני על הפתרון הטוב ביותר.
תן קוד מלא ומפורט שניתן להעתיק ולהשתמש בו ישירות.`;
        
        userPrompt = `תן לי פתרון קוד מלא לבעיה הבאה:

**בעיה:** ${issueTitle}
**קטגוריה:** ${category}
**תיאור:** ${issueDescription || 'לא צוין'}

אנא ספק:
1. הקוד המלא לתיקון
2. הסבר קצר על מה הקוד עושה
3. היכן לשים את הקוד
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

        userPrompt = `נתח את רשימת הבעיות הבאות וזהה כפילויות או בעיות דומות:

${openIssues?.map((issue, idx) => `${idx + 1}. [${issue.id}] ${issue.title} (${issue.category}): ${issue.description || 'ללא תיאור'}`).join('\n')}

אנא ספק:
1. רשימת קבוצות של בעיות כפולות או דומות (עם ה-IDs שלהן)
2. המלצה איזו בעיה לשמור ואיזו לסגור
3. פורמט JSON של הבעיות לסגירה: {"duplicates": [{"keepId": "...", "closeIds": ["...", "..."]}]}`;
        break;

      case 'auto-close':
        // Get all open issues and check if they're still relevant
        const { data: allIssues, error: issuesError } = await supabase
          .from('code_health_issues')
          .select('*')
          .is('resolved_at', null)
          .is('ignored_at', null);

        if (issuesError) throw issuesError;

        userPrompt = `בדוק את רשימת הבעיות הבאות וזהה בעיות שכבר לא רלוונטיות או שנפתרו מעצמן:

${allIssues?.map((issue, idx) => `${idx + 1}. [${issue.id}] ${issue.title} (${issue.severity}) - נוצר: ${issue.detected_at}
   תיאור: ${issue.description || 'ללא'}
   פרטים: ${JSON.stringify(issue.details || {})}`).join('\n\n')}

אנא ספק:
1. רשימת בעיות שניתן לסגור אוטומטית (עם ה-IDs)
2. סיבה לסגירה לכל בעיה
3. פורמט JSON: {"autoClose": [{"id": "...", "reason": "..."}]}`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Call Perplexity via OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://jiy.lovable.app',
        'X-Title': 'JIY Code Health Analyzer',
      },
      body: JSON.stringify({
        model: 'perplexity/sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'לא התקבלה תשובה מה-AI';

    console.log('AI Response received, length:', aiResponse.length);

    // Parse and execute actions if needed
    let executedActions: any = null;

    if (action === 'scan-duplicates' || action === 'auto-close') {
      // Try to extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const actionData = JSON.parse(jsonMatch[0]);
          
          if (action === 'auto-close' && actionData.autoClose) {
            // Auto-close issues
            const closedIds: string[] = [];
            for (const item of actionData.autoClose) {
              const { error: closeError } = await supabase
                .from('code_health_issues')
                .update({
                  resolved_at: new Date().toISOString(),
                  resolved_by: 'ai-agent',
                })
                .eq('id', item.id);
              
              if (!closeError) {
                closedIds.push(item.id);
              }
            }
            executedActions = { closedIds, total: actionData.autoClose.length };
          }
          
          if (action === 'scan-duplicates' && actionData.duplicates) {
            executedActions = { duplicates: actionData.duplicates };
          }
        } catch (parseError) {
          console.log('Could not parse JSON from response, returning text only');
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        action,
        executedActions,
        citations: data.citations || [],
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
