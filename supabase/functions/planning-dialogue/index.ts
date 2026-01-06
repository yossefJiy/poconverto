import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Default system prompt if not provided in template
const DEFAULT_SYSTEM_PROMPT = `אתה יועץ מומחה לאפיון ותכנון מערכות דיגיטליות - אתרים, אפליקציות, ומערכות SaaS.

אתה עוזר לסוכנות דיגיטלית לתכנן ולבנות מערכות בצורה מקצועית ומובנית.

הנחיות:
1. ענה בעברית תקנית ומקצועית
2. היה ספציפי ומעשי - תן דוגמאות קוד ו-pseudocode כשרלוונטי
3. התייחס לקונטקסט של השיחה הקודמת
4. חשוב על ארכיטקטורה, UX, ביצועים ואבטחה
5. הצע פתרונות מודרניים (React, TypeScript, Supabase, AI)
6. סכם בנקודות מפתח בסוף כל תשובה`;

// Context limits
const KEY_POINTS_MAX_CHARS = 500;
const QUESTION_MAX_CHARS = 300;
const MAX_PREVIOUS_MESSAGES = 2;

interface KeyPoint {
  partId: number;
  points: string[];
}

interface PreviousQuestion {
  partId: number;
  title: string;
  prompt: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  partId?: number;
}

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

    const { 
      sessionId, 
      partNumber, 
      title, 
      prompt, 
      previousContext,
      // New optimized context fields
      systemPrompt,
      backgroundContext,
      keyPoints,
      previousQuestions,
      recentMessages,
      type = 'structured' // 'structured' | 'freeform'
    } = await req.json();

    console.log(`Processing dialogue part ${partNumber}: ${title}, type: ${type}`);

    // Build optimized messages array
    const messages: { role: string; content: string }[] = [];

    // 1. System prompt (constant, benefits from prompt caching)
    const finalSystemPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;
    messages.push({ role: 'system', content: finalSystemPrompt });

    // 2. Background context (constant, benefits from prompt caching)
    if (backgroundContext) {
      messages.push({
        role: 'user',
        content: `מידע רקע על הפרויקט:\n${backgroundContext}`
      });
      messages.push({
        role: 'assistant',
        content: 'הבנתי את הרקע. אני מוכן לעזור בתכנון.'
      });
    }

    // 3. Key points from previous parts (limited to KEY_POINTS_MAX_CHARS)
    if (keyPoints && Array.isArray(keyPoints) && keyPoints.length > 0) {
      let keyPointsText = 'נקודות מפתח מהשיחה עד כה:\n';
      let currentLength = keyPointsText.length;
      
      for (const kp of keyPoints as KeyPoint[]) {
        for (const point of kp.points) {
          const pointText = `• ${point}\n`;
          if (currentLength + pointText.length <= KEY_POINTS_MAX_CHARS) {
            keyPointsText += pointText;
            currentLength += pointText.length;
          }
        }
      }
      
      if (keyPointsText.length > 'נקודות מפתח מהשיחה עד כה:\n'.length) {
        messages.push({
          role: 'assistant',
          content: keyPointsText.trim()
        });
      }
    }

    // 4. Previous questions (shortened, MAX QUESTION_MAX_CHARS each)
    if (previousQuestions && Array.isArray(previousQuestions) && previousQuestions.length > 0) {
      let questionsText = 'שאלות שכבר נדונו:\n';
      for (const q of previousQuestions as PreviousQuestion[]) {
        const shortPrompt = q.prompt.length > QUESTION_MAX_CHARS 
          ? q.prompt.substring(0, QUESTION_MAX_CHARS) + '...'
          : q.prompt;
        questionsText += `${q.partId}. ${q.title}: ${shortPrompt}\n`;
      }
      messages.push({
        role: 'assistant',
        content: questionsText.trim()
      });
    }

    // 5. Recent messages (last 2 full messages)
    if (recentMessages && Array.isArray(recentMessages)) {
      const lastMessages = (recentMessages as Message[]).slice(-MAX_PREVIOUS_MESSAGES * 2);
      for (const msg of lastMessages) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    } 
    // Legacy: support old format
    else if (previousContext && typeof previousContext === 'string' && previousContext.length > 0) {
      messages.push({
        role: 'assistant',
        content: `הנה סיכום השיחה עד כה:\n\n${previousContext}`
      });
    }

    // 6. Current question (no limit)
    messages.push({
      role: 'user',
      content: `${title}\n\n${prompt}`
    });

    console.log(`Total messages: ${messages.length}, estimated tokens: ${JSON.stringify(messages).length / 4}`);

    // Call OpenRouter API with Claude
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
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const tokensUsed = data.usage?.total_tokens || 0;

    // Extract key points from response
    const extractedKeyPoints: string[] = [];
    const lines = answer.split('\n');
    let inKeyPoints = false;
    
    for (const line of lines) {
      if (line.includes('נקודות מפתח') || line.includes('סיכום') || line.includes('עיקרי')) {
        inKeyPoints = true;
        continue;
      }
      if (inKeyPoints && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))) {
        extractedKeyPoints.push(line.replace(/^[-•\d.]+\s*/, '').trim());
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
            key_points: extractedKeyPoints,
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

    // Calculate estimated savings from prompt caching and context optimization
    const estimatedOriginalTokens = tokensUsed * 1.5; // Rough estimate of what it would have been
    const estimatedSavings = Math.round(estimatedOriginalTokens - tokensUsed);

    return new Response(
      JSON.stringify({
        answer,
        keyPoints: extractedKeyPoints.slice(0, 5),
        tokensUsed,
        inputTokens,
        outputTokens,
        estimatedSavings,
        partNumber,
        title,
        type
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
