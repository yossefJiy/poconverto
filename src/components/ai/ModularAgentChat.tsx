import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  Bot, 
  Send, 
  Loader2, 
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Plus,
  Target,
  BarChart3,
  MessageSquare,
  ShoppingCart,
  ListTodo,
  Users,
  TrendingUp,
  Lightbulb,
  FileText,
  Globe,
  CheckCircle2,
  History,
  Trash2,
  Brain,
  RefreshCw,
  Save,
  BookOpen,
  AlertTriangle,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Module type definitions with icons and colors
const moduleAgentConfig: Record<string, {
  icon: any;
  label: string;
  color: string;
  bgColor: string;
  systemPrompt: string;
  quickActions: Array<{ label: string; prompt: string }>;
}> = {
  marketing: {
    icon: Target,
    label: "שיווק ופרסום",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    systemPrompt: `אתה סוכן AI מומחה בשיווק ופרסום דיגיטלי.
תפקידך:
- לנתח קמפיינים ולהציע שיפורים
- להמליץ על אסטרטגיות פרסום
- לעזור בכתיבת קופי שיווקי
- לזהות הזדמנויות במגמות שוק`,
    quickActions: [
      { label: "נתח קמפיין", prompt: "נתח את הקמפיינים הפעילים שלי והצע שיפורים" },
      { label: "כתוב קופי", prompt: "כתוב לי טקסט פרסומי מעניין" },
      { label: "אסטרטגיה", prompt: "הצע לי אסטרטגיית פרסום לחודש הקרוב" },
    ],
  },
  analytics: {
    icon: BarChart3,
    label: "אנליטיקס",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    systemPrompt: `אתה סוכן AI מומחה בניתוח נתונים ואנליטיקה.
תפקידך:
- לנתח מגמות ודפוסים בנתונים
- להציג תובנות בצורה ברורה עם גרפים ומספרים
- לזהות חריגות ובעיות
- להמליץ על מדדים לעקוב`,
    quickActions: [
      { label: "סיכום ביצועים", prompt: "תן לי סיכום ביצועים של השבוע האחרון" },
      { label: "זהה מגמות", prompt: "זהה מגמות מעניינות בנתונים" },
      { label: "השווה תקופות", prompt: "השווה בין החודש הנוכחי לקודם" },
    ],
  },
  ecommerce: {
    icon: ShoppingCart,
    label: "איקומרס",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    systemPrompt: `אתה סוכן AI מומחה באיקומרס ומכירות אונליין.
תפקידך:
- לנתח מכירות ומלאי
- להמליץ על מחירים ומבצעים
- לזהות מוצרים מובילים
- לשפר המרות בחנות`,
    quickActions: [
      { label: "נתח מכירות", prompt: "נתח את המכירות האחרונות והצע שיפורים" },
      { label: "מוצרים חמים", prompt: "מהם המוצרים הנמכרים ביותר?" },
      { label: "שיפור המרות", prompt: "איך אני יכול לשפר את יחס ההמרה?" },
    ],
  },
  tasks: {
    icon: ListTodo,
    label: "משימות",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    systemPrompt: `אתה סוכן AI לניהול משימות ופרויקטים.
תפקידך:
- לעזור בתיעדוף משימות
- להציע חלוקת עבודה יעילה
- לזהות צווארי בקבוק
- לייצר משימות חדשות מבקשות`,
    quickActions: [
      { label: "מה בעדיפות?", prompt: "מהן המשימות הדחופות ביותר?" },
      { label: "תכנון שבוע", prompt: "עזור לי לתכנן את השבוע" },
      { label: "משימה חדשה", prompt: "צור לי משימה חדשה עבור..." },
    ],
  },
  campaigns: {
    icon: TrendingUp,
    label: "קמפיינים",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    systemPrompt: `אתה סוכן AI לניהול קמפיינים שיווקיים.
תפקידך:
- לנטר ביצועי קמפיינים
- להציע אופטימיזציות
- לתכנן קמפיינים חדשים
- לנהל תקציבים`,
    quickActions: [
      { label: "סטטוס קמפיינים", prompt: "מה הסטטוס של הקמפיינים הפעילים?" },
      { label: "קמפיין חדש", prompt: "עזור לי לתכנן קמפיין חדש" },
      { label: "אופטימיזציה", prompt: "הצע דרכים לאופטימיזציה" },
    ],
  },
  team: {
    icon: Users,
    label: "צוות",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    systemPrompt: `אתה סוכן AI לניהול צוות ומשאבי אנוש.
תפקידך:
- לעזור בחלוקת עבודה
- לזהות עומסים על חברי צוות
- להציע דרכים לשיפור יעילות
- לתזמן פגישות ומעקב`,
    quickActions: [
      { label: "עומס צוות", prompt: "מי הכי עמוס בצוות כרגע?" },
      { label: "חלוקת עבודה", prompt: "הצע חלוקת עבודה יעילה יותר" },
      { label: "ביצועי צוות", prompt: "איך הביצועים של הצוות השבוע?" },
    ],
  },
  reports: {
    icon: FileText,
    label: "דוחות",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    systemPrompt: `אתה סוכן AI ליצירת דוחות וסיכומים.
תפקידך:
- ליצור דוחות מסכמים
- להציג נתונים בצורה ברורה
- ליצור הצגות ללקוחות
- לזהות נקודות מפתח`,
    quickActions: [
      { label: "דוח שבועי", prompt: "צור לי דוח שבועי מסכם" },
      { label: "דוח ללקוח", prompt: "צור דוח להצגה ללקוח" },
      { label: "נקודות מפתח", prompt: "מהן הנקודות החשובות להציג?" },
    ],
  },
  insights: {
    icon: Lightbulb,
    label: "תובנות",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    systemPrompt: `אתה סוכן AI לתובנות והמלצות אסטרטגיות.
תפקידך:
- לספק תובנות עסקיות
- לזהות הזדמנויות צמיחה
- להתריע על בעיות פוטנציאליות
- להציע פעולות מומלצות`,
    quickActions: [
      { label: "הזדמנויות", prompt: "מהן ההזדמנויות העיקריות כרגע?" },
      { label: "אתגרים", prompt: "מהם האתגרים שצריך להתמודד איתם?" },
      { label: "המלצות", prompt: "מהן ההמלצות שלך לשיפור?" },
    ],
  },
};

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
}

