import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { 
  Send, 
  Paperclip, 
  Phone, 
  Video, 
  MoreVertical,
  MessageSquare,
  Loader2
} from "lucide-react";
import { useLeadConversations, LeadMessage } from "@/hooks/useLeads";

// Channel icons
const channelIcons: Record<string, string> = {
  whatsapp: "💬",
  messenger: "📱",
  instagram: "📸",
  sms: "📲",
  email: "✉️",
  phone: "📞",
  website: "🌐",
};

interface ConversationInboxProps {
  leadId: string;
  leadName: string;
  className?: string;
}

export function ConversationInbox({ leadId, leadName, className }: ConversationInboxProps) {
  const { conversations, messages, isLoading, sendMessage } = useLeadConversations(leadId);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedMessages = messages.filter(m => m.conversation_id === selectedConversation);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      sendMessage({
        conversationId: selectedConversation,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("flex h-[500px] rounded-lg border border-border overflow-hidden", className)}>
      {/* Conversations List */}
      <div className="w-1/3 border-l border-border bg-muted/30">
        <div className="p-3 border-b border-border">
          <h3 className="font-medium">שיחות</h3>
        </div>
        <ScrollArea className="h-[calc(100%-49px)]">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              אין שיחות
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={cn(
                    "w-full p-3 text-right hover:bg-muted/50 transition-colors",
                    selectedConversation === conv.id && "bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{channelIcons[conv.channel] || "💬"}</span>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium capitalize">{conv.channel}</p>
                  {conv.last_message_at && (
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(conv.last_message_at), "dd/MM HH:mm", { locale: he })}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {leadName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{leadName}</p>
              {selectedConversation && (
                <p className="text-xs text-muted-foreground">
                  {conversations.find(c => c.id === selectedConversation)?.channel}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Video className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {selectedMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {selectedMessages.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>אין הודעות בשיחה זו</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="הקלד הודעה..."
              className="flex-1"
              disabled={!selectedConversation || isSending}
            />
            <Button 
              onClick={handleSend} 
              size="icon" 
              className="h-9 w-9 shrink-0"
              disabled={!newMessage.trim() || !selectedConversation || isSending}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: LeadMessage }) {
  const isOutbound = message.direction === "outbound";

  return (
    <div className={cn("flex", isOutbound ? "justify-start" : "justify-end")}>
      <div className={cn(
        "max-w-[70%] rounded-2xl px-4 py-2",
        isOutbound 
          ? "bg-primary text-primary-foreground rounded-br-md" 
          : "bg-muted rounded-bl-md"
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div className={cn(
          "flex items-center gap-1 mt-1 text-xs",
          isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          <span>{format(new Date(message.created_at), "HH:mm")}</span>
          {isOutbound && message.status === "read" && (
            <span>✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
