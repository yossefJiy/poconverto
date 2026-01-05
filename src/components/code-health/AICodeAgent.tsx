import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Loader2, 
  Wrench, 
  Copy, 
  Check, 
  Trash2, 
  Search,
  Bot,
  Globe,
  ExternalLink,
  History,
  Lock,
  DollarSign,
  AlertTriangle,
  MessageSquare,
  Send,
  Code,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface CodeHealthIssue {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string | null;
}

interface AICodeAgentProps {
  issue?: CodeHealthIssue;
  onActionComplete?: () => void;
}

interface Citation {
  url: string;
  title?: string;
  favicon?: string;
}

interface QueryHistoryItem {
  id: string;
  action: string;
  model: string;
  issue_title: string | null;
  prompt_summary: string | null;
  response: string;
  estimated_cost: number;
  input_tokens: number | null;
  output_tokens: number | null;
  provider: string | null;
  created_at: string;
}

interface UsageStats {
  dailyCount: number;
  dailyCost: number;
  monthlyCount: number;
  monthlyCost: number;
  limits: {
    daily_requests_limit: number;
    daily_cost_limit: number;
    monthly_requests_limit: number;
    monthly_cost_limit: number;
  };
}

const AI_MODELS = [
  { id: 'x-ai/grok-code-fast-1', name: 'Grok Code Fast', icon: '🚀', description: 'מהיר לקוד - מומלץ!', costIndicator: '$', premium: false },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', icon: '⚡', description: 'מהיר וזול', costIndicator: '$', premium: false },
  { id: 'google/gemini-2.0-flash', name: 'Gemini Flash', icon: '💨', description: 'הכי זול', costIndicator: '$', premium: false },
  { id: 'perplexity/sonar-pro', name: 'Perplexity Sonar Pro', icon: '🔍', description: 'חיפוש אינטרנט + AI', costIndicator: '$$$', premium: true },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', icon: '🧠', description: 'ניתוח עמוק', costIndicator: '$$$', premium: true },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', icon: '🎯', description: 'מאוזן ומהיר', costIndicator: '$$$', premium: true },
  { id: 'openai/gpt-4o', name: 'GPT-4o', icon: '🚀', description: 'OpenAI מתקדם', costIndicator: '$$', premium: true },
];

