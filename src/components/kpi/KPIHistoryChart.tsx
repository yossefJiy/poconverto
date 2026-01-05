// KPI History Chart Component
// Shows KPI progress over time

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { TrendingUp } from 'lucide-react';

interface KPIHistoryItem {
  id: string;
  recorded_value: number;
  target_value: number;
  status: string;
  recorded_at: string;
}

interface KPIHistoryChartProps {
  history: KPIHistoryItem[];
  kpiName: string;
  targetValue: number;
  unit?: string;
  className?: string;
}

export function KPIHistoryChart({ 
  history, 
  kpiName, 
  targetValue, 
  unit = '', 
  className 
}: KPIHistoryChartProps) {
  const chartData = useMemo(() => {
    return [...history]
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map((item) => ({
        date: format(new Date(item.recorded_at), 'dd/MM', { locale: he }),
        value: item.recorded_value,
        target: item.target_value,
        fullDate: format(new Date(item.recorded_at), 'dd/MM/yyyy', { locale: he }),
      }));
  }, [history]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { fullDate: string } }[]; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium">{payload[0]?.payload?.fullDate}</p>
          <p className="text-primary">
            ערך: {payload[0]?.value?.toLocaleString()} {unit}
          </p>
          <p className="text-muted-foreground">
            יעד: {targetValue?.toLocaleString()} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!history.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            היסטוריית {kpiName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            אין נתונים היסטוריים עדיין
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          היסטוריית {kpiName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine 
                y={targetValue} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5"
                label={{ 
                  value: 'יעד', 
                  position: 'right',
                  fill: 'hsl(var(--primary))',
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary" />
            <span>ערך בפועל</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary border-dashed" style={{ borderTop: '2px dashed' }} />
            <span>יעד</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
