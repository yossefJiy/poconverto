import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ChevronDown,
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

const AI_MODELS = [
  { id: 'perplexity/sonar-pro', name: 'Perplexity Sonar Pro', icon: '🔍', description: 'חיפוש אינטרנט + AI' },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', icon: '🧠', description: 'ניתוח עמוק' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', icon: '🎯', description: 'מאוזן ומהיר' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', icon: '⚡', description: 'OpenAI מתקדם' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', icon: '🚀', description: 'מהיר וחזק' },
];

export function AICodeAgent({ issue, onActionComplete }: AICodeAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [executedActions, setExecutedActions] = useState<any>(null);
  const [provider, setProvider] = useState<string>('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [selectedModel, setSelectedModel] = useState('perplexity/sonar-pro');

  const runAction = async (action: 'analyze' | 'suggest-fix' | 'scan-duplicates' | 'auto-close') => {
    setIsLoading(true);
    setCurrentAction(action);
    setResponse(null);
    setExecutedActions(null);
    setCitations([]);
    setProvider('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-code-analyzer', {
        body: {
          action,
          issueId: issue?.id,
          issueTitle: issue?.title,
          issueDescription: issue?.description,
          category: issue?.category,
          model: selectedModel,
        }
      });

      if (error) throw error;

      if (data.success) {
        setResponse(data.response);
        setExecutedActions(data.executedActions);
        setProvider(data.provider || '');
        setCitations(data.citations || []);
        
        if (action === 'auto-close' && data.executedActions?.closedIds?.length > 0) {
          toast.success(`נסגרו ${data.executedActions.closedIds.length} בעיות אוטומטית`);
          onActionComplete?.();
        }
      } else {
        throw new Error(data.error || 'Unknown error');
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
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
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

        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Model Selector & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue>
                  {AI_MODELS.find(m => m.id === selectedModel)?.icon}{' '}
                  {AI_MODELS.find(m => m.id === selectedModel)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span>{model.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-medium">{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
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
                    מנתח עם Perplexity AI...
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
                  <ScrollArea className="h-[350px]">
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
                  <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                    <Globe className="h-3 w-3" />
                    Perplexity Sonar Pro עם חיפוש אינטרנט
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