interface ModularAgentChatProps {
  moduleType: keyof typeof moduleAgentConfig;
  isOpen: boolean;
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function ModularAgentChat({ 
  moduleType, 
  isOpen, 
  onClose,
  isExpanded = false,
  onToggleExpand,
}: ModularAgentChatProps) {
  const { selectedClient } = useClient();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Task creation state
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [taskContent, setTaskContent] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<string>("medium");
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Insights summary state
  const [showInsightsSummary, setShowInsightsSummary] = useState(false);
  const [insightsSummary, setInsightsSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isSavingInsights, setIsSavingInsights] = useState(false);

  // Fetch saved insights for this client and module
  const { data: savedInsights, refetch: refetchInsights } = useQuery({
    queryKey: ["client-insights", selectedClient?.id, moduleType],
    queryFn: async () => {
      if (!selectedClient?.id) return null;
      const { data } = await supabase
        .from("client_insights")
        .select("*")
        .eq("client_id", selectedClient.id)
        .eq("insight_type", `agent_${moduleType}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      return data;
    },
    enabled: !!selectedClient?.id,
  });

  // Load saved insights when opening summary panel
  useEffect(() => {
    if (showInsightsSummary && savedInsights && !insightsSummary) {
      const insights = savedInsights.insights as { summary?: string } | null;
      if (insights?.summary) {
        setInsightsSummary(insights.summary);
      }
    }
  }, [showInsightsSummary, savedInsights]);

  // Save insights to client profile
  const saveInsightsToProfile = async () => {
    if (!selectedClient?.id || !insightsSummary) {
      toast.error("אין תובנות לשמור או לא נבחר לקוח");
      return;
    }

    setIsSavingInsights(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if insights already exist for this module
      const { data: existing } = await supabase
        .from("client_insights")
        .select("id")
        .eq("client_id", selectedClient.id)
        .eq("insight_type", `agent_${moduleType}`)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from("client_insights")
          .update({
            insights: { summary: insightsSummary, updatedAt: new Date().toISOString() },
            period_end: today,
          })
          .eq("id", existing.id);
      } else {
        // Create new
        await supabase
          .from("client_insights")
          .insert({
            client_id: selectedClient.id,
            insight_type: `agent_${moduleType}`,
            insights: { summary: insightsSummary, createdAt: new Date().toISOString() },
            period_start: today,
            period_end: today,
          });
      }

      toast.success("התובנות נשמרו בפרופיל הלקוח");
      refetchInsights();
    } catch (error) {
      console.error("Error saving insights:", error);
      toast.error("שגיאה בשמירת התובנות");
    } finally {
      setIsSavingInsights(false);
    }
  };

  const config = moduleAgentConfig[moduleType] || moduleAgentConfig.insights;
  const ModuleIcon = config.icon;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversation history for this module
  const { data: conversations = [] } = useQuery({
    queryKey: ["module-conversations", user?.id, selectedClient?.id, moduleType],
    queryFn: async () => {
      if (!user) return [];
      const query = supabase
        .from("chat_conversations")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .eq("agent_type", `module_${moduleType}`)
        .order("updated_at", { ascending: false })
        .limit(10);
      
      if (selectedClient) {
        query.eq("client_id", selectedClient.id);
      }
      
      const { data } = await query;
      return (data || []) as Conversation[];
    },
    enabled: !!user,
  });

  // Load last conversation on mount
  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId && messages.length === 0) {
      loadConversation(conversations[0].id);
    }
  }, [conversations]);

  // Create new conversation
  const createConversation = async (firstMessage: string) => {
    if (!user) return null;
    
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({
        user_id: user.id,
        client_id: selectedClient?.id || null,
        agent_type: `module_${moduleType}`,
        title,
      })
      .select()
      .single();
    
    if (error) throw error;
    setCurrentConversationId(data.id);
    queryClient.invalidateQueries({ queryKey: ["module-conversations"] });
    return data.id;
  };

  // Save message to database
  const saveMessage = async (conversationId: string, role: string, content: string) => {
    await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        role,
        content,
        metadata: { moduleType, clientId: selectedClient?.id }
      });
  };

  // Load conversation messages
  const loadConversation = async (conversationId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.created_at),
      })));
      setCurrentConversationId(conversationId);
      setShowHistory(false);
    }
  };

  // Start new chat
  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
  };

  // Generate insights summary from all conversations
  const generateInsightsSummary = async () => {
    if (conversations.length === 0) {
      toast.error("אין שיחות קודמות לסיכום");
      return;
    }

    setIsGeneratingSummary(true);
    setShowInsightsSummary(true);
    setInsightsSummary("");

    try {
      // Fetch all messages from all conversations
      const allMessages: string[] = [];
      for (const conv of conversations.slice(0, 10)) { // Limit to last 10 conversations
        const { data } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true });
        
        if (data) {
          allMessages.push(`--- שיחה: ${conv.title || "ללא כותרת"} ---`);
          data.forEach(m => {
            allMessages.push(`${m.role === "user" ? "משתמש" : "סוכן"}: ${m.content}`);
          });
        }
      }

      const summaryPrompt = `בהתבסס על כל השיחות הבאות עם הלקוח, סכם את התובנות המצטברות שלמדת:

${allMessages.join("\n").slice(0, 10000)}

צור סיכום תמציתי בפורמט הבא:
📊 **תובנות מפתח** - מה למדת על הלקוח
🎯 **דפוסים שזוהו** - התנהגויות או צרכים חוזרים
💡 **המלצות** - פעולות מומלצות בהתבסס על מה שלמדת
⚡ **נקודות לתשומת לב** - דברים חשובים לזכור`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insights-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [],
            userMessage: summaryPrompt,
            context: `${config.systemPrompt}\n\nאתה מסכם את כל התובנות שצברת מהשיחות עם הלקוח. היה תמציתי וממוקד.`,
            clientId: selectedClient?.id,
            userId: user?.id,
          }),
        }
      );

      if (!response.ok || !response.body) {
        throw new Error("Failed to get summary");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let summaryContent = "";
      let textBuffer = "";

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
              summaryContent += content;
              setInsightsSummary(summaryContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

    } catch (error) {
      console.error("Summary error:", error);
      toast.error("שגיאה ביצירת הסיכום");
      setShowInsightsSummary(false);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Open task dialog
  const openTaskDialog = (content: string) => {
    const lines = content.split('\n').filter(l => l.trim());
    const title = lines[0]?.slice(0, 100) || "משימה מ-AI";
    setTaskTitle(title);
    setTaskContent(content);
    setShowTaskDialog(true);
  };

  // Create task
  const createTask = async () => {
    if (!taskTitle.trim()) {
      toast.error("נא להזין כותרת למשימה");
      return;
    }

    setIsCreatingTask(true);
    try {
      const { error } = await supabase.from("tasks").insert({
        title: taskTitle,
        description: taskContent,
        priority: taskPriority,
        status: "open",
        client_id: selectedClient?.id || null,
        category: `AI-${config.label}`,
      });

      if (error) throw error;

      toast.success("המשימה נוצרה בהצלחה");
      setShowTaskDialog(false);
      setTaskTitle("");
      setTaskContent("");
      setTaskPriority("medium");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("שגיאה ביצירת המשימה");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const sendMessage = async (messageText: string) => {
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
      // Create or get conversation
      let convId = currentConversationId;
      if (!convId) {
        convId = await createConversation(messageText);
      }

      // Save user message
      if (convId) {
        await saveMessage(convId, "user", messageText);
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
            context: `${config.systemPrompt}\n\nלקוח נוכחי: ${selectedClient?.name || "לא נבחר"}\nמודול: ${config.label}\n\nהנחיות:\n- ענה בעברית\n- היה תמציתי וברור\n- השתמש באימוג'י כדי להמחיש נקודות\n- אם רלוונטי, הצג נתונים בטבלה או רשימה מסודרת\n- אם אתה מזהה תובנה חשובה או חריגה בנתונים, התחל את התשובה עם 🚨 התראה:`,
            clientId: selectedClient?.id,
            userId: user?.id,
          }),
        }
      );

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

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "", 
        timestamp: new Date(),
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

      // Save assistant message
      if (convId && assistantContent) {
        await saveMessage(convId, "assistant", assistantContent);
        
        // Check for alert trigger and show notification
        if (assistantContent.includes("🚨") || assistantContent.includes("התראה:") || assistantContent.includes("חריגה")) {
          toast.warning(
            <div className="flex items-center gap-2" dir="rtl">
              <AlertTriangle className="w-4 h-4" />
              <span>סוכן {config.label} זיהה תובנה חשובה!</span>
            </div>,
            { duration: 8000 }
          );
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

  if (!isOpen) return null;

  return (
    <>
      <div 
        dir="rtl"
        className={cn(
          "fixed z-50 bg-card border border-border rounded-xl shadow-elevated flex flex-col overflow-hidden transition-all duration-300",
          isExpanded 
            ? "inset-4 md:inset-8" 
            : "bottom-4 right-4 w-96 h-[500px] max-h-[80vh]"
        )}
      >
        {/* Header */}
        <div className={cn("flex items-center justify-between px-4 py-3 border-b border-border", config.bgColor)}>
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-background/50", config.color)}>
              <ModuleIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">סוכן {config.label}</h3>
              <p className="text-xs text-muted-foreground">
                {selectedClient?.name || "כללי"} • {conversations.length} שיחות
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={generateInsightsSummary}
              title="תובנות מצטברות"
              disabled={isGeneratingSummary}
            >
              {isGeneratingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setShowHistory(!showHistory)}
              title="היסטוריה"
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
            {onToggleExpand && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggleExpand}>
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Insights Summary Panel */}
        {showInsightsSummary && (
          <div className="border-b border-border bg-gradient-to-br from-primary/5 to-primary/10 p-4 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">תובנות מצטברות</p>
                {savedInsights && (
                  <Badge variant="outline" className="text-xs">
                    <BookOpen className="w-3 h-3 ml-1" />
                    נשמר
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {insightsSummary && selectedClient && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={saveInsightsToProfile}
                    disabled={isSavingInsights}
                    title="שמור לפרופיל הלקוח"
                  >
                    {isSavingInsights ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={generateInsightsSummary}
                  disabled={isGeneratingSummary}
                  title="רענן סיכום"
                >
                  <RefreshCw className={cn("w-3 h-3", isGeneratingSummary && "animate-spin")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowInsightsSummary(false)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            {isGeneratingSummary && !insightsSummary ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">מנתח את כל השיחות...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {insightsSummary || (savedInsights ? (savedInsights.insights as { summary?: string })?.summary : "לחץ על כפתור הרענון ליצירת תובנות")}
                </div>
                {savedInsights && (
                  <p className="text-xs text-muted-foreground">
                    עודכן לאחרונה: {new Date(savedInsights.period_end).toLocaleDateString("he-IL")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* History Panel */}
        {showHistory && !showInsightsSummary && (
          <div className="border-b border-border bg-muted/50 p-3 max-h-40 overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-2">שיחות קודמות</p>
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground">אין שיחות קודמות</p>
            ) : (
              <div className="space-y-1">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={cn(
                      "w-full text-right px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors",
                      currentConversationId === conv.id && "bg-muted"
                    )}
                  >
                    <p className="truncate font-medium">{conv.title || "שיחה ללא כותרת"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.created_at).toLocaleDateString("he-IL")}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-4", config.bgColor, config.color)}>
                <ModuleIcon className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-lg mb-2">שלום! 👋</h4>
              <p className="text-muted-foreground text-sm mb-4 max-w-xs">
                אני הסוכן של {config.label}. איך אני יכול לעזור?
              </p>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {config.quickActions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => sendMessage(action.prompt)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, idx) => {
                const isAlert = message.role === "assistant" && 
                  (message.content.includes("🚨") || message.content.includes("התראה:") || message.content.includes("חריגה"));
                
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-start flex-row-reverse" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
                        isAlert ? "bg-warning/20 text-warning" : cn(config.bgColor, config.color)
                      )}>
                        {isAlert ? <AlertTriangle className="w-4 h-4" /> : <ModuleIcon className="w-4 h-4" />}
                      </div>
                    )}
                    <div className="flex flex-col gap-1 max-w-[80%]">
                      {isAlert && (
                        <Badge variant="outline" className="w-fit text-xs border-warning text-warning">
                          <Bell className="w-3 h-3 ml-1" />
                          התראה חשובה
                        </Badge>
                      )}
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : isAlert 
                              ? "bg-warning/10 border border-warning/30 rounded-tl-sm"
                              : "bg-muted rounded-tl-sm"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-right">{message.content}</p>
                      </div>
                      {/* Create task button for assistant messages */}
                      {message.role === "assistant" && message.content && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs self-end gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => openTaskDialog(message.content)}
                        >
                          <ListTodo className="w-3 h-3" />
                          צור משימה
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center", config.bgColor, config.color)}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tr-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background/50">
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-2 flex-row-reverse"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="כתוב הודעה..."
              className="flex-1 text-right"
              disabled={isLoading}
              dir="rtl"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4 rotate-180" />
            </Button>
          </form>
        </div>
      </div>

      {/* Task Creation Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary" />
              יצירת משימה מתגובת AI
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>כותרת</Label>
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="כותרת המשימה"
              />
            </div>
            <div className="space-y-2">
              <Label>תיאור</Label>
              <Textarea
                value={taskContent}
                onChange={(e) => setTaskContent(e.target.value)}
                placeholder="תיאור המשימה"
                rows={4}
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
                  <SelectItem value="urgent">דחופה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary" className="text-xs">
              מקור: סוכן {config.label}
            </Badge>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
              ביטול
            </Button>
            <Button onClick={createTask} disabled={isCreatingTask}>
              {isCreatingTask && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              <CheckCircle2 className="w-4 h-4 ml-2" />
              צור משימה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Module agent selector for sidebar
export function ModuleAgentSelector({ 
  onSelectModule 
}: { 
  onSelectModule: (module: string) => void 
}) {
  return (
    <div className="p-4 space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">סוכני AI</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(moduleAgentConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Button
              key={key}
              variant="ghost"
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-3 hover:bg-muted",
                config.bgColor
              )}
              onClick={() => onSelectModule(key)}
            >
              <Icon className={cn("w-5 h-5", config.color)} />
              <span className="text-xs">{config.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export { moduleAgentConfig };
