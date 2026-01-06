import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Send, 
  Loader2, 
  CheckCircle2, 
  Mail, 
  Sparkles,
  MessageSquare,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DialogQuestion {
  id: string;
  title: string;
  completed: boolean;
  answer?: string;
  keyPoints?: string[];
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  questionId?: string;
  title?: string;
  keyPoints?: string[];
}

const QUESTIONS: DialogQuestion[] = [
  { id: '1', title: 'עיצוב ממשק ופסיכולוגיה', completed: false },
  { id: '2', title: 'מבנה קומפוננטות תוכן', completed: false },
  { id: '3', title: 'ארכיטקטורת קמפיינים', completed: false },
  { id: '4', title: 'המלצות מודלי AI', completed: false },
  { id: '5', title: 'Flow עבודה ופיצ\'רים', completed: false },
];

export function ClaudeStudioChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<DialogQuestion[]>(QUESTIONS);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const runQuestion = async (questionId: string) => {
    setIsLoading(true);
    setCurrentQuestion(questionId);

    try {
      // Get previous context from completed questions
      const completedAnswers = questions
        .filter(q => q.completed && q.answer)
        .map(q => q.answer)
        .join('\n\n---\n\n');

      const { data, error } = await supabase.functions.invoke('studio-dialog', {
        body: { 
          question: questionId,
          context: completedAnswers 
        }
      });

      if (error) throw error;

      if (data.success) {
        // Update questions state
        setQuestions(prev => prev.map(q => 
          q.id === questionId 
            ? { ...q, completed: true, answer: data.answer, keyPoints: data.keyPoints }
            : q
        ));

        // Add to messages
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer,
            questionId: data.questionId,
            title: data.title,
            keyPoints: data.keyPoints
          }
        ]);

        toast.success(`שאלה ${questionId} הושלמה`);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Error running question:', error);
      toast.error(`שגיאה: ${error.message}`);
    } finally {
      setIsLoading(false);
      setCurrentQuestion(null);
    }
  };

  const runAllQuestions = async () => {
    const pendingQuestions = questions.filter(q => !q.completed);
    
    for (const question of pendingQuestions) {
      await runQuestion(question.id);
      // Small delay between questions
      await new Promise(r => setTimeout(r, 500));
    }
  };

  const sendCustomPrompt = async () => {
    if (!customPrompt.trim()) return;

    setIsLoading(true);
    const userMessage = customPrompt;
    setCustomPrompt('');

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const { data, error } = await supabase.functions.invoke('insights-chat', {
        body: { 
          message: userMessage,
          context: messages.map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response || data.answer || 'לא התקבלה תשובה' 
      }]);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('שגיאה בשליחת ההודעה');
    } finally {
      setIsLoading(false);
    }
  };

  const sendSummaryEmail = async () => {
    if (!emailAddress.trim()) {
      toast.error('נא להזין כתובת מייל');
      return;
    }

    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-studio-summary', {
        body: { email: emailAddress }
      });

      if (error) throw error;

      toast.success('המייל נשלח בהצלחה!');
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(`שגיאה בשליחת המייל: ${error.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const resetDialog = () => {
    setMessages([]);
    setQuestions(QUESTIONS.map(q => ({ ...q, completed: false, answer: undefined, keyPoints: undefined })));
    toast.info('הדיאלוג אופס');
  };

  const completedCount = questions.filter(q => q.completed).length;
  const progress = (completedCount / questions.length) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Questions Panel */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            דיאלוג Content Studio
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            5 שאלות מובנות לבניית אסטרטגיה
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>התקדמות</span>
              <span className="text-primary font-medium">{completedCount}/5</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Separator />

          {/* Questions List */}
          <div className="space-y-2">
            {questions.map((q) => (
              <Button
                key={q.id}
                variant={q.completed ? "secondary" : "outline"}
                className={cn(
                  "w-full justify-start gap-2 h-auto py-3",
                  currentQuestion === q.id && "border-primary"
                )}
                onClick={() => !q.completed && !isLoading && runQuestion(q.id)}
                disabled={isLoading}
              >
                {currentQuestion === q.id ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : q.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 shrink-0" />
                )}
                <span className="text-right flex-1 text-sm">{q.title}</span>
              </Button>
            ))}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={runAllQuestions}
              disabled={isLoading || completedCount === 5}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Sparkles className="h-4 w-4 ml-2" />
              )}
              הרץ את כל השאלות
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={resetDialog}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 ml-2" />
              התחל מחדש
            </Button>
          </div>

          {/* Email Summary */}
          {completedCount > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium">שלח סיכום במייל</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="email@example.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    dir="ltr"
                    className="text-left"
                  />
                  <Button 
                    size="icon"
                    onClick={sendSummaryEmail}
                    disabled={isSendingEmail}
                  >
                    {isSendingEmail ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            שיחה עם Claude
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages */}
          <ScrollArea className="h-[500px] px-4" ref={scrollRef}>
            <div className="space-y-4 py-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>לחץ על שאלה להתחיל את הדיאלוג</p>
                  <p className="text-sm mt-2">או הרץ את כל 5 השאלות יחד</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-3",
                      msg.role === 'user' && "flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      msg.role === 'assistant' ? "bg-primary/10" : "bg-muted"
                    )}>
                      {msg.role === 'assistant' ? (
                        <Bot className="h-4 w-4 text-primary" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </div>
                    <div className={cn(
                      "flex-1 space-y-2",
                      msg.role === 'user' && "text-left"
                    )}>
                      {msg.title && (
                        <Badge variant="outline" className="mb-2">
                          {msg.title}
                        </Badge>
                      )}
                      <div className={cn(
                        "prose prose-sm max-w-none",
                        msg.role === 'user' && "bg-muted rounded-lg p-3"
                      )}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {msg.content}
                        </div>
                      </div>
                      {msg.keyPoints && msg.keyPoints.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3 mt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">נקודות מפתח:</p>
                          <ul className="text-xs space-y-1">
                            {msg.keyPoints.map((point, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <ChevronDown className="h-3 w-3 mt-0.5 shrink-0 rotate-[-90deg]" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && !currentQuestion && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <span className="text-sm text-muted-foreground">מקליד...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Custom Input */}
          <div className="border-t p-4">
            <form 
              onSubmit={(e) => { e.preventDefault(); sendCustomPrompt(); }}
              className="flex gap-2"
            >
              <Input
                placeholder="שאל שאלה חופשית..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !customPrompt.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
