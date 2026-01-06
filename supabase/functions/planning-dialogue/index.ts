import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `אתה יועץ מומחה לאפיון ותכנון מערכות דיגיטליות - אתרים, אפליקציות, ומערכות SaaS.

אתה עוזר לסוכנות דיגיטלית לתכנן ולבנות מערכות בצורה מקצועית ומובנית.

הנחיות:
1. ענה בעברית תקנית ומקצועית
2. היה ספציפי ומעשי - תן דוגמאות קוד ו-pseudocode כשרלוונטי
3. התייחס לקונטקסט של השיחה הקודמת
4. חשוב על ארכיטקטורה, UX, ביצועים ואבטחה
5. הצע פתרונות מודרניים (React, TypeScript, Supabase, AI)
6. סכם בנקודות מפתח בסוף כל תשובה`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openrouterApiKey) {
      throw new Error('Missing OPENROUTER_API_KEY');
    }

    const { sessionId, partNumber, title, prompt, previousContext } = await req.json();

    console.log(`Processing dialogue part ${partNumber}: ${title}`);

    // Build messages with context
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    if (previousContext && previousContext.length > 0) {
      messages.push({
        role: 'assistant',
        content: `הנה סיכום השיחה עד כה:\n\n${previousContext}`
      });
    }

    messages.push({
      role: 'user',
      content: `${title}\n\n${prompt}`
    });

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://jiy.co.il',
        'X-Title': 'JIY System Planning'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages,
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content || 'לא התקבלה תשובה';
    const tokensUsed = data.usage?.total_tokens || 0;

    // Extract key points
    const keyPoints: string[] = [];
    const lines = answer.split('\n');
    let inKeyPoints = false;
    
    for (const line of lines) {
      if (line.includes('נקודות מפתח') || line.includes('סיכום') || line.includes('עיקרי')) {
        inKeyPoints = true;
        continue;
      }
      if (inKeyPoints && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))) {
        keyPoints.push(line.replace(/^[-•\d.]+\s*/, '').trim());
      }
    }

    // Save to database
    if (supabaseUrl && supabaseKey && sessionId) {
      try {
        const saveResponse = await fetch(`${supabaseUrl}/rest/v1/planning_dialogue_parts`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            session_id: sessionId,
            part_number: partNumber,
            title,
            prompt,
            response: answer,
            key_points: keyPoints,
            status: 'completed',
            tokens_used: tokensUsed,
            model_used: 'claude-sonnet-4',
            completed_at: new Date().toISOString()
          })
        });

        if (!saveResponse.ok) {
          console.error('Error saving to DB:', await saveResponse.text());
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    return new Response(
      JSON.stringify({
        answer,
        keyPoints: keyPoints.slice(0, 5),
        tokensUsed,
        partNumber,
        title
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
