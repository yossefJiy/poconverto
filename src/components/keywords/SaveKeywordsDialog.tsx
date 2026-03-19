import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface KeywordToSave {
  keyword: string;
  avgMonthlySearches: number;
  competition: string;
  competitionIndex: number;
  lowTopOfPageBidMicros: number;
  highTopOfPageBidMicros: number;
}

interface SaveKeywordsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keywords: KeywordToSave[];
  clientId: string;
  sourceQuery?: string;
  languageId?: string;
  locationId?: string;
  onSaved?: () => void;
}

const categoryTypes = [
  { value: "season", label: "עונה" },
  { value: "department", label: "מחלקה" },
  { value: "campaign", label: "קמפיין" },
  { value: "campaign_type", label: "סוג קמפיין" },
  { value: "product", label: "מוצר" },
  { value: "brand", label: "מותג" },
  { value: "custom", label: "מותאם אישית" },
];

export function SaveKeywordsDialog({
  open, onOpenChange, keywords, clientId, sourceQuery, languageId, locationId, onSaved
}: SaveKeywordsDialogProps) {
  const { toast } = useToast();
  const [categoryType, setCategoryType] = useState("custom");
  const [categoryValue, setCategoryValue] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleSave = async () => {
    if (!categoryValue.trim()) {
      toast({ title: "שגיאה", description: "הזן ערך קטגוריה", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const rows = keywords.map(kw => ({
        client_id: clientId,
        keyword: kw.keyword,
        category_type: categoryType,
        category_value: categoryValue.trim(),
        tags: JSON.stringify(tags),
        avg_monthly_searches: kw.avgMonthlySearches,
        competition: kw.competition,
        competition_index: kw.competitionIndex,
        low_bid: kw.lowTopOfPageBidMicros,
        high_bid: kw.highTopOfPageBidMicros,
        notes: notes || null,
        source_query: sourceQuery || null,
        language_id: languageId || '1027',
        location_id: locationId || '2376',
        last_refreshed_at: new Date().toISOString(),
        created_by: user?.id || null,
      }));

      const { error } = await supabase
        .from('saved_keywords' as any)
        .upsert(rows as any, { onConflict: 'client_id,keyword,category_type,category_value' });

      if (error) throw error;

      toast({ title: "נשמר", description: `${keywords.length} מילות מפתח נשמרו בהצלחה` });
      onOpenChange(false);
      setCategoryValue("");
      setTags([]);
      setNotes("");
      onSaved?.();
    } catch (err: any) {
      console.error('Save keywords error:', err);
      toast({ title: "שגיאה", description: err.message || "שגיאה בשמירת מילות מפתח", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>שמירת {keywords.length} מילות מפתח</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>סוג קטגוריה</Label>
            <Select value={categoryType} onValueChange={setCategoryType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categoryTypes.map(ct => (
                  <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>ערך קטגוריה</Label>
            <Input
              value={categoryValue}
              onChange={e => setCategoryValue(e.target.value)}
              placeholder="למשל: קיץ 2025, שמלות, חג פסח"
            />
          </div>

          <div>
            <Label>תגיות</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="הוסף תגית"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={addTag}>+</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>הערות</Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="הערות חופשיות (אופציונלי)"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            שמור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
