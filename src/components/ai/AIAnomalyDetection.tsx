import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, Bell, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Anomaly {
  id: string;
  type: "spike" | "drop" | "unusual";
  metric: string;
  platform: string;
  severity: "high" | "medium" | "low";
  description: string;
  detectedAt: string;
  value: number;
  expectedValue: number;
  percentChange: number;
}

export function AIAnomalyDetection() {
  const [scanning, setScanning] = useState(false);

  const { data: anomalies = [], refetch } = useQuery({
    queryKey: ["ai-anomalies"],
    queryFn: async () => {
      // Mock anomalies for demo
      return [
        {
          id: "1",
          type: "spike",
          metric: "CPC",
          platform: "Google Ads",
          severity: "high",
          description: "עלייה חריגה בעלות לקליק בקמפיין 'מבצע חורף'",
          detectedAt: new Date().toISOString(),
          value: 4.5,
          expectedValue: 2.8,
          percentChange: 60.7,
        },
        {
          id: "2",
          type: "drop",
          metric: "CTR",
          platform: "Facebook Ads",
          severity: "medium",
          description: "ירידה ב-CTR במודעות וידאו",
          detectedAt: new Date().toISOString(),
          value: 0.8,
          expectedValue: 1.5,
          percentChange: -46.7,
        },
        {
          id: "3",
          type: "unusual",
          metric: "Impressions",
          platform: "Instagram",
          severity: "low",
          description: "דפוס חשיפות יוצא דופן בשעות הלילה",
          detectedAt: new Date().toISOString(),
          value: 15000,
          expectedValue: 5000,
          percentChange: 200,
        },
      ] as Anomaly[];
    },
  });

  const runScan = async () => {
    setScanning(true);
    // Simulate AI scan
    await new Promise(resolve => setTimeout(resolve, 2000));
    await refetch();
    setScanning(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "spike": return <TrendingUp className="h-5 w-5 text-red-500" />;
      case "drop": return <TrendingDown className="h-5 w-5 text-yellow-500" />;
      default: return <AlertTriangle className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            זיהוי חריגות AI
          </CardTitle>
          <Button onClick={runScan} disabled={scanning}>
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                סורק...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 ml-2" />
                סרוק עכשיו
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            המערכת מנתחת את הנתונים שלך ומזהה דפוסים חריגים שדורשים תשומת לב
          </p>
          
          <div className="grid gap-3 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">חריגות גבוהות</p>
                    <p className="text-2xl font-bold text-red-500">
                      {anomalies.filter(a => a.severity === "high").length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">חריגות בינוניות</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {anomalies.filter(a => a.severity === "medium").length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">התראות</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {anomalies.filter(a => a.severity === "low").length}
                    </p>
                  </div>
                  <Bell className="h-8 w-8 text-blue-500/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {anomalies.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">הכל תקין!</h3>
          <p className="text-muted-foreground">לא נמצאו חריגות בנתונים</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {anomalies.map((anomaly) => (
            <Card key={anomaly.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  {getTypeIcon(anomaly.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{anomaly.metric}</span>
                      <Badge variant="outline">{anomaly.platform}</Badge>
                      <Badge variant={getSeverityColor(anomaly.severity) as any}>
                        {anomaly.severity === "high" ? "גבוה" : 
                         anomaly.severity === "medium" ? "בינוני" : "נמוך"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{anomaly.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        ערך נוכחי: <strong>{anomaly.value}</strong>
                      </span>
                      <span>
                        ערך צפוי: <strong>{anomaly.expectedValue}</strong>
                      </span>
                      <span className={anomaly.percentChange > 0 ? "text-red-500" : "text-green-500"}>
                        {anomaly.percentChange > 0 ? "+" : ""}{anomaly.percentChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    טפל
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
