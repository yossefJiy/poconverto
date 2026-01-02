import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
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
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIInsightsChatProps {
  performanceData?: any[];
  campaignsData?: any[];
  insightsData?: any[];
}

const quickPrompts = [
  { icon: TrendingUp, label: "איך לשפר ROI?", prompt: "איך אני יכול לשפר את ה-ROI של הקמפיינים שלי? תן לי המלצות מעשיות" },
  { icon: Target, label: "אסטרטגיית המרות", prompt: "מה האסטרטגיה הכי טובה להגדלת המרות באיקומרס?" },
  { icon: Lightbulb, label: "טכנולוגיות חדשות", prompt: "אילו טכנולוגיות וכלים חדשים כדאי לי להכיר בתחום השיווק הדיגיטלי?" },
  { icon: Sparkles, label: "הזדמנויות צמיחה", prompt: "בהתבסס על הנתונים שלי, מהן הזדמנויות הצמיחה העיקריות?" },
];

export function AIInsightsChat({ performanceData = [], campaignsData = [], insightsData = [] }: AIInsightsChatProps) {
  const { selectedClient } = useClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
            context: buildContextPrompt(),
          }),
        }
      );

      if (response.status === 429) {
        toast.error("יותר מדי בקשות, נסה שוב בעוד דקה");
        return;
      }

      if (response.status === 402) {
        toast.error("נדרש טעינת קרדיטים");
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

      setMessages(prev => [...prev, { role: "assistant", content: "", timestamp: new Date() }]);

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
      // Remove the empty assistant message
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

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
        : "bottom-6 left-6 w-[400px] h-[600px]"
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clearChat}
            title="נקה צ'אט"
          >
            <RefreshCw className="w-4 h-4" />
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

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-bold mb-2">היי! אני כאן לעזור</h4>
              <p className="text-sm text-muted-foreground">
                אני מומחה בהפיכת מותגים לרווחיים. שאל אותי כל שאלה!
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(prompt.prompt)}
                  className="p-3 text-right bg-muted/50 hover:bg-muted rounded-xl transition-colors text-sm"
                >
                  <prompt.icon className="w-4 h-4 text-primary mb-1" />
                  <span className="block text-xs">{prompt.label}</span>
                </button>
              ))}
            </div>

            {selectedClient && (
              <div className="p-3 bg-primary/5 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2">נתונים זמינים:</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">{campaigns.length} קמפיינים</Badge>
                  <Badge variant="secondary" className="text-xs">{integrations.length} אינטגרציות</Badge>
                  <Badge variant="secondary" className="text-xs">{agentActions.length} פעולות</Badge>
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
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] p-3 rounded-xl text-sm whitespace-pre-wrap",
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
    </div>
  );
}