export function AICodeAgent({ issue, onActionComplete }: AICodeAgentProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [executedActions, setExecutedActions] = useState<any>(null);
  const [provider, setProvider] = useState<string>('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [selectedModel, setSelectedModel] = useState('x-ai/grok-code-fast-1');
  const [activeTab, setActiveTab] = useState('chat');
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastUsage, setLastUsage] = useState<{ inputTokens: number; outputTokens: number; estimatedCost: number } | null>(null);
  
  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [codeInput, setCodeInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [conversations, setConversations] = useState<{ id: string; title: string; updated_at: string }[]>([]);

  // Check if user is admin/manager
  useEffect(() => {
    const checkRole = async () => {
      if (!user?.id) return;
      const { data } = await supabase.rpc('get_user_role', { _user_id: user.id });
      setIsAdmin(data === 'admin' || data === 'super_admin' || data === 'agency_manager');
    };
    checkRole();
  }, [user?.id]);

  // Fetch usage stats
  useEffect(() => {
    const fetchUsageStats = async () => {
      if (!user?.id) return;

      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // Get today's usage
      const { data: todayData } = await supabase
        .from('ai_query_history')
        .select('estimated_cost')
        .eq('created_by', user.id)
        .gte('created_at', today);

      // Get monthly usage
      const { data: monthData } = await supabase
        .from('ai_query_history')
        .select('estimated_cost')
        .eq('created_by', user.id)
        .gte('created_at', monthStart);

      // Get limits
      const { data: limits } = await supabase
        .from('ai_usage_limits')
        .select('*')
        .or(`target_id.eq.${user.id},limit_type.eq.global`)
        .order('limit_type', { ascending: true })
        .limit(1);

      const userLimits = limits?.[0] || {
        daily_requests_limit: 50,
        daily_cost_limit: 5.00,
        monthly_requests_limit: 500,
        monthly_cost_limit: 50.00,
      };

      setUsageStats({
        dailyCount: todayData?.length || 0,
        dailyCost: todayData?.reduce((sum, r) => sum + Number(r.estimated_cost || 0), 0) || 0,
        monthlyCount: monthData?.length || 0,
        monthlyCost: monthData?.reduce((sum, r) => sum + Number(r.estimated_cost || 0), 0) || 0,
        limits: userLimits,
      });
    };

    if (isOpen) {
      fetchUsageStats();
    }
  }, [user?.id, isOpen, response]);

  // Fetch query history
  const fetchHistory = async () => {
    if (!user?.id) return;
    setHistoryLoading(true);
    
    const { data, error } = await supabase
      .from('ai_query_history')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setQueryHistory(data as QueryHistoryItem[]);
    }
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
    if (activeTab === 'chat') {
      fetchConversations();
    }
  }, [activeTab, user?.id]);

  // Fetch conversations
  const fetchConversations = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('chat_conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .eq('agent_type', 'code_review')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setConversations(data);
    }
  };

  // Create new conversation
  const createConversation = async () => {
    if (!user?.id) return null;
    
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        agent_type: 'code_review',
        title: 'שיחה חדשה',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
    
    setChatConversationId(data.id);
    setChatMessages([]);
    fetchConversations();
    return data.id;
  };

  // Load conversation messages
  const loadConversation = async (convId: string) => {
    setChatConversationId(convId);
    const { data } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setChatMessages(data);
    }
  };

  // Send chat message
  const sendChatMessage = async () => {
    if (!chatMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    const userMessage = chatMessage;
    setChatMessage('');
    
    // Add user message to UI immediately
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    try {
      // Create conversation if needed
      let convId = chatConversationId;
      if (!convId) {
        convId = await createConversation();
        if (!convId) throw new Error('Failed to create conversation');
      }
      
      const { data, error } = await supabase.functions.invoke('ai-code-analyzer', {
        body: {
          action: 'chat',
          message: userMessage,
          conversationId: convId,
          model: selectedModel,
          userId: user?.id,
        }
      });

      if (error) throw error;

      if (data.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        setLastUsage(data.usage || null);
        
        // Update conversation title after first message
        if (chatMessages.length === 0) {
          const title = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '');
          await supabase
            .from('chat_conversations')
            .update({ title })
            .eq('id', convId);
          fetchConversations();
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('שגיאה בשליחת ההודעה');
      setChatMessages(prev => prev.slice(0, -1)); // Remove failed user message
    } finally {
      setIsLoading(false);
    }
  };

  const runAction = async (action: 'analyze' | 'suggest-fix' | 'scan-duplicates' | 'auto-close') => {
    setIsLoading(true);
    setCurrentAction(action);
    setResponse(null);
    setExecutedActions(null);
    setCitations([]);
    setProvider('');
    setLastUsage(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-code-analyzer', {
        body: {
          action,
          issueId: issue?.id,
          issueTitle: issue?.title,
          issueDescription: issue?.description,
          category: issue?.category,
          model: selectedModel,
          userId: user?.id,
        }
      });

      if (error) throw error;

      if (data.success) {
        setResponse(data.response);
        setExecutedActions(data.executedActions);
        setProvider(data.provider || '');
        setCitations(data.citations || []);
        setLastUsage(data.usage || null);
        
        if (action === 'auto-close' && data.executedActions?.closedIds?.length > 0) {
          toast.success(`נסגרו ${data.executedActions.closedIds.length} בעיות אוטומטית`);
          onActionComplete?.();
        }
      } else {
        if (data.limitType) {
          toast.error(data.error, {
            description: 'פנה למנהל להגדלת המכסה',
          });
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      }
    } catch (error) {
      console.error('AI Code Agent error:', error);
      toast.error('שגיאה בהפעלת סוכן ה-AI');
      setResponse('שגיאה בהפעלת סוכן ה-AI. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      toast.success('הועתק ללוח');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('שגיאה בהעתקה');
    }
  };

  const actionLabels = {
    'analyze': 'ניתוח',
    'suggest-fix': 'הצעת פתרון',
    'scan-duplicates': 'סריקת כפילויות',
    'auto-close': 'סגירה אוטומטית',
  };

  const canUsePremiumModel = (modelId: string) => {
    const model = AI_MODELS.find(m => m.id === modelId);
    if (!model?.premium) return true;
    return isAdmin;
  };

  const dailyPercent = usageStats ? (usageStats.dailyCost / usageStats.limits.daily_cost_limit) * 100 : 0;
  const monthlyPercent = usageStats ? (usageStats.monthlyCost / usageStats.limits.monthly_cost_limit) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {issue ? (
          <Button size="sm" variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" />
            AI
          </Button>
        ) : (
          <Button variant="outline" className="gap-2">
            <Bot className="h-4 w-4" />
            סוכן AI לקוד
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            סוכן AI לבריאות קוד
            {issue && (
              <Badge variant="outline" className="mr-2">
                {issue.title}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              צ'אט
            </TabsTrigger>
            <TabsTrigger value="agent" className="gap-2">
              <Sparkles className="h-4 w-4" />
              סוכן
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              היסטוריה
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="flex gap-4 flex-1 min-h-0">
              {/* Conversations List */}
              <div className="w-48 flex-shrink-0 border-l pl-4 flex flex-col gap-2">
                <Button size="sm" onClick={createConversation} className="w-full gap-2">
                  <MessageSquare className="h-4 w-4" />
                  שיחה חדשה
                </Button>
                <ScrollArea className="flex-1">
                  <div className="space-y-1">
                    {conversations.map(conv => (
                      <Button
                        key={conv.id}
                        variant={chatConversationId === conv.id ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start text-xs truncate"
                        onClick={() => loadConversation(conv.id)}
                      >
                        {conv.title || 'שיחה ללא כותרת'}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Model Selector */}
                <div className="mb-3">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="w-[200px] h-8">
                      <SelectValue>
                        {AI_MODELS.find(m => m.id === selectedModel)?.icon}{' '}
                        {AI_MODELS.find(m => m.id === selectedModel)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.filter(m => canUsePremiumModel(m.id)).map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          <span>{model.icon} {model.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Code Input Area */}
                <div className="mb-3 p-3 border rounded-lg bg-background">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">הדבק קוד לניתוח</span>
                    <Input
                      placeholder="שם הקובץ (אופציונלי)"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="w-40 h-7 text-xs"
                      dir="ltr"
                    />
                  </div>
                  <Textarea
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="הדבק כאן קוד TypeScript/React לניתוח..."
                    className="font-mono text-sm min-h-[100px] resize-y"
                    dir="ltr"
                  />
                  {codeInput && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const prompt = `נתח את הקוד הבא${fileName ? ` מהקובץ ${fileName}` : ''}:\n\n\`\`\`typescript\n${codeInput}\n\`\`\`\n\nבדוק:\n1. פונקציות ריקות או placeholder\n2. בעיות RTL\n3. Mock data שצריך להחליף\n4. בעיות UI/UX\n5. שיפורים אפשריים`;
                          setChatMessage(prompt);
                        }}
                      >
                        <Search className="h-3 w-3 ml-1" />
                        נתח קוד
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const prompt = `מצא בעיות RTL בקוד הבא${fileName ? ` (${fileName})` : ''}:\n\n\`\`\`typescript\n${codeInput}\n\`\`\`\n\nבדוק direction, text-align, flexbox order, margins/paddings שצריכים להיות הפוכים בעברית.`;
                          setChatMessage(prompt);
                        }}
                      >
                        <Globe className="h-3 w-3 ml-1" />
                        בדוק RTL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const prompt = `מצא פונקציות ריקות, TODO, placeholder, והערות FIXME בקוד${fileName ? ` (${fileName})` : ''}:\n\n\`\`\`typescript\n${codeInput}\n\`\`\``;
                          setChatMessage(prompt);
                        }}
                      >
                        <AlertTriangle className="h-3 w-3 ml-1" />
                        מצא ריקים
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCodeInput('');
                          setFileName('');
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 border rounded-lg p-4 mb-3 bg-muted/30">
                  <div className="space-y-4">
                    {chatMessages.length === 0 && !codeInput ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>שלום! אני Grok - סוכן AI לניתוח קוד.</p>
                        <p className="text-sm mt-2">הדבק קוד למעלה או שאל אותי שאלה.</p>
                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                          <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setChatMessage('סרוק את כל הקוד ומצא פונקציות ריקות')}>
                            🔍 מצא פונקציות ריקות
                          </Badge>
                          <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setChatMessage('בדוק בעיות RTL בפרויקט')}>
                            🌐 בדוק RTL
                          </Badge>
                          <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setChatMessage('מצא Mock data שצריך להחליף')}>
                            📦 מצא Mock Data
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                            {msg.role === 'user' ? '👤' : '🤖'}
                          </div>
                          <div className={`flex-1 p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary/10' : 'bg-background border'}`}>
                            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="p-2 rounded-lg bg-background border">🤖</div>
                        <div className="flex-1 p-3 rounded-lg bg-background border">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="flex gap-2">
                  <Textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="שאל על הקוד שלך..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendChatMessage();
                      }
                    }}
                  />
                  <Button onClick={sendChatMessage} disabled={isLoading || !chatMessage.trim()} className="self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Usage Info */}
                {lastUsage && (
                  <div className="text-xs text-muted-foreground mt-2 flex gap-4">
                    <span>Tokens: {lastUsage.inputTokens} → {lastUsage.outputTokens}</span>
                    <span>עלות: ${lastUsage.estimatedCost.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="agent" className="flex-1 flex flex-col min-h-0 space-y-4 mt-4">
            {/* Usage Stats Bar */}
            {usageStats && (
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>שימוש יומי</span>
                    <span className={dailyPercent >= 80 ? 'text-destructive font-medium' : ''}>
                      ${usageStats.dailyCost.toFixed(2)} / ${usageStats.limits.daily_cost_limit}
                    </span>
                  </div>
                  <Progress 
                    value={dailyPercent} 
                    className={`h-2 ${dailyPercent >= 80 ? '[&>div]:bg-destructive' : ''}`}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>שימוש חודשי</span>
                    <span className={monthlyPercent >= 80 ? 'text-destructive font-medium' : ''}>
                      ${usageStats.monthlyCost.toFixed(2)} / ${usageStats.limits.monthly_cost_limit}
                    </span>
                  </div>
                  <Progress 
                    value={monthlyPercent} 
                    className={`h-2 ${monthlyPercent >= 80 ? '[&>div]:bg-destructive' : ''}`}
                  />
                </div>
              </div>
            )}

            {/* Model Selector & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <TooltipProvider>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="w-[220px] h-9">
                    <SelectValue>
                      {AI_MODELS.find(m => m.id === selectedModel)?.icon}{' '}
                      {AI_MODELS.find(m => m.id === selectedModel)?.name}
                      <span className="mr-1 text-xs text-muted-foreground">
                        {AI_MODELS.find(m => m.id === selectedModel)?.costIndicator}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => {
                      const canUse = canUsePremiumModel(model.id);
                      return (
                        <Tooltip key={model.id}>
                          <TooltipTrigger asChild>
                            <SelectItem 
                              value={model.id} 
                              disabled={!canUse}
                              className={!canUse ? 'opacity-50' : ''}
                            >
                              <div className="flex items-center gap-2 w-full">
                                <span>{model.icon}</span>
                                <div className="flex flex-col flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{model.name}</span>
                                    <span className="text-xs text-amber-500">{model.costIndicator}</span>
                                    {model.premium && !canUse && (
                                      <Lock className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">{model.description}</span>
                                </div>
                              </div>
                            </SelectItem>
                          </TooltipTrigger>
                          {!canUse && (
                            <TooltipContent>
                              <p>מודל זה זמין למנהלים בלבד</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </SelectContent>
                </Select>
              </TooltipProvider>
              
              <div className="flex flex-wrap gap-2">
                {issue ? (
                  <>
                    <Button
                      size="sm"
                      variant={currentAction === 'analyze' ? 'default' : 'outline'}
                      onClick={() => runAction('analyze')}
                      disabled={isLoading}
                    >
                      <Search className="h-4 w-4 mr-1" />
                      נתח בעיה
                    </Button>
                    <Button
                      size="sm"
                      variant={currentAction === 'suggest-fix' ? 'default' : 'outline'}
                      onClick={() => runAction('suggest-fix')}
                      disabled={isLoading}
                    >
                      <Wrench className="h-4 w-4 mr-1" />
                      הצע פתרון קוד
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant={currentAction === 'scan-duplicates' ? 'default' : 'outline'}
                      onClick={() => runAction('scan-duplicates')}
                      disabled={isLoading}
                    >
                      <Search className="h-4 w-4 mr-1" />
                      סרוק כפילויות
                    </Button>
                    <Button
                      size="sm"
                      variant={currentAction === 'auto-close' ? 'default' : 'outline'}
                      onClick={() => runAction('auto-close')}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      סגור לא-רלוונטיות
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Response Area */}
            <div className="flex-1 min-h-0">
              {isLoading ? (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                    <p className="text-muted-foreground">
                      מנתח עם {AI_MODELS.find(m => m.id === selectedModel)?.name}...
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {actionLabels[currentAction as keyof typeof actionLabels]}
                    </p>
                  </CardContent>
                </Card>
              ) : response ? (
                <Card className="h-full flex flex-col">
                  <CardHeader className="py-3 flex-shrink-0 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        תוצאות הניתוח
                      </CardTitle>
                      {provider && (
                        <Badge variant="outline" className="text-xs gap-1">
                          {provider.includes('perplexity') && <Globe className="h-3 w-3" />}
                          {provider.includes('perplexity') ? 'חיפוש אינטרנט' : provider}
                        </Badge>
                      )}
                      {lastUsage && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${lastUsage.estimatedCost.toFixed(4)}
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyToClipboard}
                      className="h-8"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 pt-0">
                    <ScrollArea className="h-[300px]">
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                        {response}
                      </div>
                    </ScrollArea>
                    
                    {/* Citations Cards */}
                    {citations.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          מקורות ({citations.length})
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {citations.slice(0, 6).map((citation, idx) => {
                            const url = typeof citation === 'string' ? citation : citation.url;
                            const hostname = new URL(url).hostname.replace('www.', '');
                            const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
                            const title = typeof citation === 'object' && citation.title 
                              ? citation.title 
                              : hostname;
                            
                            return (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 p-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                              >
                                <img 
                                  src={faviconUrl} 
                                  alt=""
                                  className="w-5 h-5 rounded flex-shrink-0 mt-0.5"
                                  onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23888"><circle cx="12" cy="12" r="10"/></svg>';
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                    {title}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {hostname}
                                  </p>
                                </div>
                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </a>
                            );
                          })}
                        </div>
                        {citations.length > 6 && (
                          <p className="text-xs text-muted-foreground mt-2 text-center">
                            +{citations.length - 6} מקורות נוספים
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center bg-muted/30">
                  <CardContent className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {issue 
                        ? 'לחץ על אחת הפעולות לניתוח הבעיה'
                        : 'לחץ על אחת הפעולות לסריקת כל הבעיות'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      מודל נבחר: {AI_MODELS.find(m => m.id === selectedModel)?.name}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Executed Actions Summary */}
            {executedActions && (
              <Card className="border-green-500/30 bg-green-500/5">
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>
                      {currentAction === 'auto-close' && executedActions.closedIds && (
                        <>נסגרו {executedActions.closedIds.length} בעיות אוטומטית</>
                      )}
                      {currentAction === 'scan-duplicates' && executedActions.duplicates && (
                        <>נמצאו {executedActions.duplicates.length} קבוצות כפילויות</>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="flex-1 min-h-0 mt-4">
            <Card className="h-full">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" />
                  היסטוריית שאילתות
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : queryHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>אין היסטוריית שאילתות</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="divide-y">
                      {queryHistory.map((item) => (
                        <div 
                          key={item.id} 
                          className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setResponse(item.response);
                            setActiveTab('agent');
                            setProvider(item.provider || '');
                          }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {actionLabels[item.action as keyof typeof actionLabels] || item.action}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {AI_MODELS.find(m => m.id === item.model)?.name || item.model}
                                </span>
                              </div>
                              {item.issue_title && (
                                <p className="text-sm font-medium truncate">{item.issue_title}</p>
                              )}
                              <p className="text-xs text-muted-foreground truncate">
                                {item.prompt_summary}
                              </p>
                            </div>
                            <div className="text-left flex-shrink-0">
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(item.created_at), 'dd/MM HH:mm', { locale: he })}
                              </p>
                              <p className="text-xs text-amber-600">
                                ${Number(item.estimated_cost || 0).toFixed(4)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
