import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModuleAnalyticsDashboard } from '@/components/dynamic-modules/ModuleAnalyticsDashboard';
import { ModelComparisonDashboard } from '@/components/dynamic-modules/ModelComparisonDashboard';
import { useClient } from '@/hooks/useClient';

export default function ModuleAnalytics() {
  const { selectedClient } = useClient();

  return (
    <MainLayout>
      <PageHeader
        title="אנליטיקס מודולים"
        description="סטטיסטיקות שימוש והשוואת ביצועי מודלים"
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="comparison">השוואת מודלים</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ModuleAnalyticsDashboard clientId={selectedClient?.id} />
        </TabsContent>

        <TabsContent value="comparison">
          <ModelComparisonDashboard clientId={selectedClient?.id} />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
