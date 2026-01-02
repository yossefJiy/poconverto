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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
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
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const config = moduleAgentConfig[moduleType] || moduleAgentConfig.insights;
  const ModuleIcon = config.icon;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset messages when module changes
  useEffect(() => {
    setMessages([]);
  }, [moduleType]);

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
            context: `${config.systemPrompt}\n\nלקוח נוכחי: ${selectedClient?.name || "לא נבחר"}\nמודול: ${config.label}\n\nהנחיות:\n- ענה בעברית\n- היה תמציתי וברור\n- השתמש באימוג'י כדי להמחיש נקודות\n- אם רלוונטי, הצג נתונים בטבלה או רשימה מסודרת`,
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
    <div 
      className={cn(
        "fixed z-50 bg-card border border-border rounded-xl shadow-elevated flex flex-col overflow-hidden transition-all duration-300",
        isExpanded 
          ? "inset-4 md:inset-8" 
          : "bottom-4 left-4 w-96 h-[500px] max-h-[80vh]"
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
              {selectedClient?.name || "כללי"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
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
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className={cn("w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center", config.bgColor, config.color)}>
                    <ModuleIcon className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tl-sm"
                      : "bg-muted rounded-tr-sm"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
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
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="כתוב הודעה..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
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
