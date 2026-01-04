import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { useAuth } from "@/hooks/useAuth";
import { useAIModuleAccess } from "@/hooks/useAIModuleAccess";
import { 
  Bot, 
  Send, 
  Loader2, 
  Sparkles,
  TrendingUp,
  Target,
  Lightbulb,
  X,
  Maximize2,
  Minimize2,
  History,
  Plus,
  Globe,
  MessageSquare,
  Search,
  PenTool,
  Code,
  BarChart3,
  ChevronDown,
  Zap,
  Users,
  ShoppingCart,
  ListTodo,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  usedWebSearch?: boolean;
  modelName?: string;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

interface AIModel {
  name: string;
  description: string;
  category: string;
  available: boolean;
}

interface AIInsightsChatProps {
  performanceData?: any[];
  campaignsData?: any[];
  insightsData?: any[];
  isGlobal?: boolean; // For floating global chat
}

const quickPrompts = [
  { icon: TrendingUp, label: "שפר ROI", prompt: "איך אני יכול לשפר את ה-ROI של הקמפיינים שלי? תן לי המלצות מעשיות" },
  { icon: Target, label: "אסטרטגיית המרות", prompt: "מה האסטרטגיה הכי טובה להגדלת המרות באיקומרס?" },
  { icon: Lightbulb, label: "טכנולוגיות חדשות", prompt: "אילו טכנולוגיות וכלים חדשים כדאי לי להכיר בתחום השיווק הדיגיטלי?" },
  { icon: Sparkles, label: "הזדמנויות צמיחה", prompt: "בהתבסס על הנתונים שלי, מהן הזדמנויות הצמיחה העיקריות?" },
];

// AI Quick Actions - will appear as buttons
const aiQuickActions = [
  { 
    icon: Search, 
    label: "חפש מתחרים", 
    prompt: "חפש באינטרנט מידע על המתחרים העיקריים בתחום שלי וספק לי ניתוח השוואתי",
    model: "sonar-pro",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  { 
    icon: BarChart3, 
    label: "נתח קמפיין", 
    prompt: "נתח את הביצועים של הקמפיינים שלי והצע דרכים לשיפור",
    model: "gemini-pro",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  { 
    icon: PenTool, 
    label: "כתוב תוכן שיווקי", 
    prompt: "כתוב לי פוסט שיווקי מעניין לפייסבוק על המותג/המוצר שלי",
    model: "claude-sonnet",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  { 
    icon: ShoppingCart, 
    label: "אופטימיזציית חנות", 
    prompt: "תן לי המלצות לאופטימיזציה של חנות האיקומרס שלי לשיפור המרות",
    model: "gemini-flash",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  { 
    icon: Users, 
    label: "קהלי יעד", 
    prompt: "חפש מידע עדכני על הגדרת קהלי יעד אפקטיביים לפרסום ממומן",
    model: "sonar-pro",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  { 
    icon: Zap, 
    label: "אוטומציות", 
    prompt: "הצע לי אוטומציות שיכולות לחסוך לי זמן בעבודה השיווקית",
    model: "gemini-flash",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
];

const modelIcons: Record<string, any> = {
  'search': Globe,
  'creative': PenTool,
  'coding': Code,
  'general': Sparkles,
  'reasoning': Lightbulb,
};

export function AIInsightsChat({ performanceData = [], campaignsData = [], insightsData = [], isGlobal = false }: AIInsightsChatProps) {
  const { selectedClient } = useClient();
  const { user } = useAuth();
  const { isEnabled, canUseAI } = useAIModuleAccess('analytics');
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("auto");
  const [availableModels, setAvailableModels] = useState<Record<string, AIModel>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Task creation state
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [taskContent, setTaskContent] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<string>("medium");
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insights-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ action: 'list-models' }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          setAvailableModels(data.models || {});
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };
    fetchModels();
  }, []);

  // Fetch conversations history
  const { data: conversations = [] } = useQuery({
    queryKey: ["chat-conversations", user?.id, selectedClient?.id],
    queryFn: async () => {
      if (!user) return [];
      const query = supabase
        .from("chat_conversations")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .eq("agent_type", "insights")
        .order("updated_at", { ascending: false })
        .limit(20);
      
      if (selectedClient) {
        query.eq("client_id", selectedClient.id);
      }
      
      const { data } = await query;
      return (data || []) as Conversation[];
    },
    enabled: !!user,
  });

  // Fetch all data sources
  const { data: campaigns = [] } = useQuery({
    queryKey: ["all-campaigns", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .eq("client_id", selectedClient.id);
      return data || [];
    },
    enabled: !!selectedClient,
  });

  const { data: agentActions = [] } = useQuery({
    queryKey: ["agent-actions-insights", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data } = await supabase
        .from("ai_agent_actions")
        .select("*")
        .eq("client_id", selectedClient.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!selectedClient,
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ["integrations-insights", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data } = await supabase
        .from("integrations_safe")
        .select("*")
        .eq("client_id", selectedClient.id);
      return data || [];
    },
    enabled: !!selectedClient,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Create new conversation
  const createConversation = useMutation({
    mutationFn: async (firstMessage: string) => {
      if (!user) throw new Error("User not authenticated");
      
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: user.id,
          client_id: selectedClient?.id || null,
          agent_type: "insights",
          title,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentConversationId(data.id);
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  // Load conversation messages
  const loadConversation = async (conversationId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    if (data) {
      setMessages(data.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.created_at),
        usedWebSearch: (m.metadata as any)?.isSearchModel,
        modelName: (m.metadata as any)?.modelName,
      })));
      setCurrentConversationId(conversationId);
      setShowHistory(false);
    }
  };

  const buildContextPrompt = () => {
    const context = {
      clientName: selectedClient?.name || "לא נבחר",
      campaigns: campaigns.map(c => ({
        name: c.name,
        platform: c.platform,
        status: c.status,
        budget: c.budget,
        spent: c.spent,
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.conversions,
      })),
      pendingActions: agentActions.filter(a => a.status === "pending").length,
      connectedPlatforms: integrations.filter(i => i.is_connected).map(i => i.platform),
      performanceMetrics: performanceData.slice(-7),
      insights: insightsData.slice(0, 5),
    };

    return `
אתה סוכן AI מומחה באיקומרס, לידים, ושיווק דיגיטלי.
שמך הוא "JIY Insights Agent".

תפקידך:
1. לנתח נתוני ביצועים ולתת תובנות אסטרטגיות
2. להציע טכנולוגיות, שירותים וכלים חדשים לשיפור ביצועים
3. לייעץ על אסטרטגיות המרה ורווחיות
4. לזהות הזדמנויות צמיחה ובעיות

הקשר נוכחי:
- לקוח: ${context.clientName}
- קמפיינים פעילים: ${context.campaigns.filter(c => c.status === 'active' || c.status === 'ENABLED').length}
- פלטפורמות מחוברות: ${context.connectedPlatforms.join(', ') || 'אין'}
- פעולות ממתינות: ${context.pendingActions}

נתוני קמפיינים:
${JSON.stringify(context.campaigns.slice(0, 10), null, 2)}

הנחיות:
- ענה בעברית
- היה תמציתי אבל מקיף
- הצע פתרונות מעשיים
- ציין טכנולוגיות ספציפיות כשרלוונטי
- אם אין מספיק נתונים, הצע מה צריך לאסוף
`;
  };

  const sendMessage = async (messageText: string, modelOverride?: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Create conversation if this is the first message
      let convId = currentConversationId;
      if (!convId && user) {
        const conv = await createConversation.mutateAsync(messageText);
        convId = conv.id;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insights-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            userMessage: messageText,
            context: buildContextPrompt(),
            conversationId: convId,
            clientId: selectedClient?.id,
            userId: user?.id,
            modelKey: modelOverride || (selectedModel !== 'auto' ? selectedModel : undefined),
          }),
        }
      );

      const usedWebSearch = response.headers.get("X-Is-Search") === "true";
      const modelName = response.headers.get("X-Model-Name") || undefined;

      if (response.status === 429) {
        toast.error("יותר מדי בקשות, נסה שוב בעוד דקה");
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      if (response.status === 402) {
        toast.error("נדרש טעינת קרדיטים");
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "", 
        timestamp: new Date(),
        usedWebSearch,
        modelName,
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast.error("שגיאה בקבלת תשובה");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
  };

  // Open task dialog with AI content
  const openTaskDialog = (content: string) => {
    // Extract first line as title, rest as description
    const lines = content.trim().split('\n');
    const firstLine = lines[0].replace(/^[#*\-\d.]+\s*/, '').trim();
    const title = firstLine.slice(0, 100) + (firstLine.length > 100 ? '...' : '');
    
    setTaskTitle(title);
    setTaskContent(content);
    setTaskPriority("medium");
    setShowTaskDialog(true);
  };

  // Create task from AI insight
  const createTaskFromInsight = async () => {
    if (!selectedClient || !taskTitle.trim()) {
      toast.error("נא למלא כותרת ולבחור לקוח");
      return;
    }

    setIsCreatingTask(true);
    try {
      const { error } = await supabase.from("tasks").insert({
        title: taskTitle,
        description: taskContent,
        priority: taskPriority,
        status: "pending",
        client_id: selectedClient.id,
        category: "ai-recommendation",
      });

      if (error) throw error;

      toast.success("המשימה נוצרה בהצלחה!");
      setShowTaskDialog(false);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("שגיאה ביצירת המשימה");
    } finally {
      setIsCreatingTask(false);
    }
  };

  // If AI is disabled, show locked state
  if (!isEnabled || !canUseAI) {
    return (
      <button
        onClick={() => toast.info("יכולות AI אינן מופעלות")}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-muted shadow-lg flex items-center justify-center cursor-not-allowed opacity-70"
        title="AI לא זמין"
      >
        <Lock className="w-6 h-6 text-muted-foreground" />
      </button>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Bot className="w-6 h-6 text-primary-foreground" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed z-50 bg-background border border-border rounded-2xl shadow-2xl flex flex-col transition-all duration-300",
      isExpanded 
        ? "bottom-4 left-4 right-4 top-20" 
        : "bottom-6 left-6 w-[420px] h-[650px]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-sm">JIY Insights Agent</h3>
            <p className="text-xs text-muted-foreground">מומחה איקומרס ולידים</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Model Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                <Sparkles className="w-3 h-3" />
                {selectedModel === 'auto' ? 'אוטומטי' : availableModels[selectedModel]?.name || selectedModel}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background z-[60]">
              <DropdownMenuLabel>בחר מודל AI</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSelectedModel('auto')}>
                <Zap className="w-4 h-4 ml-2 text-primary" />
                <div>
                  <p className="font-medium">אוטומטי</p>
                  <p className="text-xs text-muted-foreground">בחירה חכמה לפי סוג השאלה</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(availableModels).map(([key, model]) => {
                const IconComponent = modelIcons[model.category] || Sparkles;
                return (
                  <DropdownMenuItem key={key} onClick={() => setSelectedModel(key)}>
                    <IconComponent className="w-4 h-4 ml-2" />
                    <div>
                      <p className="font-medium">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowHistory(!showHistory)}
            title="היסטוריית שיחות"
          >
            <History className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={startNewChat}
            title="שיחה חדשה"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* History sidebar */}
      {showHistory && (
        <div className="absolute top-16 left-0 right-0 bottom-16 bg-background z-10 border-t border-border">
          <ScrollArea className="h-full p-4">
            <h4 className="font-bold mb-3 text-sm">שיחות קודמות</h4>
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">אין שיחות קודמות</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={cn(
                      "w-full text-right p-3 rounded-lg hover:bg-muted transition-colors",
                      currentConversationId === conv.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{conv.title || "שיחה ללא כותרת"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(conv.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h4 className="font-bold mb-1">היי! אני כאן לעזור</h4>
              <p className="text-xs text-muted-foreground">
                מומחה בהפיכת מותגים לרווחיים
              </p>
            </div>

            {/* AI Quick Actions */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">פעולות מהירות:</p>
              <div className="grid grid-cols-3 gap-2">
                {aiQuickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(action.prompt, action.model)}
                    disabled={isLoading}
                    className={cn(
                      "p-2 text-center rounded-xl transition-all hover:scale-105",
                      action.bgColor,
                      "hover:shadow-md"
                    )}
                  >
                    <action.icon className={cn("w-5 h-5 mx-auto mb-1", action.color)} />
                    <span className="block text-xs font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Quick Prompts */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">שאלות נפוצות:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(prompt.prompt)}
                    disabled={isLoading}
                    className="p-2 text-right bg-muted/50 hover:bg-muted rounded-xl transition-colors text-xs"
                  >
                    <prompt.icon className="w-4 h-4 text-primary mb-1" />
                    <span className="block">{prompt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedClient && (
              <div className="p-3 bg-primary/5 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2">נתונים זמינים:</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">{campaigns.length} קמפיינים</Badge>
                  <Badge variant="secondary" className="text-xs">{integrations.length} אינטגרציות</Badge>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : ""
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {message.usedWebSearch ? (
                      <Globe className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Bot className="w-4 h-4 text-primary" />
                    )}
                  </div>
                )}
                <div className="max-w-[80%]">
                  {message.role === "assistant" && (message.usedWebSearch || message.modelName) && (
                    <div className="flex items-center gap-1 mb-1">
                      {message.usedWebSearch && (
                        <Badge variant="outline" className="text-xs gap-1 bg-blue-500/10 text-blue-600 border-blue-200">
                          <Globe className="w-3 h-3" />
                          חיפוש אינטרנט
                        </Badge>
                      )}
                      {message.modelName && (
                        <Badge variant="secondary" className="text-xs">
                          {message.modelName}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      "p-3 rounded-xl text-sm whitespace-pre-wrap",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {message.content || (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>חושב...</span>
                      </div>
                    )}
                  </div>
                  {/* Create Task Button for AI messages */}
                  {message.role === "assistant" && message.content && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openTaskDialog(message.content)}
                      className="mt-1 h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                    >
                      <ListTodo className="w-3 h-3" />
                      צור משימה
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="שאל שאלה..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              צור משימה מתובנת AI
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>כותרת המשימה</Label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="כותרת המשימה..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>תיאור</Label>
              <Textarea
                value={taskContent}
                onChange={(e) => setTaskContent(e.target.value)}
                rows={4}
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label>עדיפות</Label>
              <Select value={taskPriority} onValueChange={setTaskPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">נמוכה</SelectItem>
                  <SelectItem value="medium">בינונית</SelectItem>
                  <SelectItem value="high">גבוהה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!selectedClient && (
              <p className="text-sm text-destructive">יש לבחור לקוח כדי ליצור משימה</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
              ביטול
            </Button>
            <Button 
              onClick={createTaskFromInsight} 
              disabled={isCreatingTask || !selectedClient || !taskTitle.trim()}
            >
              {isCreatingTask ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 ml-2" />
              )}
              צור משימה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
