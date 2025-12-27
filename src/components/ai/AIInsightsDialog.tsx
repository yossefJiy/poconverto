import { useState } from "react";
import { 
  Brain, 
  Loader2, 
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAIMarketing } from "@/hooks/useAIMarketing";
import { cn } from "@/lib/utils";

interface AIInsightsDialogProps {
  context: {
    client_name?: string;
    industry?: string;
    campaign_data?: any;
    goals?: any[];
  };
}

export function AIInsightsDialog({ context }: AIInsightsDialogProps) {
  const [open, setOpen] = useState(false);
  const { isLoading, response, generateInsights } = useAIMarketing();

  const handleGenerate = async () => {
    await generateInsights(context);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Brain className="w-4 h-4 ml-2" />
          ניתוח AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            ניתוח ביצועים עם AI
          </DialogTitle>
          <DialogDescription>
            קבל תובנות והמלצות מבוססות נתונים
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {!response && (
            <div className="text-center py-8">
              <Brain className="w-16 h-16 mx-auto mb-4 text-primary/50" />
              <p className="text-muted-foreground mb-4">
                לחץ לניתוח ביצועי הקמפיינים וקבלת המלצות לשיפור
              </p>
              <Button 
                size="lg"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מנתח נתונים...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 ml-2" />
                    התחל ניתוח
                  </>
                )}
              </Button>
            </div>
          )}

          {response && (
            <div className="p-4 bg-muted rounded-xl whitespace-pre-wrap text-sm leading-relaxed">
              {response}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
