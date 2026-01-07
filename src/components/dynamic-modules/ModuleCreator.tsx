import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bot, Code, FileText, LineChart, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDynamicModuleMutations } from '@/hooks/useDynamicModules';

const moduleSchema = z.object({
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  slug: z.string().min(2, 'Slug חייב להכיל לפחות 2 תווים').regex(/^[a-z0-9-]+$/, 'רק אותיות קטנות, מספרים ומקפים'),
  description: z.string().optional(),
  category: z.enum(['content', 'code', 'analysis', 'planning']),
  ai_model: z.string().default('google/gemini-2.5-flash'),
  system_prompt: z.string().optional(),
  icon: z.string().default('Bot'),
  color: z.string().default('#3B82F6')
});

type ModuleFormData = z.infer<typeof moduleSchema>;

const CATEGORIES = [
  { value: 'content', label: 'תוכן', icon: FileText },
  { value: 'code', label: 'קוד', icon: Code },
  { value: 'analysis', label: 'ניתוח', icon: LineChart },
  { value: 'planning', label: 'תכנון', icon: Lightbulb }
];

const AI_MODELS = [
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'מהיר ויעיל' },
  { value: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', description: 'הכי מהיר וזול' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'הכי חזק' },
  { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro', description: 'הדור הבא' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini', description: 'מאוזן' },
  { value: 'openai/gpt-5', label: 'GPT-5', description: 'הכי מדויק' },
  { value: 'openai/gpt-5-nano', label: 'GPT-5 Nano', description: 'חסכוני' }
];

const ICONS = [
  'Bot', 'FileText', 'Code', 'LineChart', 'Lightbulb', 'MessageSquare', 
  'Zap', 'Sparkles', 'Target', 'Rocket', 'Brain', 'Wand2'
];

const COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4',
  '#6366F1', '#EF4444', '#84CC16', '#14B8A6'
];

interface ModuleCreatorProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ModuleCreator({ trigger, onSuccess }: ModuleCreatorProps) {
  const [open, setOpen] = useState(false);
  const { createModule } = useDynamicModuleMutations();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      category: 'content',
      ai_model: 'google/gemini-2.5-flash',
      icon: 'Bot',
      color: '#3B82F6'
    }
  });

  const selectedCategory = watch('category');
  const selectedIcon = watch('icon');
  const selectedColor = watch('color');

  const onSubmit = async (data: ModuleFormData) => {
    await createModule.mutateAsync({
      name: data.name,
      slug: data.slug,
      description: data.description,
      category: data.category,
      ai_model: data.ai_model,
      system_prompt: data.system_prompt,
      icon: data.icon,
      color: data.color
    });
    
    reset();
    setOpen(false);
    onSuccess?.();
  };

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setValue('slug', slug);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Bot className="w-4 h-4 ml-2" />
            צור מודול חדש
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>יצירת מודול AI חדש</DialogTitle>
          <DialogDescription>
            צור מודול AI מותאם אישית שיופיע בסיידבר
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם המודול</Label>
              <Input
                id="name"
                {...register('name')}
                onChange={(e) => {
                  register('name').onChange(e);
                  handleNameChange(e);
                }}
                placeholder="למשל: מחולל פוסטים"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="post-generator"
                dir="ltr"
              />
              {errors.slug && (
                <p className="text-xs text-destructive">{errors.slug.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="תיאור קצר של המודול"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setValue('category', value as ModuleFormData['category'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>מודל AI</Label>
              <Select
                value={watch('ai_model')}
                onValueChange={(value) => setValue('ai_model', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex flex-col">
                        <span>{model.label}</span>
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>אייקון וצבע</Label>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {COLORS.slice(0, 6).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('color', color)}
                    className={`w-6 h-6 rounded-full transition-transform ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: selectedColor + '20', color: selectedColor }}
              >
                <Bot className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="system_prompt">System Prompt (אופציונלי)</Label>
            <Textarea
              id="system_prompt"
              {...register('system_prompt')}
              placeholder="הנחיות ל-AI..."
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              צור מודול
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
