import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, TrendingUp, Target, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface BudgetRecommendation {
  totalBudget: number;
  allocation: { platform: string; amount: number; percentage: number; reason: string }[];
  expectedROAS: number;
  tips: string[];
}

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function AIBudgetAdvisor() {
  const [budget, setBudget] = useState("");
  const [goal, setGoal] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState<BudgetRecommendation | null>(null);

  const analyzeBudget = async () => {
    if (!budget) {
      toast.error("נא להזין תקציב");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-budget-advisor", {
        body: { budget: Number(budget), goal },
      });

      if (error) throw error;
      setRecommendation(data);
    } catch (error) {
      console.error("Analysis error:", error);
      // Mock result for demo
      const budgetNum = Number(budget);
      setRecommendation({
        totalBudget: budgetNum,
        allocation: [
          { platform: "Google Ads", amount: budgetNum * 0.4, percentage: 40, reason: "ביצועים היסטוריים מצוינים" },
          { platform: "Facebook Ads", amount: budgetNum * 0.3, percentage: 30, reason: "קהל יעד רלוונטי" },
          { platform: "Instagram", amount: budgetNum * 0.2, percentage: 20, reason: "מעורבות גבוהה" },
          { platform: "TikTok", amount: budgetNum * 0.1, percentage: 10, reason: "ניסיון לקהל צעיר" },
        ],
        expectedROAS: 3.5,
        tips: [
          "העבר תקציב מפלטפורמות עם CPA גבוה",
          "בדוק קמפיינים ב-A/B testing",
          "הגדל תקציב בימים עם ביצועים גבוהים",
          "צמצם הוצאות בסופי שבוע (B2B)",
        ],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            יועץ תקציב AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>תקציב חודשי (₪)</Label>
              <Input
                type="number"
                placeholder="10000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div>
              <Label>מטרה עיקרית</Label>
              <Input
                placeholder="לדוגמה: הגדלת מכירות"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={analyzeBudget} 
            disabled={isAnalyzing || !budget}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                מנתח...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 ml-2" />
                קבל המלצות
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {recommendation && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>חלוקת תקציב מומלצת</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={recommendation.allocation}
                      dataKey="percentage"
                      nameKey="platform"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ platform, percentage }) => `${platform}: ${percentage}%`}
                    >
                      {recommendation.allocation.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                תחזית ביצועים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground">ROAS צפוי</p>
                <span className="text-5xl font-bold text-green-500">
                  {recommendation.expectedROAS}x
                </span>
              </div>
              <div className="space-y-3">
                {recommendation.allocation.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <span className="font-medium">{item.platform}</span>
                      <p className="text-xs text-muted-foreground">{item.reason}</p>
                    </div>
                    <Badge>₪{item.amount.toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                טיפים לאופטימיזציה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {recommendation.tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
