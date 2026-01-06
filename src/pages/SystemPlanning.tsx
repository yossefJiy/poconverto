import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  PlayCircle, 
  Send,
  Mail,
  RotateCcw,
  Loader2,
  MessageSquare,
  FileText,
  Plus,
  History,
  Sparkles,
  Edit
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { 
  SessionHistory, 
  TemplateEditor, 
  DialogueStepAccordion,
  TokenMeter 
} from "@/components/planning";

interface DialoguePart {
  id: number;
  title: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  response?: string;
  keyPoints?: string[];
}

interface PlanningTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  system_prompt?: string;
  background_context?: string;
  parts: { title: string; prompt: string }[];
}

interface PlanningSession {
  id: string;
  title: string;
  session_type: string;
  status: string;
  created_at: string;
}

const SystemPlanning = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState("dialogue");
  const [templates, setTemplates] = useState<PlanningTemplate[]>([]);
  const [sessions, setSessions] = useState<PlanningSession[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PlanningTemplate | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const [dialogueParts, setDialogueParts] = useState<DialoguePart[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    partId?: number;
    keyPoints?: string[];
  }>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPartIndex, setCurrentPartIndex] = useState<number | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [emailAddress, setEmailAddress] = useState("yossef@jiy.co.il");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [estimatedSavings, setEstimatedSavings] = useState(0);
  
  // Template editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PlanningTemplate | null>(null);
  
  const isAdmin = role === 'super_admin' || role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadTemplates();
      loadSessions();
    }
  }, [isAdmin]);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('planning_templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (data) {
      setTemplates(data.map(t => ({
        ...t,
        parts: t.parts as { title: string; prompt: string }[],
        system_prompt: t.system_prompt || undefined,
        background_context: t.background_context || undefined
      })));
      
      if (data.length > 0 && !selectedTemplate) {
        const template = {
          ...data[0],
          parts: data[0].parts as { title: string; prompt: string }[],
          system_prompt: data[0].system_prompt || undefined,
          background_context: data[0].background_context || undefined
        };
        setSelectedTemplate(template);
        initializeDialogueParts(template);
      }
    }
  };

  const loadSessions = async () => {
    const { data } = await supabase
      .from('planning_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setSessions(data);
    }
  };

  const initializeDialogueParts = (template: PlanningTemplate) => {
    setDialogueParts(template.parts.map((part, index) => ({
      id: index + 1,
      title: part.title,
      prompt: part.prompt,
      status: 'pending'
    })));
    setConversationHistory([]);
    setCurrentSessionId(null);
    setTotalTokensUsed(0);
    setEstimatedSavings(0);
  };

  const createSession = async (template: PlanningTemplate): Promise<string | null> => {
    const { data, error } = await supabase
      .from('planning_sessions')
      .insert({
        title: `${template.name} - ${new Date().toLocaleDateString('he-IL')}`,
        session_type: template.template_type,
        user_id: user?.id
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating session:', error);
      return null;
    }
    
    return data.id;
  };

  // Build optimized context for the API
  const buildOptimizedContext = () => {
    // Extract key points from completed parts
    const keyPoints = dialogueParts
      .filter(p => p.status === 'completed' && p.keyPoints && p.keyPoints.length > 0)
      .map(p => ({
        partId: p.id,
        points: p.keyPoints || []
      }));

    // Get previous questions (all completed parts)
    const previousQuestions = dialogueParts
      .filter(p => p.status === 'completed')
      .map(p => ({
        partId: p.id,
        title: p.title,
        prompt: p.prompt
      }));

    // Get last 2 messages
    const recentMessages = conversationHistory.slice(-4);

    return {
      systemPrompt: selectedTemplate?.system_prompt,
      backgroundContext: selectedTemplate?.background_context,
      keyPoints,
      previousQuestions,
      recentMessages
    };
  };

  const runSinglePart = async (partIndex: number, customPrompt?: string) => {
    if (!selectedTemplate) return;
    
    const part = dialogueParts[partIndex];
    if (!part) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createSession(selectedTemplate);
      if (!sessionId) {
        toast.error("שגיאה ביצירת מפגש");
        return;
      }
      setCurrentSessionId(sessionId);
    }

    setCurrentPartIndex(partIndex);
    setDialogueParts(prev => prev.map((p, i) => 
      i === partIndex ? { ...p, status: 'running' } : p
    ));

    const optimizedContext = buildOptimizedContext();
    const promptToUse = customPrompt || part.prompt;

    try {
      const response = await supabase.functions.invoke('planning-dialogue', {
        body: {
          sessionId,
          partNumber: part.id,
          title: part.title,
          prompt: promptToUse,
          type: 'structured',
          ...optimizedContext
        }
      });

      if (response.error) throw response.error;

      const { answer, keyPoints, tokensUsed, estimatedSavings: savings } = response.data;

      setDialogueParts(prev => prev.map((p, i) => 
        i === partIndex ? { ...p, status: 'completed', response: answer, keyPoints } : p
      ));

      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: `**${part.title}**\n\n${promptToUse}`, partId: part.id },
        { role: 'assistant', content: answer, partId: part.id, keyPoints }
      ]);

      setTotalTokensUsed(prev => prev + (tokensUsed || 0));
      setEstimatedSavings(prev => prev + (savings || 0));

      toast.success(`${part.title} הושלם`);
    } catch (error) {
      console.error('Error running dialogue part:', error);
      setDialogueParts(prev => prev.map((p, i) => 
        i === partIndex ? { ...p, status: 'error' } : p
      ));
      toast.error("שגיאה בהרצת החלק");
    } finally {
      setCurrentPartIndex(null);
    }
  };

  const runAllParts = async () => {
    if (isRunning) return;
    setIsRunning(true);

    for (let i = 0; i < dialogueParts.length; i++) {
      if (dialogueParts[i].status !== 'completed') {
        await runSinglePart(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsRunning(false);
    toast.success("כל חלקי הדיאלוג הושלמו!");
  };

  const resetDialogue = () => {
    if (selectedTemplate) {
      initializeDialogueParts(selectedTemplate);
      toast.info("הדיאלוג אופס");
    }
  };

  const startNewSession = () => {
    if (selectedTemplate) {
      initializeDialogueParts(selectedTemplate);
      setActiveTab("dialogue");
      toast.info("שיחה חדשה נוצרה");
    }
  };

  const sendCustomMessage = async () => {
    if (!customMessage.trim() || !currentSessionId) return;

    const userMessage = customMessage;
    setCustomMessage("");

    setConversationHistory(prev => [
      ...prev,
      { role: 'user', content: userMessage }
    ]);

    const optimizedContext = buildOptimizedContext();

    try {
      const response = await supabase.functions.invoke('planning-dialogue', {
        body: {
          sessionId: currentSessionId,
          partNumber: 0,
          title: 'שאלה חופשית',
          prompt: userMessage,
          type: 'freeform',
          ...optimizedContext
        }
      });

      if (response.error) throw response.error;

      const { tokensUsed, estimatedSavings: savings } = response.data;

      setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', content: response.data.answer }
      ]);

      setTotalTokensUsed(prev => prev + (tokensUsed || 0));
      setEstimatedSavings(prev => prev + (savings || 0));
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("שגיאה בשליחת ההודעה");
    }
  };

  const sendSummaryEmail = async () => {
    if (!emailAddress.trim() || !currentSessionId) {
      toast.error("יש להזין כתובת מייל ולהריץ לפחות חלק אחד");
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await supabase.functions.invoke('planning-summary', {
        body: {
          sessionId: currentSessionId,
          email: emailAddress
        }
      });

      if (response.error) throw response.error;

      toast.success(`סיכום נשלח ל-${emailAddress}`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error("שגיאה בשליחת המייל");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const selectTemplate = (template: PlanningTemplate) => {
    setSelectedTemplate(template);
    initializeDialogueParts(template);
  };

  const handleEditTemplate = (template: PlanningTemplate) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleSessionSelect = async (sessionId: string) => {
    // Load session data and display
    toast.info("טעינת מפגש...");
    // TODO: Implement session loading
  };

  const completedParts = dialogueParts.filter(p => p.status === 'completed').length;

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout>
      <DomainErrorBoundary domain="planning">
        <div className="container mx-auto p-6 space-y-6" dir="rtl">
          <div className="flex items-center justify-between">
            <PageHeader
              title="אפיון ותכנון מערכות"
              description="דיאלוג מובנה עם AI לתכנון אתרים ואפליקציות"
            />
            <Button onClick={startNewSession} className="gap-2">
              <Plus className="h-4 w-4" />
              שיחה חדשה
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="dialogue" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                דיאלוג
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                תבניות
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                היסטוריה
              </TabsTrigger>
            </TabsList>

            {/* Dialogue Tab */}
            <TabsContent value="dialogue" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Dialogue Parts Panel */}
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        שלבי הדיאלוג
                      </CardTitle>
                      <Badge variant="outline">
                        {completedParts}/{dialogueParts.length}
                      </Badge>
                    </div>
                    {selectedTemplate && (
                      <CardDescription>{selectedTemplate.name}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <DialogueStepAccordion
                      parts={dialogueParts}
                      onRunPart={runSinglePart}
                      isRunning={isRunning}
                      currentPartIndex={currentPartIndex}
                    />

                    <div className="flex gap-2 pt-3">
                      <Button 
                        onClick={runAllParts} 
                        disabled={isRunning || completedParts === dialogueParts.length}
                        className="flex-1"
                      >
                        {isRunning ? (
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        ) : (
                          <PlayCircle className="h-4 w-4 ml-2" />
                        )}
                        הרץ הכל
                      </Button>
                      <Button variant="outline" onClick={resetDialogue}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Token Meter */}
                    <TokenMeter 
                      tokensUsed={totalTokensUsed} 
                      estimatedSavings={estimatedSavings}
                    />

                    {/* Email Summary */}
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          placeholder="כתובת מייל לסיכום"
                          className="text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={sendSummaryEmail}
                          disabled={isSendingEmail || completedParts === 0}
                        >
                          {isSendingEmail ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Chat Area */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      שיחה עם Claude
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-4">
                        {conversationHistory.length === 0 ? (
                          <div className="text-center text-muted-foreground py-12">
                            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>בחר תבנית והרץ את הדיאלוג</p>
                            <p className="text-sm mt-2">או שלח שאלה חופשית</p>
                          </div>
                        ) : (
                          conversationHistory.map((msg, index) => (
                            <div
                              key={index}
                              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-xl p-4 ${
                                  msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                  {msg.content}
                                </div>
                                {msg.keyPoints && msg.keyPoints.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-border/50">
                                    <p className="text-xs font-medium mb-2">נקודות מפתח:</p>
                                    <ul className="space-y-1">
                                      {msg.keyPoints.map((point, i) => (
                                        <li key={i} className="text-xs opacity-90 flex items-start gap-1">
                                          <span>•</span>
                                          <span>{point}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>

                    {/* Custom Message Input */}
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Input
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="שאלה חופשית..."
                        onKeyPress={(e) => e.key === 'Enter' && sendCustomMessage()}
                        disabled={!currentSessionId}
                      />
                      <Button 
                        onClick={sendCustomMessage}
                        disabled={!customMessage.trim() || !currentSessionId}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1" onClick={() => selectTemplate(template)}>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(template);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent onClick={() => selectTemplate(template)}>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Badge variant="secondary">{template.parts.length} חלקים</Badge>
                          {template.system_prompt && (
                            <Badge variant="outline" className="text-xs">+ System Prompt</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {template.parts.slice(0, 3).map((part, i) => (
                            <div key={i} className="truncate">• {part.title}</div>
                          ))}
                          {template.parts.length > 3 && (
                            <div className="text-xs">ועוד {template.parts.length - 3}...</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Add Template Card */}
                <Card 
                  className="cursor-pointer border-dashed hover:border-primary transition-colors"
                  onClick={handleAddTemplate}
                >
                  <CardContent className="flex items-center justify-center h-full min-h-[200px]">
                    <div className="text-center text-muted-foreground">
                      <Plus className="h-8 w-8 mx-auto mb-2" />
                      <p>הוסף תבנית חדשה</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <SessionHistory 
                sessions={sessions}
                onSessionSelect={handleSessionSelect}
                onSessionsChange={loadSessions}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Template Editor Dialog */}
        <TemplateEditor
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
          template={editingTemplate}
          onSave={loadTemplates}
        />
      </DomainErrorBoundary>
    </MainLayout>
  );
};

export default SystemPlanning;
