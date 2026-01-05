import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
}

const ruleTypes = [
  { value: "budget_cap", label: "תקרת תקציב" },
  { value: "performance_threshold", label: "סף ביצועים" },
  { value: "time_based", label: "מבוסס זמן" },
  { value: "auto_optimization", label: "אופטימיזציה אוטומטית" },
];

export function CreateRuleDialog({ open, onOpenChange, clientId }: CreateRuleDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    ruleType: "",
    description: "",
    threshold: "",
    action: "pause",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("budget_rules").insert({
        name: formData.name,
        rule_type: formData.ruleType,
        client_id: clientId || null,
        conditions: {
          threshold: parseFloat(formData.threshold) || 0,
          description: formData.description,
        },
        actions: {
          type: formData.action,
        },
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("הכלל נוצר בהצלחה");
      queryClient.invalidateQueries({ queryKey: ["budget-rules"] });
      onOpenChange(false);
      setFormData({
        name: "",
        ruleType: "",
        description: "",
        threshold: "",
        action: "pause",
      });
    },
    onError: () => {
      toast.error("שגיאה ביצירת הכלל");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>כלל הקצאה חדש</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>שם הכלל *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="לדוגמה: עצור קמפיין בהוצאה גבוהה"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>סוג כלל *</Label>
            <Select
              value={formData.ruleType}
              onValueChange={(v) => setFormData({ ...formData, ruleType: v })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג כלל" />
              </SelectTrigger>
              <SelectContent>
                {ruleTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>סף / ערך</Label>
            <Input
              type="number"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
              placeholder="לדוגמה: 1000"
            />
          </div>

          <div className="space-y-2">
            <Label>פעולה</Label>
            <Select
              value={formData.action}
              onValueChange={(v) => setFormData({ ...formData, action: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pause">השהה קמפיין</SelectItem>
                <SelectItem value="reduce_budget">הקטן תקציב</SelectItem>
                <SelectItem value="increase_budget">הגדל תקציב</SelectItem>
                <SelectItem value="notify">התראה בלבד</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>תיאור</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="הסבר על הכלל..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              צור כלל
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
