// KPI Progress Card Component

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { KPIStatusBadge } from './KPIStatusBadge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BrandKPI } from '@/api/kpi.api';

interface KPIProgressCardProps {
  kpi: BrandKPI;
  onClick?: () => void;
}

export function KPIProgressCard({ kpi, onClick }: KPIProgressCardProps) {
  const progress = kpi.target_value > 0 
    ? Math.min((kpi.current_value / kpi.target_value) * 100, 150) 
    : 0;
  
  const percentDisplay = Math.round(progress);
  
  // Calculate change from previous value
  const change = kpi.previous_value !== null 
    ? kpi.current_value - kpi.previous_value 
    : null;
  
  const changePercent = kpi.previous_value && kpi.previous_value !== 0
    ? ((kpi.current_value - kpi.previous_value) / kpi.previous_value) * 100
    : null;

  const formatValue = (value: number) => {
    if (kpi.metric_type === 'currency') {
      return new Intl.NumberFormat('he-IL', { 
        style: 'currency', 
        currency: 'ILS',
        maximumFractionDigits: 0 
      }).format(value);
    }
    if (kpi.metric_type === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString('he-IL');
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      revenue: 'הכנסות',
      traffic: 'תנועה',
      engagement: 'אינטראקציה',
      conversion: 'המרות',
      brand: 'מותג',
      custom: 'מותאם אישית',
    };
    return labels[category] || category;
  };

  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        onClick && 'cursor-pointer hover:border-primary/50'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium truncate">
              {kpi.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {getCategoryLabel(kpi.category)}
            </p>
          </div>
          <KPIStatusBadge status={kpi.status} size="sm" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">
              {formatValue(kpi.current_value)}
              {kpi.unit && kpi.metric_type !== 'currency' && kpi.metric_type !== 'percentage' && (
                <span className="text-sm font-normal text-muted-foreground mr-1">
                  {kpi.unit}
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              מתוך {formatValue(kpi.target_value)}
            </p>
          </div>
          {change !== null && (
            <div className={cn(
              'flex items-center gap-1 text-sm',
              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'
            )}>
              {change > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : change < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              <span>
                {changePercent !== null ? `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%` : '—'}
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <Progress 
            value={Math.min(progress, 100)} 
            className={cn(
              'h-2',
              kpi.status === 'exceeded' && '[&>div]:bg-green-500',
              kpi.status === 'on_track' && '[&>div]:bg-blue-500',
              kpi.status === 'at_risk' && '[&>div]:bg-yellow-500',
              kpi.status === 'behind' && '[&>div]:bg-red-500',
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{percentDisplay}%</span>
            <span>{kpi.period === 'monthly' ? 'חודשי' : kpi.period === 'weekly' ? 'שבועי' : kpi.period}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
