// Brand Health Score Component
// Displays overall brand health based on KPIs

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BrandKPI {
  id: string;
  name: string;
  current_value: number | null;
  target_value: number;
  category: string;
  status: string;
}

interface BrandHealthScoreProps {
  kpis: BrandKPI[];
  className?: string;
}

interface CategoryScore {
  category: string;
  score: number;
  count: number;
  label: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  revenue: 'הכנסות',
  traffic: 'תנועה',
  engagement: 'מעורבות',
  conversion: 'המרות',
  brand: 'מותג',
  other: 'אחר',
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  revenue: 0.3,
  conversion: 0.25,
  traffic: 0.2,
  engagement: 0.15,
  brand: 0.1,
  other: 0.1,
};

export function BrandHealthScore({ kpis, className }: BrandHealthScoreProps) {
  const { overallScore, categoryScores, trend } = useMemo(() => {
    if (!kpis.length) {
      return { overallScore: 0, categoryScores: [], trend: 'neutral' as const };
    }

    // Calculate score per category
    const categoryMap = new Map<string, { total: number; count: number }>();

    for (const kpi of kpis) {
      if (kpi.current_value === null || kpi.target_value === 0) continue;

      const progress = Math.min((kpi.current_value / kpi.target_value) * 100, 150);
      const category = kpi.category || 'other';

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, count: 0 });
      }

      const cat = categoryMap.get(category)!;
      cat.total += progress;
      cat.count += 1;
    }

    // Build category scores
    const scores: CategoryScore[] = [];
    let weightedTotal = 0;
    let totalWeight = 0;

    for (const [category, data] of categoryMap) {
      const avgScore = data.total / data.count;
      const weight = CATEGORY_WEIGHTS[category] || 0.1;

      scores.push({
        category,
        score: avgScore,
        count: data.count,
        label: CATEGORY_LABELS[category] || category,
      });

      weightedTotal += avgScore * weight;
      totalWeight += weight;
    }

    const overall = totalWeight > 0 ? weightedTotal / totalWeight : 0;

    // Determine trend based on status distribution
    const onTrack = kpis.filter(k => k.status === 'on_track' || k.status === 'exceeded').length;
    const behind = kpis.filter(k => k.status === 'behind' || k.status === 'at_risk').length;
    
    let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
    if (onTrack > behind * 1.5) trendDirection = 'up';
    else if (behind > onTrack * 1.5) trendDirection = 'down';

    return {
      overallScore: Math.round(overall),
      categoryScores: scores.sort((a, b) => b.score - a.score),
      trend: trendDirection,
    };
  }, [kpis]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          ציון בריאות המותג
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </span>
            <span className="text-muted-foreground">/100</span>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="h-5 w-5" />
            <span className="text-sm">
              {trend === 'up' ? 'עולה' : trend === 'down' ? 'יורד' : 'יציב'}
            </span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3">
          {categoryScores.slice(0, 4).map((cat) => (
            <div key={cat.category} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{cat.label}</span>
                <span className={getScoreColor(cat.score)}>
                  {Math.round(cat.score)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(cat.score)}`}
                  style={{ width: `${Math.min(cat.score, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="pt-2 border-t text-sm text-muted-foreground">
          מבוסס על {kpis.length} יעדים פעילים
        </div>
      </CardContent>
    </Card>
  );
}

export default BrandHealthScore;
