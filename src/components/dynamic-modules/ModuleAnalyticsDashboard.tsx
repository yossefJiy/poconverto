import { useState } from 'react';
import { BarChart3, Clock, DollarSign, Star, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDynamicModuleAnalytics } from '@/hooks/useDynamicModuleAnalytics';
import { useDynamicModules } from '@/hooks/useDynamicModules';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ModuleAnalyticsDashboardProps {
  moduleId?: string;
  clientId?: string;
}

export function ModuleAnalyticsDashboard({ moduleId, clientId }: ModuleAnalyticsDashboardProps) {
  const [selectedModuleId, setSelectedModuleId] = useState(moduleId || 'all');
  const { data: modules } = useDynamicModules();
  
  const { 
    summary, 
    taskTypeBreakdown, 
    usageOverTime,
    isLoading 
  } = useDynamicModuleAnalytics(
    selectedModuleId === 'all' ? undefined : selectedModuleId,
    clientId
  );

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const formatCost = (cost: number) => {
    return '$' + cost.toFixed(4);
  };

  const formatTime = (ms: number) => {
    if (ms >= 1000) return (ms / 1000).toFixed(1) + 's';
    return ms.toFixed(0) + 'ms';
  };

  return (
    <div className="space-y-6">
      {/* Module Filter */}
      <div className="flex items-center gap-4">
        <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="בחר מודול" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל המודולים</SelectItem>
            {modules?.map((module) => (
              <SelectItem key={module.id} value={module.id}>
                {module.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs">בקשות</span>
            </div>
            <div className="text-2xl font-bold">{formatNumber(summary?.totalRequests || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">טוקנים</span>
            </div>
            <div className="text-2xl font-bold">{formatNumber(summary?.totalTokens || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs">עלות</span>
            </div>
            <div className="text-2xl font-bold">{formatCost(summary?.totalCost || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">זמן ממוצע</span>
            </div>
            <div className="text-2xl font-bold">{formatTime(summary?.avgResponseTime || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Star className="w-4 h-4" />
              <span className="text-xs">דירוג</span>
            </div>
            <div className="text-2xl font-bold">
              {(summary?.avgRating || 0).toFixed(1)}
              <span className="text-sm text-muted-foreground">/5</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">הצלחה</span>
            </div>
            <div className="text-2xl font-bold">{(summary?.successRate || 100).toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">שימוש לאורך זמן</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={usageOverTime || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('he-IL')}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = { requests: 'בקשות', tokens: 'טוקנים', cost: 'עלות' };
                      return [name === 'cost' ? formatCost(value) : formatNumber(value), labels[name] || name];
                    }}
                  />
                  <Line type="monotone" dataKey="requests" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Task Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">פילוח לפי סוג משימה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {taskTypeBreakdown?.slice(0, 6).map((type) => (
                <div key={type.taskType} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {type.category}
                      </Badge>
                      <span>{type.taskType}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{type.count} בקשות</span>
                      {type.avgRating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {type.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={(type.count / (summary?.totalRequests || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
              {(!taskTypeBreakdown || taskTypeBreakdown.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  אין נתונים עדיין
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
