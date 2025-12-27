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

interface Persona {
  id: string;
  name: string;
  age_range: string | null;
  occupation: string | null;
  interests: string[] | null;
  goals: string[] | null;
  pain_points: string[] | null;
  client_id: string;
}

interface PersonaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: Persona | null;
  clientId: string;
  onSave: (data: Partial<Persona>) => void;
  isLoading?: boolean;
}

export function PersonaDialog({
  open,
  onOpenChange,
  persona,
  clientId,
  onSave,
  isLoading,
}: PersonaDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    age_range: "",
    occupation: "",
    interests: [] as string[],
    goals: [] as string[],
    pain_points: [] as string[],
  });
  
  const [newInterest, setNewInterest] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newPainPoint, setNewPainPoint] = useState("");

  useEffect(() => {
    if (persona) {
      setFormData({
        name: persona.name || "",
        age_range: persona.age_range || "",
        occupation: persona.occupation || "",
        interests: persona.interests || [],
        goals: persona.goals || [],
        pain_points: persona.pain_points || [],
      });
    } else {
      setFormData({
        name: "",
        age_range: "",
        occupation: "",
        interests: [],
        goals: [],
        pain_points: [],
      });
    }
  }, [persona, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      client_id: clientId,
    });
  };

  const addItem = (type: "interests" | "goals" | "pain_points", value: string, setter: (v: string) => void) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()],
      }));
      setter("");
    }
  };

  const removeItem = (type: "interests" | "goals" | "pain_points", index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{persona ? "עריכת פרסונה" : "פרסונה חדשה"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>שם הפרסונה *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="לדוגמה: מנהל שיווק"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>טווח גילאים</Label>
              <Input
                value={formData.age_range}
                onChange={(e) => setFormData(prev => ({ ...prev, age_range: e.target.value }))}
                placeholder="לדוגמה: 25-35"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>עיסוק</Label>
            <Input
              value={formData.occupation}
              onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
              placeholder="לדוגמה: מנהל שיווק בחברת הייטק"
            />
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label>תחומי עניין</Label>
            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="הוסף תחום עניין"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("interests", newInterest, setNewInterest))}
              />
              <Button type="button" size="icon" onClick={() => addItem("interests", newInterest, setNewInterest)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.interests.map((item, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {item}
                  <button type="button" onClick={() => removeItem("interests", i)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="space-y-2">
            <Label>מטרות</Label>
            <div className="flex gap-2">
              <Input
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="הוסף מטרה"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("goals", newGoal, setNewGoal))}
              />
              <Button type="button" size="icon" onClick={() => addItem("goals", newGoal, setNewGoal)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.goals.map((item, i) => (
                <Badge key={i} variant="outline" className="gap-1 bg-success/10 text-success border-success/20">
                  {item}
                  <button type="button" onClick={() => removeItem("goals", i)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Pain Points */}
          <div className="space-y-2">
            <Label>נקודות כאב</Label>
            <div className="flex gap-2">
              <Input
                value={newPainPoint}
                onChange={(e) => setNewPainPoint(e.target.value)}
                placeholder="הוסף נקודת כאב"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("pain_points", newPainPoint, setNewPainPoint))}
              />
              <Button type="button" size="icon" onClick={() => addItem("pain_points", newPainPoint, setNewPainPoint)}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.pain_points.map((item, i) => (
                <Badge key={i} variant="outline" className="gap-1 bg-destructive/10 text-destructive border-destructive/20">
                  {item}
                  <button type="button" onClick={() => removeItem("pain_points", i)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
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