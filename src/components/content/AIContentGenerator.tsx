// AI Content Generator Component

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Sparkles, 
  Copy, 
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  History,
  Wand2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AIContentHistory } from '@/api/content.api';

interface AIContentGeneratorProps {
  history: AIContentHistory[];
  onGenerate: (prompt: string, contentType: string) => Promise<string>;
  onRate: (id: string, rating: number) => void;
  onUseContent: (content: string) => void;
}

const CONTENT_TYPES = [
  { value: 'social_post', label: 'פוסט לרשת חברתית' },
  { value: 'ad_copy', label: 'טקסט למודעה' },
  { value: 'headline', label: 'כותרת' },
  { value: 'product_description', label: 'תיאור מוצר' },
  { value: 'email_subject', label: 'נושא אימייל' },
  { value: 'cta', label: 'קריאה לפעולה' },
  { value: 'hashtags', label: 'האשטגים' },
];

const PROMPT_TEMPLATES = [
  { label: 'קידום מוצר', template: 'כתוב פוסט מקדם עבור [שם מוצר] שמדגיש את [יתרון מרכזי]' },
  { label: 'שיתוף ידע', template: 'כתוב פוסט שמשתף טיפ מקצועי בנושא [נושא]' },
  { label: 'הכרזה', template: 'כתוב הכרזה על [אירוע/חדשות] בטון מרגש' },
  { label: 'שאלה למעורבות', template: 'כתוב שאלה שתעורר דיון בנושא [נושא]' },
];

export function AIContentGenerator({ 
  history, 
  onGenerate, 
  onRate, 
  onUseContent 
}: AIContentGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState('social_post');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) {
      toast.error('נא להזין הנחיה');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await onGenerate(prompt, contentType);
      setGeneratedContent(result);
      toast.success('התוכן נוצר בהצלחה');
    } catch {
      toast.error('שגיאה ביצירת תוכן');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyContent = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('התוכן הועתק');
  };

  const useTemplate = (template: string) => {
    setPrompt(template);
    setShowTemplates(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            יצירת תוכן עם AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Type */}
          <div className="space-y-2">
            <Label>סוג תוכן</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt Templates */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              className="mb-2"
            >
              <Wand2 className="h-4 w-4 ml-1" />
              תבניות מוכנות
              {showTemplates ? (
                <ChevronUp className="h-4 w-4 mr-1" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-1" />
              )}
            </Button>
            
            {showTemplates && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {PROMPT_TEMPLATES.map((template, i) => (
                  <Button
                    key={i}
                    variant="secondary"
                    size="sm"
                    onClick={() => useTemplate(template.template)}
                    className="justify-start text-sm"
                  >
                    {template.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label>הנחיה</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="תאר את התוכן שברצונך ליצור..."
              rows={4}
            />
          </div>

          <Button 
            onClick={handleGenerate}
            disabled={!prompt || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                מייצר תוכן...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 ml-2" />
                צור תוכן
              </>
            )}
          </Button>

          {/* Generated Content */}
          {generatedContent && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <Label>תוכן שנוצר</Label>
              <div className="p-3 bg-background rounded border whitespace-pre-wrap">
                {generatedContent}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyContent}>
                    <Copy className="h-4 w-4 ml-1" />
                    העתק
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => onUseContent(generatedContent)}
                  >
                    השתמש בתוכן
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <RefreshCw className={cn("h-4 w-4 ml-1", isGenerating && "animate-spin")} />
                  צור מחדש
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setShowHistory(!showHistory)}
        >
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <History className="h-4 w-4" />
              היסטוריית יצירות
              <Badge variant="secondary">{history.length}</Badge>
            </span>
            {showHistory ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CardTitle>
        </CardHeader>
        
        {showHistory && (
          <CardContent className="space-y-3">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                אין היסטוריה
              </p>
            ) : (
              history.slice(0, 5).map((item) => (
                <div key={item.id} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline">{item.content_type}</Badge>
                    <span className="text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {item.prompt}
                  </p>
                  <p className="text-sm line-clamp-2">
                    {item.generated_content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Button
                        variant={item.rating === 1 ? 'default' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onRate(item.id, 1)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={item.rating === -1 ? 'destructive' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onRate(item.id, -1)}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUseContent(item.generated_content)}
                    >
                      השתמש
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default AIContentGenerator;
