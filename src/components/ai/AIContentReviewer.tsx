import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertTriangle, XCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ReviewResult {
  score: number;
  issues: { type: string; message: string; severity: "error" | "warning" | "info" }[];
  suggestions: string[];
  summary: string;
}

export function AIContentReviewer() {
  const [content, setContent] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);

  const reviewContent = async () => {
    if (!content.trim()) {
      toast.error("נא להזין תוכן לבדיקה");
      return;
    }

    setIsReviewing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-content-reviewer", {
        body: { content },
      });

      if (error) throw error;
      setResult(data);
      toast.success("הבדיקה הושלמה");
    } catch (error) {
      console.error("Review error:", error);
      toast.error("שגיאה בבדיקת התוכן. נסה שוב מאוחר יותר.");
    } finally {
      setIsReviewing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error": return <XCircle className="h-4 w-4 text-destructive" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-warning" />;
      default: return <CheckCircle className="h-4 w-4 text-info" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            סקירת תוכן ב-AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              placeholder="הדבק את התוכן שברצונך לבדוק כאן..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
            />
          </div>
          <Button 
            onClick={reviewContent} 
            disabled={isReviewing || !content.trim()}
            className="w-full"
          >
            {isReviewing ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                בודק...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 ml-2" />
                בדוק תוכן
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>ציון כללי</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <span className={`text-6xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score}
                </span>
                <p className="text-muted-foreground mt-2">מתוך 100</p>
              </div>
              <p className="text-center mt-4 text-sm">{result.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>בעיות שנמצאו</CardTitle>
            </CardHeader>
            <CardContent>
              {result.issues.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  לא נמצאו בעיות! 🎉
                </p>
              ) : (
                <div className="space-y-3">
                  {result.issues.map((issue, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                      {getSeverityIcon(issue.severity)}
                      <div>
                        <Badge variant="outline" className="mb-1">{issue.type}</Badge>
                        <p className="text-sm">{issue.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>הצעות לשיפור</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
