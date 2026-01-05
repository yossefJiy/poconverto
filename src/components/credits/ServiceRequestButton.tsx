import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Coins, Clock, Loader2 } from "lucide-react";
import { useClientCredits, calculateTaskCredits, creditsToHours, creditsToCost } from "@/hooks/useClientCredits";
import { cn } from "@/lib/utils";

interface ServiceRequestButtonProps {
  clientId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ServiceRequestButton({ 
  clientId, 
  variant = "default", 
  size = "default",
  className 
}: ServiceRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { submitTaskRequest, remainingCredits } = useClientCredits(clientId);
  
  const estimatedCredits = calculateTaskCredits(estimatedHours * 60);
  const estimatedCost = creditsToCost(estimatedCredits);
  const hasEnoughCredits = remainingCredits >= estimatedCredits;

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("יש להזין כותרת לבקשה");
      return;
    }

    setIsSubmitting(true);
    try {
      submitTaskRequest({
        clientId,
        title: title.trim(),
        description: description.trim() || undefined,
        estimatedCredits,
      });
      
      setOpen(false);
      setTitle("");
      setDescription("");
      setEstimatedHours(1);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Plus className="w-4 h-4 mr-1" />
          בקש שירות
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            בקשת שירות חדשה
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">כותרת הבקשה *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: עיצוב באנר לפייסבוק"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">תיאור (אופציונלי)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תאר את הבקשה בפירוט..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hours">זמן משוער (שעות)</Label>
            <Input
              id="hours"
              type="number"
              min={0.5}
              max={100}
              step={0.5}
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Math.max(0.5, parseFloat(e.target.value) || 1))}
            />
          </div>

          {/* Credits Preview */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                זמן משוער:
              </span>
              <span className="font-medium">{estimatedHours} שעות</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Coins className="w-4 h-4" />
                קרדיטים:
              </span>
              <span className={cn(
                "text-lg font-bold",
                hasEnoughCredits ? "text-primary" : "text-destructive"
              )}>
                {estimatedCredits}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">עלות משוערת:</span>
              <span className="font-bold">₪{estimatedCost.toLocaleString()}</span>
            </div>
            
            {!hasEnoughCredits && (
              <p className="text-xs text-destructive">
                ⚠️ אין מספיק קרדיטים. נותרו: {remainingCredits}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                שולח...
              </>
            ) : (
              "שלח בקשה"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
