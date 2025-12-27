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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Goal {
  id: string;
  name: string;
  target_value: number;
  current_value: number | null;
  unit: string | null;
  period: string | null;
  client_id: string;
}

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  clientId: string;
  onSave: (data: Partial<Goal>) => void;
  isLoading?: boolean;
}

const periods = [
  { value: "daily", label: "יומי" },
  { value: "weekly", label: "שבועי" },
  { value: "monthly", label: "חודשי" },
  { value: "quarterly", label: "רבעוני" },
  { value: "yearly", label: "שנתי" },
];

const units = [
  { value: "", label: "ללא" },
  { value: "%", label: "אחוז (%)" },
  { value: "₪", label: 'ש"ח (₪)' },
  { value: "$", label: "דולר ($)" },
  { value: "leads", label: "לידים" },
  { value: "sales", label: "מכירות" },
  { value: "users", label: "משתמשים" },
  { value: "views", label: "צפיות" },
  { value: "clicks", label: "קליקים" },
];

export function GoalDialog({
  open,
  onOpenChange,
  goal,
  clientId,
  onSave,
  isLoading,
}: GoalDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    target_value: 0,
    current_value: 0,
    unit: "",
    period: "monthly",
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name || "",
        target_value: goal.target_value || 0,
        current_value: goal.current_value || 0,
        unit: goal.unit || "",
        period: goal.period || "monthly",
      });
    } else {
      setFormData({
        name: "",
        target_value: 0,
        current_value: 0,
        unit: "",
        period: "monthly",
      });
    }
  }, [goal, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      client_id: clientId,
    });
  };

  const percentage = formData.target_value > 0 
    ? (formData.current_value / formData.target_value) * 100 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{goal ? "עריכת יעד" : "יעד חדש"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>שם היעד *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="לדוגמה: לידים חודשיים"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>יעד</Label>
              <Input
                type="number"
                value={formData.target_value}
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: parseFloat(e.target.value) || 0 }))}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>מצב נוכחי</Label>
              <Input
                type="number"
                value={formData.current_value}
                onChange={(e) => setFormData(prev => ({ ...prev, current_value: parseFloat(e.target.value) || 0 }))}
                min={0}
              />
            </div>
          </div>

          {/* Progress Preview */}
          {formData.target_value > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>התקדמות</span>
                <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    percentage >= 80 ? "bg-success" : percentage >= 50 ? "bg-warning" : "bg-destructive"
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>יחידה</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר יחידה" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>תקופה</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => setFormData(prev => ({ ...prev, period: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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