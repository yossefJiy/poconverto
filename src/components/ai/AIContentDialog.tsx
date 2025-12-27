import { useState } from "react";
import { 
  Sparkles, 
  FileText, 
  Lightbulb, 
  Target, 
  TrendingUp,
  Loader2,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAIMarketing } from "@/hooks/useAIMarketing";
import { cn } from "@/lib/utils";

interface AIContentDialogProps {
  context: {
    client_name?: string;
    industry?: string;
    personas?: any[];
    competitors?: any[];
    brand_messages?: any[];
    goals?: any[];
  };
}

const contentTypes = [
  { id: 'ad', label: 'מודעה', icon: FileText, description: 'טקסט למודעות פרסום' },
  { id: 'post', label: 'פוסט', icon: Sparkles, description: 'תוכן לרשתות חברתיות' },
  { id: 'headline', label: 'כותרות', icon: Lightbulb, description: 'כותרות שמושכות תשומת לב' },
  { id: 'cta', label: 'קריאה לפעולה', icon: Target, description: 'CTAs אפקטיביים' },
];

const platforms = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'google', label: 'Google Ads' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'tiktok', label: 'TikTok' },
];

export function AIContentDialog({ context }: AIContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [contentType, setContentType] = useState('ad');
  const [platform, setPlatform] = useState('facebook');
  const [customPrompt, setCustomPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  
  const { isLoading, response, generateContent } = useAIMarketing();

  const handleGenerate = async () => {
    const selectedType = contentTypes.find(t => t.id === contentType);
    await generateContent(
      { ...context, platform },
      `צור ${selectedType?.label} עבור ${platform}. ${customPrompt}`
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="glow">
          <Sparkles className="w-4 h-4 ml-2" />
          יצירת תוכן AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            יצירת תוכן שיווקי עם AI
          </DialogTitle>
          <DialogDescription>
            בחר סוג תוכן ופלטפורמה ליצירת תוכן מותאם אישית
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Content Type Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">סוג תוכן</label>
            <div className="grid grid-cols-2 gap-3">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setContentType(type.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-right transition-all",
                    contentType === type.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      contentType === type.id ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <type.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">פלטפורמה</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {platforms.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Instructions */}
          <div>
            <label className="text-sm font-medium mb-2 block">הנחיות נוספות (אופציונלי)</label>
            <Textarea
              placeholder="לדוגמה: התמקד בהנחה מיוחדת לחג..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={2}
            />
          </div>

          {/* Generate Button */}
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                יוצר תוכן...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 ml-2" />
                צור תוכן
              </>
            )}
          </Button>

          {/* Response */}
          {response && (
            <div className="relative">
              <div className="absolute top-2 left-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="p-4 bg-muted rounded-xl whitespace-pre-wrap text-sm leading-relaxed">
                {response}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
