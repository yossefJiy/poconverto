import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface Competitor {
  id: string;
  name: string;
  website: string | null;
  notes: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  client_id: string;
}

interface CompetitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitor: Competitor | null;
  clientId: string;
  onSave: (data: Partial<Competitor>) => void;
  isLoading?: boolean;
}

export function CompetitorDialog({
  open,
  onOpenChange,
  competitor,
  clientId,
  onSave,
  isLoading,
}: CompetitorDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    notes: "",
    strengths: [] as string[],
    weaknesses: [] as string[],
  });
  
  const [newStrength, setNewStrength] = useState("");
  const [newWeakness, setNewWeakness] = useState("");

  useEffect(() => {
    if (competitor) {
      setFormData({
        name: competitor.name || "",
        website: competitor.website || "",
        notes: competitor.notes || "",
        strengths: competitor.strengths || [],
        weaknesses: competitor.weaknesses || [],
      });
    } else {
      setFormData({
        name: "",
        website: "",
        notes: "",
        strengths: [],
        weaknesses: [],
      });
    }
  }, [competitor, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      client_id: clientId,
    });
  };

  const addItem = (type: "strengths" | "weaknesses", value: string, setter: (v: string) => void) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()],
      }));
      setter("");
    }
  };

  const removeItem = (type: "strengths" | "weaknesses", index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{competitor ? "עריכת מתחרה" : "מתחרה חדש"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>שם המתחרה *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="שם החברה המתחרה"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>אתר אינטרנט</Label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://example.com"
              dir="ltr"
            />
          </div>

          {/* Strengths */}
          <div className="space-y-2">
            <Label>חוזקות</Label>
            <div className="flex gap-2">
              <Input
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
                placeholder="הוסף חוזקה"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("strengths", newStrength, setNewStrength))}
              />
              <Button type="button" size="icon" onClick={() => addItem("strengths", newStrength, setNewStrength)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.strengths.map((item, i) => (
                <Badge key={i} variant="outline" className="gap-1 bg-success/10 text-success border-success/20">
                  {item}
                  <button type="button" onClick={() => removeItem("strengths", i)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="space-y-2">
            <Label>חולשות</Label>
            <div className="flex gap-2">
              <Input
                value={newWeakness}
                onChange={(e) => setNewWeakness(e.target.value)}
                placeholder="הוסף חולשה"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("weaknesses", newWeakness, setNewWeakness))}
              />
              <Button type="button" size="icon" onClick={() => addItem("weaknesses", newWeakness, setNewWeakness)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.weaknesses.map((item, i) => (
                <Badge key={i} variant="outline" className="gap-1 bg-destructive/10 text-destructive border-destructive/20">
                  {item}
                  <button type="button" onClick={() => removeItem("weaknesses", i)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>הערות</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="הערות נוספות על המתחרה..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading ? "שומר..." : "שמור"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}