import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient } from "@/hooks/useClient";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProgrammaticDashboard } from "@/components/programmatic/ProgrammaticDashboard";
import { BidManagement } from "@/components/programmatic/BidManagement";
import { BudgetAllocator } from "@/components/programmatic/BudgetAllocator";
import { AudienceSegments } from "@/components/programmatic/AudienceSegments";
import { PlacementOptimizer } from "@/components/programmatic/PlacementOptimizer";
import { AutoOptimizationRules } from "@/components/programmatic/AutoOptimizationRules";

export default function Programmatic() {
  const { selectedClient } = useClient();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">קמפיינים פרוגרמטיים</h1>
          <p className="text-muted-foreground">ניהול וויסות אוטומטי של קמפיינים</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">סקירה</TabsTrigger>
            <TabsTrigger value="bids">הצעות מחיר</TabsTrigger>
            <TabsTrigger value="budget">תקציב</TabsTrigger>
            <TabsTrigger value="audiences">קהלים</TabsTrigger>
            <TabsTrigger value="placements">מיקומים</TabsTrigger>
            <TabsTrigger value="rules">כללי אופטימיזציה</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ProgrammaticDashboard clientId={selectedClient?.id} />
          </TabsContent>

          <TabsContent value="bids">
            <BidManagement clientId={selectedClient?.id} />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetAllocator clientId={selectedClient?.id} />
          </TabsContent>

          <TabsContent value="audiences">
            <AudienceSegments clientId={selectedClient?.id} />
          </TabsContent>

          <TabsContent value="placements">
            <PlacementOptimizer clientId={selectedClient?.id} />
          </TabsContent>

          <TabsContent value="rules">
            <AutoOptimizationRules clientId={selectedClient?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
