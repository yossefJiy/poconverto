import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIContext {
  client_name?: string;
  industry?: string;
  platform?: string;
  campaign_data?: any;
  personas?: any[];
  competitors?: any[];
  brand_messages?: any[];
  goals?: any[];
}

type AIType = 'content' | 'insights' | 'strategy' | 'optimize' | 'analyze';

export function useAIMarketing() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (
    type: AIType,
    context: AIContext,
    input?: string
  ) => {
    setIsLoading(true);
    setResponse('');
    setError(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-marketing`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ type, context, input }),
        }
      );

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('חריגה ממגבלת בקשות, נסה שוב מאוחר יותר');
        }
        if (res.status === 402) {
          throw new Error('נדרש תשלום נוסף עבור שימוש ב-AI');
        }
        throw new Error('שגיאה בשירות AI');
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              setResponse(fullResponse);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      return fullResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateContent = (context: AIContext, input?: string) => 
    generate('content', context, input);

  const generateInsights = (context: AIContext) => 
    generate('insights', context);

  const generateStrategy = (context: AIContext, input?: string) => 
    generate('strategy', context, input);

  const generateOptimizations = (context: AIContext) => 
    generate('optimize', context);

  const analyzeCompetitors = (context: AIContext) => 
    generate('analyze', context);

  return {
    isLoading,
    response,
    error,
    generateContent,
    generateInsights,
    generateStrategy,
    generateOptimizations,
    analyzeCompetitors,
  };
}
