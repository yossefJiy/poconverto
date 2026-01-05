// Post Composer Component
// Rich editor for creating social media posts

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Send, 
  Clock, 
  Image, 
  Hash, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter,
  Sparkles,
  Calendar as CalendarIcon,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PostComposerProps {
  onSubmit: (data: {
    content: string;
    platforms: string[];
    mediaUrls: string[];
    hashtags: string[];
    scheduledFor?: Date;
  }) => void;
  onAISuggest?: (content: string) => Promise<string>;
  isLoading?: boolean;
}

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: Facebook, maxLength: 63206 },
  { id: 'instagram', name: 'Instagram', icon: Instagram, maxLength: 2200 },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, maxLength: 3000 },
  { id: 'twitter', name: 'X', icon: Twitter, maxLength: 280 },
];

export function PostComposer({ onSubmit, onAISuggest, isLoading }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['facebook']);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [isScheduling, setIsScheduling] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const togglePlatform = (platformId: string) => {
    setPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags(prev => [...prev, tag]);
      setHashtagInput('');
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addHashtag();
    }
  };

  const handleAISuggest = async () => {
    if (!onAISuggest || !content) return;
    setIsGenerating(true);
    try {
      const suggestion = await onAISuggest(content);
      setContent(suggestion);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    let scheduledFor: Date | undefined;
    if (isScheduling && scheduledDate) {
      const [hours, minutes] = scheduledTime.split(':');
      scheduledFor = new Date(scheduledDate);
      scheduledFor.setHours(parseInt(hours), parseInt(minutes));
    }

    onSubmit({
      content,
      platforms,
      mediaUrls: [],
      hashtags,
      scheduledFor,
    });
  };

  const getCharLimit = () => {
    const selectedPlatforms = PLATFORMS.filter(p => platforms.includes(p.id));
    if (!selectedPlatforms.length) return Infinity;
    return Math.min(...selectedPlatforms.map(p => p.maxLength));
  };

  const charLimit = getCharLimit();
  const charsRemaining = charLimit - content.length;
  const isOverLimit = charsRemaining < 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          יצירת פוסט
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Selection */}
        <div className="space-y-2">
          <Label>פלטפורמות</Label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const isSelected = platforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                    isSelected 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isSelected && "text-primary")} />
                  <span className="text-sm">{platform.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>תוכן הפוסט</Label>
            {onAISuggest && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAISuggest}
                disabled={!content || isGenerating}
              >
                <Sparkles className={cn("h-4 w-4 ml-1", isGenerating && "animate-pulse")} />
                {isGenerating ? 'מייצר...' : 'שפר עם AI'}
              </Button>
            )}
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="מה ברצונך לשתף?"
            rows={5}
            className={cn(isOverLimit && "border-destructive")}
          />
          <div className={cn(
            "text-sm text-right",
            isOverLimit ? "text-destructive" : "text-muted-foreground"
          )}>
            {charLimit === Infinity ? content.length : `${charsRemaining} תווים נותרו`}
          </div>
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Hash className="h-4 w-4" />
            האשטגים
          </Label>
          <div className="flex gap-2">
            <Input
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="הוסף האשטג..."
              className="flex-1"
            />
            <Button variant="outline" onClick={addHashtag}>
              הוסף
            </Button>
          </div>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-sm"
                >
                  #{tag}
                  <button onClick={() => removeHashtag(tag)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Scheduling */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="schedule"
              checked={isScheduling}
              onCheckedChange={(checked) => setIsScheduling(checked as boolean)}
            />
            <Label htmlFor="schedule" className="flex items-center gap-1 cursor-pointer">
              <Clock className="h-4 w-4" />
              תזמן פרסום
            </Label>
          </div>

          {isScheduling && (
            <div className="flex gap-2 mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <CalendarIcon className="h-4 w-4 ml-2" />
                    {scheduledDate 
                      ? format(scheduledDate, 'dd/MM/yyyy', { locale: he })
                      : 'בחר תאריך'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={setScheduledDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-32"
              />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline">
          <Image className="h-4 w-4 ml-1" />
          הוסף מדיה
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!content || !platforms.length || isOverLimit || isLoading}
        >
          {isScheduling ? (
            <>
              <Clock className="h-4 w-4 ml-1" />
              תזמן
            </>
          ) : (
            <>
              <Send className="h-4 w-4 ml-1" />
              פרסם עכשיו
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default PostComposer;
