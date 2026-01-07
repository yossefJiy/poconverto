import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Loader2, RotateCcw, History, Settings2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDynamicModules } from '@/hooks/useDynamicModules';
import { useClient } from '@/hooks/useClient';
import { RatingWidget } from './RatingWidget';
import { TaskTypeSelector, ComplexityBadge } from './TaskTypeSelector';
import { cn } from '@/lib/utils';

export function DynamicModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const { selectedClient } = useClient();
  const { 
    useModule, 
    useModuleTemplates, 
    useModuleSessions, 
    useSessionMessages, 
    sendMessage,
    rateMessage,
    correctTaskType
  } = useDynamicModules();

  const { data: module, isLoading: moduleLoading } = useModule(slug || '');
  const { data: templates } = useModuleTemplates(module?.id || '');
  const { data: sessions } = useModuleSessions(module?.id || '');

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useSessionMessages(activeSessionId || '');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !slug || isLoading) return;

    setIsLoading(true);
    try {
      const previousMessages = messages?.map(m => ({
        role: m.role,
        content: m.content
      })) || [];

      const result = await sendMessage.mutateAsync({
        moduleSlug: slug,
        sessionId: activeSessionId || undefined,
        templateId: selectedTemplateId || undefined,
        clientId: selectedClient?.id,
        prompt: input,
        previousMessages
      });

      if (result.sessionId && !activeSessionId) {
        setActiveSessionId(result.sessionId);
      }

      setInput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setSelectedTemplateId(null);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (moduleLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!module) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">מודול לא נמצא</h1>
          <p className="text-muted-foreground mt-2">המודול "{slug}" לא קיים או אינו פעיל</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title={module.name}
        description={module.description || undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleNewSession}>
              <RotateCcw className="w-4 h-4 ml-1" />
              שיחה חדשה
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-[calc(100vh-220px)] flex flex-col">
            <CardHeader className="shrink-0 py-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{module.ai_model.split('/')[1]}</Badge>
                  {selectedTemplateId && templates && (
                    <Badge variant="secondary">
                      {templates.find(t => t.id === selectedTemplateId)?.name}
                    </Badge>
                  )}
                </div>
                {activeSessionId && (
                  <span className="text-xs text-muted-foreground">
                    Session: {activeSessionId.slice(0, 8)}...
                  </span>
                )}
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {(!messages || messages.length === 0) ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg mb-2">👋 שלום!</p>
                    <p>התחל שיחה עם {module.name}</p>
                    {templates && templates.length > 1 && (
                      <p className="text-sm mt-4">או בחר תבנית מהצד</p>
                    )}
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-3',
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-lg p-3',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                        
                        {msg.role === 'assistant' && (
                          <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {msg.task_category && msg.task_type && (
                                <TaskTypeSelector
                                  category={msg.task_category}
                                  currentType={msg.user_corrected_type || msg.task_type}
                                  aiClassifiedType={msg.ai_classified_type}
                                  onCorrect={(newType) => correctTaskType.mutate({ 
                                    messageId: msg.id, 
                                    correctedType: newType 
                                  })}
                                />
                              )}
                              {msg.task_complexity && (
                                <ComplexityBadge complexity={msg.task_complexity} />
                              )}
                            </div>
                            <RatingWidget
                              messageId={msg.id}
                              currentRating={msg.user_rating || undefined}
                              onRate={(rating, feedback) => 
                                rateMessage.mutate({ messageId: msg.id, rating, feedback })
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="shrink-0 p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="הקלד הודעה..."
                  className="min-h-[44px] max-h-32 resize-none"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="shrink-0 h-11 w-11"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Templates */}
          {templates && templates.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  תבניות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    variant={selectedTemplateId === template.id ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start text-right"
                    onClick={() => {
                      setSelectedTemplateId(template.id);
                      handleNewSession();
                    }}
                  >
                    {template.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Session History */}
          {sessions && sessions.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="w-4 h-4" />
                  היסטוריה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {sessions.slice(0, 10).map((session) => (
                      <Button
                        key={session.id}
                        variant={activeSessionId === session.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start text-right h-auto py-2"
                        onClick={() => setActiveSessionId(session.id)}
                      >
                        <div className="flex flex-col items-start">
                          <span className="text-xs truncate max-w-full">
                            {session.title || 'שיחה ללא כותרת'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(session.created_at).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
