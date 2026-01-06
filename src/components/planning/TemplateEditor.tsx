import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, GripVertical, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TemplatePart {
  title: string;
  prompt: string;
}

interface PlanningTemplate {
  id?: string;
  name: string;
  description: string;
  template_type: string;
  system_prompt?: string;
  background_context?: string;
  parts: TemplatePart[];
}

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: PlanningTemplate | null;
  onSave: () => void;
}

export const TemplateEditor = ({ 
  open, 
  onOpenChange, 
  template, 
  onSave 
}: TemplateEditorProps) => {
  const [formData, setFormData] = useState<PlanningTemplate>({
    name: "",
    description: "",
    template_type: "general",
    system_prompt: "",
    background_context: "",
    parts: [{ title: "", prompt: "" }]
  });
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (template) {
      setFormData({
        ...template,
        system_prompt: template.system_prompt || "",
        background_context: template.background_context || ""
      });
    } else {
      setFormData({
        name: "",
        description: "",
        template_type: "general",
        system_prompt: "",
        background_context: "",
        parts: [{ title: "", prompt: "" }]
      });
    }
  }, [template, open]);

  const handleAddPart = () => {
    setFormData(prev => ({
      ...prev,
      parts: [...prev.parts, { title: "", prompt: "" }]
    }));
  };

  const handleRemovePart = (index: number) => {
    if (formData.parts.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  const handlePartChange = (index: number, field: 'title' | 'prompt', value: string) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newParts = [...formData.parts];
    const [draggedPart] = newParts.splice(draggedIndex, 1);
    newParts.splice(index, 0, draggedPart);
    
    setFormData(prev => ({ ...prev, parts: newParts }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("יש להזין שם לתבנית");
      return;
    }

    if (formData.parts.some(p => !p.title.trim() || !p.prompt.trim())) {
      toast.error("יש למלא את כל השלבים");
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        template_type: formData.template_type,
        system_prompt: formData.system_prompt || null,
        background_context: formData.background_context || null,
        parts: JSON.parse(JSON.stringify(formData.parts)),
        is_active: true
      };

      if (template?.id) {
        const { error } = await supabase
          .from('planning_templates')
          .update(dataToSave)
          .eq('id', template.id);
        
        if (error) throw error;
        toast.success("התבנית עודכנה בהצלחה");
      } else {
        const { error } = await supabase
          .from('planning_templates')
          .insert(dataToSave);
        
        if (error) throw error;
        toast.success("התבנית נוצרה בהצלחה");
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error("שגיאה בשמירת התבנית");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {template?.id ? "עריכת תבנית" : "תבנית חדשה"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          <div className="space-y-6 p-1">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>שם התבנית</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="אפיון אתר תדמית"
                />
              </div>
              <div className="space-y-2">
                <Label>סוג</Label>
                <Input
                  value={formData.template_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_type: e.target.value }))}
                  placeholder="website"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>תיאור</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="תיאור קצר של התבנית..."
                rows={2}
              />
            </div>

            {/* System Prompt */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                System Prompt
                <span className="text-xs text-muted-foreground">(נהנה מ-prompt caching)</span>
              </Label>
              <Textarea
                value={formData.system_prompt}
                onChange={(e) => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
                placeholder="הנחיות כלליות ל-Claude שיישארו קבועות לאורך כל השיחה..."
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            {/* Background Context */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Background Context
                <span className="text-xs text-muted-foreground">(קונטקסט נוסף קבוע)</span>
              </Label>
              <Textarea
                value={formData.background_context}
                onChange={(e) => setFormData(prev => ({ ...prev, background_context: e.target.value }))}
                placeholder="מידע רקע על הלקוח, הפרויקט, או דרישות ספציפיות..."
                rows={3}
              />
            </div>

            {/* Parts */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>שלבי הדיאלוג</Label>
                <Button size="sm" variant="outline" onClick={handleAddPart}>
                  <Plus className="h-4 w-4 ml-1" />
                  הוסף שלב
                </Button>
              </div>

              <div className="space-y-3">
                {formData.parts.map((part, index) => (
                  <Card 
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`transition-opacity ${draggedIndex === index ? 'opacity-50' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="cursor-grab pt-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground w-6">
                              {index + 1}.
                            </span>
                            <Input
                              value={part.title}
                              onChange={(e) => handlePartChange(index, 'title', e.target.value)}
                              placeholder="כותרת השלב"
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemovePart(index)}
                              disabled={formData.parts.length <= 1}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={part.prompt}
                            onChange={(e) => handlePartChange(index, 'prompt', e.target.value)}
                            placeholder="הפרומפט / שאלה..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 ml-2" />
            )}
            שמור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
