import { useState } from 'react';
import { ArrowUpDown, Award, Clock, DollarSign, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDynamicModuleAnalytics, ModelPerformance } from '@/hooks/useDynamicModuleAnalytics';
import { useTaskTypeDefinitions } from '@/hooks/useDynamicModules';
import { cn } from '@/lib/utils';

type SortKey = 'requestCount' | 'avgResponseTime' | 'avgRating' | 'successRate' | 'avgCost';

interface ModelComparisonDashboardProps {
  moduleId?: string;
  clientId?: string;
}

export function ModelComparisonDashboard({ moduleId, clientId }: ModelComparisonDashboardProps) {
  const [selectedTaskType, setSelectedTaskType] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('requestCount');
  const [sortAsc, setSortAsc] = useState(false);

  const { data: taskTypes } = useTaskTypeDefinitions();
  const { modelPerformance, getBestModelForTaskType, isLoading } = useDynamicModuleAnalytics(moduleId, clientId);

  // Filter and sort
  const filteredData = (modelPerformance || [])
    .filter(m => selectedTaskType === 'all' || m.taskType === selectedTaskType)
    .sort((a, b) => {
      const multiplier = sortAsc ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * multiplier;
    });

  // Get unique task types from data
  const availableTaskTypes = [...new Set((modelPerformance || []).map(m => m.taskType))];

  // Best model for selected task type
  const bestModel = selectedTaskType !== 'all' ? getBestModelForTaskType(selectedTaskType) : null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(0);
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort(sortKeyName)}>
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={cn(
          'w-3 h-3',
          sortKey === sortKeyName ? 'text-primary' : 'text-muted-foreground'
        )} />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="בחר סוג משימה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל סוגי המשימות</SelectItem>
            {availableTaskTypes.map((type) => {
              const typeDef = taskTypes?.find(t => t.type_key === type);
              return (
                <SelectItem key={type} value={type}>
                  {typeDef?.type_label_he || type}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {bestModel && (
          <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
            <Award className="w-3 h-3" />
            מומלץ: {bestModel.split('/')[1]}
          </Badge>
        )}
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">השוואת ביצועי מודלים</CardTitle>
          <CardDescription>
            ביצועים לפי סוג משימה - לחץ על כותרת עמודה למיון
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>מודל</TableHead>
                <TableHead>סוג משימה</TableHead>
                <SortHeader label="בקשות" sortKeyName="requestCount" />
                <SortHeader label="זמן תגובה" sortKeyName="avgResponseTime" />
                <SortHeader label="דירוג" sortKeyName="avgRating" />
                <SortHeader label="הצלחה" sortKeyName="successRate" />
                <SortHeader label="עלות ממוצעת" sortKeyName="avgCost" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, index) => {
                const isBest = bestModel === row.model && selectedTaskType !== 'all';
                const typeDef = taskTypes?.find(t => t.type_key === row.taskType);
                
                return (
                  <TableRow key={`${row.model}-${row.taskType}`} className={cn(isBest && 'bg-green-500/5')}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isBest && <Award className="w-4 h-4 text-green-500" />}
                        {row.model.split('/')[1]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {typeDef?.type_label_he || row.taskType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-muted-foreground" />
                        {formatNumber(row.requestCount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        {row.avgResponseTime >= 1000 
                          ? (row.avgResponseTime / 1000).toFixed(1) + 's'
                          : row.avgResponseTime.toFixed(0) + 'ms'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.avgRating > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {row.avgRating.toFixed(1)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-xs',
                          row.successRate >= 95 ? 'bg-green-500/10 text-green-600' :
                          row.successRate >= 80 ? 'bg-yellow-500/10 text-yellow-600' :
                          'bg-red-500/10 text-red-600'
                        )}
                      >
                        {row.successRate.toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        {row.avgCost.toFixed(4)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    אין נתונים עדיין
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {availableTaskTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              המלצות מודל לפי סוג משימה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableTaskTypes.map((taskType) => {
                const recommended = getBestModelForTaskType(taskType);
                const typeDef = taskTypes?.find(t => t.type_key === taskType);
                
                if (!recommended) return null;
                
                return (
                  <div 
                    key={taskType}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-sm font-medium mb-1">
                      {typeDef?.type_label_he || taskType}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {typeDef?.category}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {recommended.split('/')[1]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
