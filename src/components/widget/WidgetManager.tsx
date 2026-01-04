import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  RefreshCw, 
  Code, 
  ExternalLink,
  Eye,
  EyeOff,
  Settings2,
  Palette,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { format } from "date-fns";
import { he } from "date-fns/locale";

// Generate secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return `jiy_${Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

export function WidgetManager() {
  const { selectedClient } = useClient();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateTokenOpen, setIsCreateTokenOpen] = useState(false);
  const [isCreateWidgetOpen, setIsCreateWidgetOpen] = useState(false);
  const [showToken, setShowToken] = useState<string | null>(null);
  const [newTokenName, setNewTokenName] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState<string>("");
  const [widgetName, setWidgetName] = useState("");
  const [widgetWelcome, setWidgetWelcome] = useState("שלום! איך אוכל לעזור לך היום?");
  const [widgetColor, setWidgetColor] = useState("#6366f1");
  const [widgetPosition, setWidgetPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");
  const [widgetPrompts, setWidgetPrompts] = useState("");

  // Fetch client's agent
  const { data: clientAgent } = useQuery({
    queryKey: ["client-agent", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return null;
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("client_id", selectedClient.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient?.id,
  });

  // Fetch tokens
  const { data: tokens, isLoading: tokensLoading } = useQuery({
    queryKey: ["agent-tokens", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      const { data, error } = await supabase
        .from("client_agent_tokens")
        .select("*")
        .eq("client_id", selectedClient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient?.id,
  });

  // Fetch widgets
  const { data: widgets, isLoading: widgetsLoading } = useQuery({
    queryKey: ["widgets", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient?.id) return [];
      const { data, error } = await supabase
        .from("widget_configurations")
        .select("*, token:client_agent_tokens(name, token)")
        .eq("client_id", selectedClient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient?.id,
  });

  // Create token mutation
  const createToken = useMutation({
    mutationFn: async () => {
      if (!selectedClient?.id || !clientAgent?.id) throw new Error("Missing client or agent");
      const token = generateToken();
      const { data, error } = await supabase
        .from("client_agent_tokens")
        .insert({
          client_id: selectedClient.id,
          agent_id: clientAgent.id,
          token,
          name: newTokenName || "Token חדש",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agent-tokens"] });
      setIsCreateTokenOpen(false);
      setNewTokenName("");
      setShowToken(data.token);
      toast.success("Token נוצר בהצלחה!");
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת token: " + error.message);
    },
  });

  // Create widget mutation
  const createWidget = useMutation({
    mutationFn: async () => {
      if (!selectedClient?.id || !clientAgent?.id || !selectedTokenId) {
        throw new Error("Missing required fields");
      }
      const { data, error } = await supabase
        .from("widget_configurations")
        .insert({
          client_id: selectedClient.id,
          agent_id: clientAgent.id,
          token_id: selectedTokenId,
          name: widgetName || "Widget חדש",
          welcome_message: widgetWelcome,
          theme: {
            primaryColor: widgetColor,
            position: widgetPosition,
            size: "medium",
          },
          suggested_prompts: widgetPrompts.split("\n").filter(p => p.trim()),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      setIsCreateWidgetOpen(false);
      resetWidgetForm();
      toast.success("Widget נוצר בהצלחה!");
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת widget: " + error.message);
    },
  });

  // Delete token mutation
  const deleteToken = useMutation({
    mutationFn: async (tokenId: string) => {
      const { error } = await supabase
        .from("client_agent_tokens")
        .delete()
        .eq("id", tokenId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-tokens"] });
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      toast.success("Token נמחק");
    },
  });

  // Toggle token active mutation
  const toggleToken = useMutation({
    mutationFn: async ({ tokenId, isActive }: { tokenId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("client_agent_tokens")
        .update({ is_active: isActive })
        .eq("id", tokenId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-tokens"] });
    },
  });

  const resetWidgetForm = () => {
    setWidgetName("");
    setWidgetWelcome("שלום! איך אוכל לעזור לך היום?");
    setWidgetColor("#6366f1");
    setWidgetPosition("bottom-right");
    setWidgetPrompts("");
    setSelectedTokenId("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("הועתק ללוח");
  };

  const getEmbedCode = (widget: any) => {
    const token = widget.token?.token;
    const theme = widget.theme || {};
    return `<!-- JIY AI Widget -->
<script>
  (function() {
    window.JIYWidget = {
      token: "${token}",
      primaryColor: "${theme.primaryColor || '#6366f1'}",
      position: "${theme.position || 'bottom-right'}",
      welcomeMessage: "${widget.welcome_message || ''}",
      suggestedPrompts: ${JSON.stringify(widget.suggested_prompts || [])}
    };
    var s = document.createElement('script');
    s.src = '${window.location.origin}/widget.js';
    s.async = true;
    document.head.appendChild(s);
  })();
</script>`;
  };

  if (!selectedClient) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          בחר לקוח כדי לנהל widgets וטוקנים
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tokens" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tokens" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            API Tokens
          </TabsTrigger>
          <TabsTrigger value="widgets" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Widgets
          </TabsTrigger>
        </TabsList>

        {/* Tokens Tab */}
        <TabsContent value="tokens" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">API Tokens</h3>
              <p className="text-sm text-muted-foreground">
                טוקנים לגישה לסוכן AI מאתרים חיצוניים
              </p>
            </div>
            <Button onClick={() => setIsCreateTokenOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              צור Token
            </Button>
          </div>

          {tokensLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : tokens?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>אין טוקנים עדיין</p>
                <p className="text-sm">צור token כדי לאפשר גישה לסוכן AI מאתרים חיצוניים</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tokens?.map((token) => (
                <Card key={token.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{token.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            נוצר: {format(new Date(token.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            שימושים: {token.usage_count || 0}
                            {token.rate_limit_per_day && ` / ${token.rate_limit_per_day} יומי`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={token.is_active ? "default" : "secondary"}>
                          {token.is_active ? "פעיל" : "מושבת"}
                        </Badge>
                        <Switch
                          checked={token.is_active}
                          onCheckedChange={(checked) => toggleToken.mutate({ tokenId: token.id, isActive: checked })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(token.token)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => deleteToken.mutate(token.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Widgets Tab */}
        <TabsContent value="widgets" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Widgets</h3>
              <p className="text-sm text-muted-foreground">
                הגדרות Widget להטמעה באתרי לקוחות
              </p>
            </div>
            <Button 
              onClick={() => setIsCreateWidgetOpen(true)} 
              className="gap-2"
              disabled={!tokens?.length}
            >
              <Plus className="w-4 h-4" />
              צור Widget
            </Button>
          </div>

          {!tokens?.length && (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground">צור token תחילה כדי ליצור widgets</p>
              </CardContent>
            </Card>
          )}

          {widgetsLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : widgets?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>אין widgets עדיין</p>
                <p className="text-sm">צור widget כדי להטמיע צ'אט AI באתר הלקוח</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {widgets?.map((widget) => (
                <Card key={widget.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{widget.name}</CardTitle>
                      <Badge variant={widget.is_active ? "default" : "secondary"}>
                        {widget.is_active ? "פעיל" : "מושבת"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Token: {widget.token?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: (widget.theme as any)?.primaryColor || "#6366f1" }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {(widget.theme as any)?.position === "bottom-left" ? "שמאל למטה" : "ימין למטה"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2"
                        onClick={() => copyToClipboard(getEmbedCode(widget))}
                      >
                        <Code className="w-4 h-4" />
                        העתק קוד
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Token Dialog */}
      <Dialog open={isCreateTokenOpen} onOpenChange={setIsCreateTokenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>צור API Token חדש</DialogTitle>
            <DialogDescription>
              Token זה יאפשר גישה לסוכן AI של {selectedClient?.name} מאתרים חיצוניים
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="token-name">שם ה-Token</Label>
              <Input
                id="token-name"
                placeholder="לדוגמה: אתר ראשי"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTokenOpen(false)}>
              ביטול
            </Button>
            <Button onClick={() => createToken.mutate()} disabled={createToken.isPending}>
              {createToken.isPending ? "יוצר..." : "צור Token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Token Dialog */}
      <Dialog open={!!showToken} onOpenChange={() => setShowToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ה-Token נוצר בהצלחה!</DialogTitle>
            <DialogDescription>
              שמור את ה-token במקום בטוח. לא תוכל לראות אותו שוב.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm break-all">
              <code className="flex-1">{showToken}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(showToken!)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowToken(null)}>הבנתי</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Widget Dialog */}
      <Dialog open={isCreateWidgetOpen} onOpenChange={setIsCreateWidgetOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>צור Widget חדש</DialogTitle>
            <DialogDescription>
              הגדר widget AI להטמעה באתר הלקוח
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>שם ה-Widget</Label>
              <Input
                placeholder="לדוגמה: צ'אט תמיכה"
                value={widgetName}
                onChange={(e) => setWidgetName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>בחר Token</Label>
              <Select value={selectedTokenId} onValueChange={setSelectedTokenId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר token" />
                </SelectTrigger>
                <SelectContent>
                  {tokens?.filter(t => t.is_active).map((token) => (
                    <SelectItem key={token.id} value={token.id}>
                      {token.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>הודעת פתיחה</Label>
              <Input
                value={widgetWelcome}
                onChange={(e) => setWidgetWelcome(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>צבע ראשי</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={widgetColor}
                    onChange={(e) => setWidgetColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={widgetColor}
                    onChange={(e) => setWidgetColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>מיקום</Label>
                <Select value={widgetPosition} onValueChange={(v: any) => setWidgetPosition(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">ימין למטה</SelectItem>
                    <SelectItem value="bottom-left">שמאל למטה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>הצעות שאלות (שורה לכל הצעה)</Label>
              <Textarea
                placeholder="מה שעות הפעילות שלכם?&#10;איך אפשר ליצור קשר?&#10;מהם אמצעי התשלום?"
                value={widgetPrompts}
                onChange={(e) => setWidgetPrompts(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateWidgetOpen(false)}>
              ביטול
            </Button>
            <Button 
              onClick={() => createWidget.mutate()} 
              disabled={createWidget.isPending || !selectedTokenId}
            >
              {createWidget.isPending ? "יוצר..." : "צור Widget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
