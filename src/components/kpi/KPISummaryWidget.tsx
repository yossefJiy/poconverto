// KPI Summary Widget - shows overall KPI health

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, AlertTriangle, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrandKPI } from '@/api/kpi.api';

interface KPISummaryWidgetProps {
  kpis: BrandKPI[];
  className?: string;
}

export function KPISummaryWidget({ kpis, className }: KPISummaryWidgetProps) {
  const activeKpis = kpis.filter(k => k.is_active);
  
  const statusCounts = {
    exceeded: activeKpis.filter(k => k.status === 'exceeded').length,
    on_track: activeKpis.filter(k => k.status === 'on_track').length,
    at_risk: activeKpis.filter(k => k.status === 'at_risk').length,
    behind: activeKpis.filter(k => k.status === 'behind').length,
  };

  const total = activeKpis.length;
  const healthyCount = statusCounts.exceeded + statusCounts.on_track;
  const healthPercent = total > 0 ? (healthyCount / total) * 100 : 0;

  const statusItems = [
    { 
      key: 'exceeded', 
      label: 'עולים על היעד', 
      count: statusCounts.exceeded, 
      color: 'bg-green-500',
      icon: TrendingUp 
    },
    { 
      key: 'on_track', 
      label: 'בדרך ליעד', 
      count: statusCounts.on_track, 
      color: 'bg-blue-500',
      icon: Target 
    },
    { 
      key: 'at_risk', 
      label: 'בסיכון', 
      count: statusCounts.at_risk, 
      color: 'bg-yellow-500',
      icon: AlertTriangle 
    },
    { 
      key: 'behind', 
      label: 'מאחור', 
      count: statusCounts.behind, 
      color: 'bg-red-500',
      icon: TrendingDown 
    },
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          סיכום יעדים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">
            {Math.round(healthPercent)}%
          </p>
          <p className="text-sm text-muted-foreground">
            {healthyCount} מתוך {total} יעדים בריאים
          </p>
        </div>

        <Progress 
          value={healthPercent} 
          className={cn(
            'h-3',
            healthPercent >= 80 && '[&>div]:bg-green-500',
            healthPercent >= 60 && healthPercent < 80 && '[&>div]:bg-blue-500',
            healthPercent >= 40 && healthPercent < 60 && '[&>div]:bg-yellow-500',
            healthPercent < 40 && '[&>div]:bg-red-500',
          )}
        />

        <div className="grid grid-cols-2 gap-2">
          {statusItems.map(item => (
            <div 
              key={item.key}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
            >
              <div className={cn('w-3 h-3 rounded-full', item.color)} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                <p className="text-lg font-semibold">{item.count}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default KPISummaryWidget;
