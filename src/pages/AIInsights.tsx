import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIContentReviewer } from "@/components/ai/AIContentReviewer";
import { AIBudgetAdvisor } from "@/components/ai/AIBudgetAdvisor";
import { AIAnomalyDetection } from "@/components/ai/AIAnomalyDetection";
import { AITrendDetector } from "@/components/ai/AITrendDetector";
import { Sparkles, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";

export default function AIInsights() {
  const [activeTab, setActiveTab] = useState("content");

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">תובנות AI</h1>
          <p className="text-muted-foreground">
            כלים מתקדמים מבוססי בינה מלאכותית לניתוח וייעול
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              סקירת תוכן
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              יועץ תקציב
            </TabsTrigger>
            <TabsTrigger value="anomaly" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              זיהוי חריגות
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              זיהוי מגמות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <AIContentReviewer />
          </TabsContent>

          <TabsContent value="budget">
            <AIBudgetAdvisor />
          </TabsContent>

          <TabsContent value="anomaly">
            <AIAnomalyDetection />
          </TabsContent>

          <TabsContent value="trends">
            <AITrendDetector />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
