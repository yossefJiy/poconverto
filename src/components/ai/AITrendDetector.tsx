import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Zap, ArrowRight, Lightbulb } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Trend {
  id: string;
  metric: string;
  direction: "up" | "down" | "stable";
  strength: number; // 0-100
  prediction: string;
  data: { date: string; value: number }[];
  insight: string;
}

export function AITrendDetector() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trends, setTrends] = useState<Trend[]>([]);

  const analyzeTrends = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setTrends([
      {
        id: "1",
        metric: "המרות",
        direction: "up",
        strength: 85,
        prediction: "צפי לעלייה של 12% בשבוע הבא",
        data: Array.from({ length: 7 }, (_, i) => ({
          date: `יום ${i + 1}`,
          value: 100 + Math.random() * 50 + i * 10,
        })),
        insight: "מגמת עלייה עקבית בהמרות, ככל הנראה בזכות קמפיין הרימרקטינג החדש",
      },
      {
        id: "2",
        metric: "עלות רכישה (CPA)",
        direction: "down",
        strength: 72,
        prediction: "צפי לירידה ב-CPA ב-8%",
        data: Array.from({ length: 7 }, (_, i) => ({
          date: `יום ${i + 1}`,
          value: 50 - Math.random() * 10 - i * 2,
        })),
        insight: "ה-CPA יורד עקב שיפור באיכות הקהלים והמודעות",
      },
      {
        id: "3",
        metric: "תעבורה אורגנית",
        direction: "up",
        strength: 65,
        prediction: "צמיחה מתונה של 5%",
        data: Array.from({ length: 7 }, (_, i) => ({
          date: `יום ${i + 1}`,
          value: 500 + Math.random() * 100 + i * 20,
        })),
        insight: "עלייה בתעבורה אורגנית לאחר עדכון תוכן ו-SEO",
      },
    ]);
    setIsAnalyzing(false);
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "up": return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "down": return <TrendingDown className="h-5 w-5 text-red-500" />;
      default: return <ArrowRight className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return "bg-green-500";
    if (strength >= 60) return "bg-yellow-500";
    return "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            זיהוי מגמות AI
          </CardTitle>
          <Button onClick={analyzeTrends} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                מנתח...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 ml-2" />
                נתח מגמות
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            המערכת מנתחת את הנתונים שלך ומזהה מגמות עולות ויורדות כדי לחזות ביצועים עתידיים
          </p>
        </CardContent>
      </Card>

      {trends.length > 0 && (
        <div className="grid gap-6">
          {trends.map((trend) => (
            <Card key={trend.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getDirectionIcon(trend.direction)}
                    <div>
                      <CardTitle className="text-lg">{trend.metric}</CardTitle>
                      <p className="text-sm text-muted-foreground">{trend.prediction}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">חוזק:</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getStrengthColor(trend.strength)}`}
                        style={{ width: `${trend.strength}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{trend.strength}%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend.data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={trend.direction === "up" ? "#10b981" : trend.direction === "down" ? "#ef4444" : "#6b7280"}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center">
                    <div className="p-4 bg-primary/5 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">תובנה</p>
                          <p className="text-sm text-muted-foreground">{trend.insight}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
