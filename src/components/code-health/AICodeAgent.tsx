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
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

export function AICodeAgent({ issue, onActionComplete }: AICodeAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [executedActions, setExecutedActions] = useState<any>(null);
  const [provider, setProvider] = useState<string>('');
  const [citations, setCitations] = useState<string[]>([]);

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
          {/* Action Buttons */}
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
                  
                  {/* Citations from Perplexity */}
                  {citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        מקורות ({citations.length})
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {citations.slice(0, 5).map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {new URL(url).hostname.replace('www.', '')}
                          </a>
                        ))}
                        {citations.length > 5 && (
                          <span className="text-xs text-muted-foreground px-2 py-1">
                            +{citations.length - 5} נוספים
                          </span>
                        )}
                      </div>
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
