import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Loader2, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface WidgetConfig {
  token: string;
  primaryColor?: string;
  position?: "bottom-right" | "bottom-left";
  size?: "small" | "medium" | "large";
  welcomeMessage?: string;
  suggestedPrompts?: string[];
  agentName?: string;
  agentAvatar?: string;
}

interface EmbeddableAgentWidgetProps {
  config: WidgetConfig;
}

export function EmbeddableAgentWidget({ config }: EmbeddableAgentWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    primaryColor = "#6366f1",
    position = "bottom-right",
    size = "medium",
    welcomeMessage = "שלום! איך אוכל לעזור לך היום?",
    suggestedPrompts = [],
    agentName = "AI Assistant",
  } = config;

  const sizeClasses = {
    small: "w-80 h-96",
    medium: "w-96 h-[500px]",
    large: "w-[450px] h-[600px]",
  };

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0 && welcomeMessage) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: welcomeMessage,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, welcomeMessage, messages.length]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Widget-Token": config.token,
          },
          body: JSON.stringify({
            message: messageText,
            sessionId,
            conversationHistory: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: data.response || "מצטער, לא הצלחתי לעבד את הבקשה.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Widget chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: "assistant",
          content: "מצטער, אירעה שגיאה. אנא נסה שוב מאוחר יותר.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className={cn("fixed z-50", positionClasses[position])}>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "mb-4 bg-background rounded-2xl shadow-2xl border overflow-hidden flex flex-col",
            sizeClasses[size]
          )}
          style={{ 
            "--widget-primary": primaryColor,
          } as React.CSSProperties}
        >
          {/* Header */}
          <div
            className="p-4 flex items-center justify-between"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{agentName}</h3>
                <p className="text-xs text-white/70">מקוון</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-start" : "justify-end"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2",
                      message.role === "user"
                        ? "bg-muted text-foreground rounded-tr-sm"
                        : "text-white rounded-tl-sm"
                    )}
                    style={{
                      backgroundColor:
                        message.role === "assistant" ? primaryColor : undefined,
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-end">
                  <div
                    className="rounded-2xl px-4 py-3 rounded-tl-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Suggested Prompts */}
          {messages.length <= 1 && suggestedPrompts.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {suggestedPrompts.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border hover:bg-muted transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="הקלד הודעה..."
                className="flex-1 rounded-full"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-full shrink-0"
                style={{ backgroundColor: primaryColor }}
                disabled={!input.trim() || isLoading}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* FAB Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        )}
        style={{ backgroundColor: primaryColor }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </Button>
    </div>
  );
}

// Export function to initialize widget from external script
export function initJIYWidget(config: WidgetConfig) {
  return <EmbeddableAgentWidget config={config} />;
}
