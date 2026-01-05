// KPI Dashboard Page

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DomainErrorBoundary } from '@/components/shared/DomainErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Target, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { useClient } from '@/hooks/useClient';
import { kpiAPI, type BrandKPI } from '@/api/kpi.api';
import { KPIProgressCard, KPISummaryWidget, CreateKPIDialog } from '@/components/kpi';

const categories = [
  { value: 'all', label: 'הכל' },
  { value: 'revenue', label: 'הכנסות' },
  { value: 'traffic', label: 'תנועה' },
  { value: 'engagement', label: 'אינטראקציה' },
  { value: 'conversion', label: 'המרות' },
  { value: 'brand', label: 'מותג' },
  { value: 'custom', label: 'מותאם אישית' },
];

export default function KPIDashboard() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: kpisResult, isLoading, refetch } = useQuery({
    queryKey: ['kpis', selectedClient?.id],
    queryFn: () => kpiAPI.list(selectedClient!.id),
    enabled: !!selectedClient?.id,
  });

  const kpis = kpisResult?.data || [];
  
  const filteredKpis = selectedCategory === 'all' 
    ? kpis 
    : kpis.filter(k => k.category === selectedCategory);

  const statusStats = {
    total: kpis.length,
    exceeded: kpis.filter(k => k.status === 'exceeded').length,
    on_track: kpis.filter(k => k.status === 'on_track').length,
    at_risk: kpis.filter(k => k.status === 'at_risk').length,
    behind: kpis.filter(k => k.status === 'behind').length,
  };

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['kpis'] });
  };

  if (!selectedClient) {
    return (
      <MainLayout>
        <PageHeader title="יעדים ו-KPIs" />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">נא לבחור לקוח לצפייה ביעדים</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DomainErrorBoundary domain="kpis">
      <PageHeader 
        title="יעדים ו-KPIs" 
        description={`ניהול ומעקב יעדים עבור ${selectedClient.name}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 ml-2" />
              רענון
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 ml-2" />
              יעד חדש
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{statusStats.total}</p>
            <p className="text-sm text-muted-foreground">סה"כ יעדים</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{statusStats.exceeded}</p>
            <p className="text-sm text-muted-foreground">עולים על היעד</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{statusStats.on_track}</p>
            <p className="text-sm text-muted-foreground">בדרך ליעד</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{statusStats.at_risk}</p>
            <p className="text-sm text-muted-foreground">בסיכון</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold">{statusStats.behind}</p>
            <p className="text-sm text-muted-foreground">מאחור</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>יעדים פעילים</CardTitle>
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="h-9">
                    {categories.map(cat => (
                      <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-40" />
                  ))}
                </div>
              ) : filteredKpis.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">אין יעדים</h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedCategory === 'all' 
                      ? 'עדיין לא הוגדרו יעדים ללקוח זה'
                      : 'אין יעדים בקטגוריה זו'}
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    הגדר יעד ראשון
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredKpis.map(kpi => (
                    <KPIProgressCard key={kpi.id} kpi={kpi} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <KPISummaryWidget kpis={kpis} />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">פעולות מהירות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 ml-2" />
                הוסף יעד חדש
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4 ml-2" />
                סנכרן נתונים
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateKPIDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        clientId={selectedClient.id}
        onSuccess={handleRefresh}
      />
      </DomainErrorBoundary>
    </MainLayout>
  );
}
