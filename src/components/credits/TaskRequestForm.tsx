import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, Clock, Coins } from "lucide-react";
import { useClientCredits, calculateTaskCredits, PRICE_PER_HOUR } from "@/hooks/useClientCredits";

interface TaskRequestFormProps {
  clientId: string;
  onSuccess?: () => void;
}

export function TaskRequestForm({ clientId, onSuccess }: TaskRequestFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { submitTaskRequest } = useClientCredits(clientId);

  const estimatedCredits = calculateTaskCredits(durationHours * 60);
  const estimatedCost = durationHours * PRICE_PER_HOUR;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await submitTaskRequest({
        clientId,
        title: title.trim(),
        description: description.trim() || undefined,
        estimatedCredits,
      });
      setTitle("");
      setDescription("");
      setDurationHours(1);
      onSuccess?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          בקשת משימה חדשה
        </CardTitle>
        <CardDescription>
          שלחו בקשה לצוות JIY - הבקשה תעבור לאישור לפני ביצוע
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">כותרת המשימה *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: עיצוב באנר לפייסבוק"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור מפורט</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תארו את המשימה בפירוט..."
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>משך זמן משוער</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[durationHours]}
                onValueChange={(value) => setDurationHours(value[0])}
                min={0.5}
                max={10}
                step={0.5}
                className="flex-1"
              />
              <div className="w-24 text-center">
                <div className="flex items-center justify-center gap-1 text-lg font-bold">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {durationHours} שעות
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Coins className="w-4 h-4" />
                קרדיטים משוערים:
              </span>
              <span className="font-bold">{estimatedCredits}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">עלות משוערת:</span>
              <span className="font-bold">₪{estimatedCost.toLocaleString()}</span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? (
              "שולח..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                שלח בקשה לאישור
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
