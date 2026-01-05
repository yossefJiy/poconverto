// Content Editor Component

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Edit3, 
  Save, 
  Send, 
  Clock, 
  Image,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Sparkles,
  X,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentDraft } from '@/api/content.api';

interface ContentEditorProps {
  draft?: ContentDraft | null;
  onSave: (data: Partial<ContentDraft>) => void;
  onPublish: (data: Partial<ContentDraft>) => void;
  onAIGenerate?: (prompt: string, contentType?: string) => Promise<string>;
  onMediaSelect?: () => void;
  isLoading?: boolean;
}

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  { id: 'twitter', name: 'X', icon: Twitter },
];

const CONTENT_TYPES = [
  { value: 'post', label: 'פוסט רגיל' },
  { value: 'story', label: 'סטורי' },
  { value: 'reel', label: 'ריל' },
  { value: 'article', label: 'מאמר' },
  { value: 'ad', label: 'מודעה' },
];

export function ContentEditor({ 
  draft,
  onSave, 
  onPublish,
  onAIGenerate,
  onMediaSelect,
  isLoading 
}: ContentEditorProps) {
  const [title, setTitle] = useState(draft?.title || '');
  const [content, setContent] = useState(draft?.content || '');
  const [contentType, setContentType] = useState(draft?.content_type || 'post');
  const [platforms, setPlatforms] = useState<string[]>(draft?.platforms || []);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const togglePlatform = (platformId: string) => {
    setPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleAIGenerate = async () => {
    if (!onAIGenerate || !aiPrompt) return;
    setIsGenerating(true);
    try {
      const generated = await onAIGenerate(aiPrompt);
      setContent(prev => prev ? `${prev}\n\n${generated}` : generated);
      setAiPrompt('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onSave({
      title,
      content,
      content_type: contentType,
      platforms,
      status: 'draft',
    });
  };

  const handlePublish = () => {
    onPublish({
      title,
      content,
      content_type: contentType,
      platforms,
      status: 'approved',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Editor */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            עורך תוכן
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">כותרת</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="כותרת התוכן..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">תוכן</Label>
              <span className="text-sm text-muted-foreground">
                {content.length} תווים
              </span>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="כתוב את התוכן שלך כאן..."
              rows={12}
              className="font-sans"
            />
          </div>

          {/* AI Generation */}
          {onAIGenerate && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                יצירת תוכן עם AI
              </Label>
              <div className="flex gap-2">
                <Input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="תאר מה תרצה ליצור..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleAIGenerate}
                  disabled={!aiPrompt || isGenerating}
                >
                  {isGenerating ? 'מייצר...' : 'צור'}
                </Button>
              </div>
            </div>
          )}

          {/* Media */}
          {onMediaSelect && (
            <Button variant="outline" onClick={onMediaSelect}>
              <Image className="h-4 w-4 ml-2" />
              הוסף מדיה
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 ml-2" />
            שמור טיוטה
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 ml-2" />
              תצוגה מקדימה
            </Button>
            <Button onClick={handlePublish} disabled={!content || !platforms.length || isLoading}>
              <Send className="h-4 w-4 ml-2" />
              פרסם
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Settings Sidebar */}
      <div className="space-y-4">
        {/* Content Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">סוג תוכן</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Platforms */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">פלטפורמות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const isSelected = platforms.includes(platform.id);
              
              return (
                <div
                  key={platform.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    isSelected ? "border-primary bg-primary/5" : "hover:border-primary/50"
                  )}
                  onClick={() => togglePlatform(platform.id)}
                >
                  <Checkbox checked={isSelected} />
                  <Icon className={cn("h-4 w-4", isSelected && "text-primary")} />
                  <span>{platform.name}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={draft?.status === 'published' ? 'default' : 'secondary'}>
              {draft?.status === 'draft' && 'טיוטה'}
              {draft?.status === 'review' && 'בבדיקה'}
              {draft?.status === 'approved' && 'מאושר'}
              {draft?.status === 'published' && 'פורסם'}
              {!draft?.status && 'חדש'}
            </Badge>
          </CardContent>
        </Card>

        {/* Preview */}
        {showPreview && content && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                תצוגה מקדימה
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowPreview(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                {title && <h3 className="font-bold mb-2">{title}</h3>}
                <p className="text-sm whitespace-pre-wrap">{content}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
