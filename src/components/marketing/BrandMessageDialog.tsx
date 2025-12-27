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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BrandMessage {
  id: string;
  message: string;
  category: string | null;
  is_active: boolean | null;
  client_id: string;
}

interface BrandMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: BrandMessage | null;
  clientId: string;
  onSave: (data: Partial<BrandMessage>) => void;
  isLoading?: boolean;
}

const categories = [
  { value: "tagline", label: "סלוגן" },
  { value: "value_proposition", label: "הצעת ערך" },
  { value: "mission", label: "משימה" },
  { value: "vision", label: "חזון" },
  { value: "usp", label: "יתרון תחרותי" },
  { value: "tone", label: "טון דיבור" },
  { value: "call_to_action", label: "קריאה לפעולה" },
  { value: "other", label: "אחר" },
];

export function BrandMessageDialog({
  open,
  onOpenChange,
  message,
  clientId,
  onSave,
  isLoading,
}: BrandMessageDialogProps) {
  const [formData, setFormData] = useState({
    message: "",
    category: "tagline",
    is_active: true,
  });

  useEffect(() => {
    if (message) {
      setFormData({
        message: message.message || "",
        category: message.category || "tagline",
        is_active: message.is_active ?? true,
      });
    } else {
      setFormData({
        message: "",
        category: "tagline",
        is_active: true,
      });
    }
  }, [message, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      client_id: clientId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{message ? "עריכת מסר" : "מסר חדש"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>קטגוריה</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>המסר *</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="כתוב את המסר כאן..."
              rows={4}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>מסר פעיל</Label>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading || !formData.message}>
              {isLoading ? "שומר..." : "שמור"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}