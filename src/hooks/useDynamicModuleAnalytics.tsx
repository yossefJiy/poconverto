import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ModuleAnalyticsSummary {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgResponseTime: number;
  avgRating: number;
  successRate: number;
}

export interface ModelPerformance {
  model: string;
  taskType: string;
  requestCount: number;
  avgResponseTime: number;
  avgRating: number;
  successRate: number;
  avgCost: number;
  totalTokens: number;
}

export interface TaskTypeBreakdown {
  taskType: string;
  category: string;
  count: number;
  avgRating: number;
  avgResponseTime: number;
}

export function useDynamicModuleAnalytics(moduleId?: string, clientId?: string, dateRange?: { from: Date; to: Date }) {
  const { user, role } = useAuth();
  const isAdmin = role === 'super_admin' || role === 'admin';

  // Summary stats
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['module-analytics-summary', moduleId, clientId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('module_usage_analytics')
        .select('*');

      if (moduleId) query = query.eq('module_id', moduleId);
      if (clientId) query = query.eq('client_id', clientId);
      if (!isAdmin) query = query.eq('user_id', user?.id);
      if (dateRange?.from) query = query.gte('created_at', dateRange.from.toISOString());
      if (dateRange?.to) query = query.lte('created_at', dateRange.to.toISOString());

      const { data, error } = await query;
      if (error) throw error;

      const records = data || [];
      const successful = records.filter(r => r.was_successful);
      const rated = records.filter(r => r.user_rating !== null);

      return {
        totalRequests: records.length,
        totalTokens: records.reduce((sum, r) => sum + (r.total_tokens || 0), 0),
        totalCost: records.reduce((sum, r) => sum + (Number(r.estimated_cost) || 0), 0),
        avgResponseTime: records.length > 0 
          ? records.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / records.length 
          : 0,
        avgRating: rated.length > 0 
          ? rated.reduce((sum, r) => sum + (r.user_rating || 0), 0) / rated.length 
          : 0,
        successRate: records.length > 0 ? (successful.length / records.length) * 100 : 100
      } as ModuleAnalyticsSummary;
    },
    enabled: !!user
  });

  // Model performance comparison
  const { data: modelPerformance, isLoading: modelPerformanceLoading } = useQuery({
    queryKey: ['module-analytics-models', moduleId, clientId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('module_usage_analytics')
        .select('*');

      if (moduleId) query = query.eq('module_id', moduleId);
      if (clientId) query = query.eq('client_id', clientId);
      if (!isAdmin) query = query.eq('user_id', user?.id);
      if (dateRange?.from) query = query.gte('created_at', dateRange.from.toISOString());
      if (dateRange?.to) query = query.lte('created_at', dateRange.to.toISOString());

      const { data, error } = await query;
      if (error) throw error;

      // Group by model + task type
      const grouped: Record<string, typeof data> = {};
      for (const record of data || []) {
        const key = `${record.ai_model}|${record.final_task_type || 'general'}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(record);
      }

      const performance: ModelPerformance[] = [];
      for (const [key, records] of Object.entries(grouped)) {
        const [model, taskType] = key.split('|');
        const successful = records.filter(r => r.was_successful);
        const rated = records.filter(r => r.user_rating !== null);

        performance.push({
          model,
          taskType,
          requestCount: records.length,
          avgResponseTime: records.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / records.length,
          avgRating: rated.length > 0 
            ? rated.reduce((sum, r) => sum + (r.user_rating || 0), 0) / rated.length 
            : 0,
          successRate: (successful.length / records.length) * 100,
          avgCost: records.reduce((sum, r) => sum + (Number(r.estimated_cost) || 0), 0) / records.length,
          totalTokens: records.reduce((sum, r) => sum + (r.total_tokens || 0), 0)
        });
      }

      return performance.sort((a, b) => b.requestCount - a.requestCount);
    },
    enabled: !!user
  });

  // Task type breakdown
  const { data: taskTypeBreakdown, isLoading: taskTypeLoading } = useQuery({
    queryKey: ['module-analytics-task-types', moduleId, clientId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('module_usage_analytics')
        .select('*');

      if (moduleId) query = query.eq('module_id', moduleId);
      if (clientId) query = query.eq('client_id', clientId);
      if (!isAdmin) query = query.eq('user_id', user?.id);
      if (dateRange?.from) query = query.gte('created_at', dateRange.from.toISOString());
      if (dateRange?.to) query = query.lte('created_at', dateRange.to.toISOString());

      const { data, error } = await query;
      if (error) throw error;

      // Group by task type
      const grouped: Record<string, typeof data> = {};
      for (const record of data || []) {
        const key = record.final_task_type || 'general';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(record);
      }

      const breakdown: TaskTypeBreakdown[] = [];
      for (const [taskType, records] of Object.entries(grouped)) {
        const rated = records.filter(r => r.user_rating !== null);
        breakdown.push({
          taskType,
          category: records[0]?.task_category || 'unknown',
          count: records.length,
          avgRating: rated.length > 0 
            ? rated.reduce((sum, r) => sum + (r.user_rating || 0), 0) / rated.length 
            : 0,
          avgResponseTime: records.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / records.length
        });
      }

      return breakdown.sort((a, b) => b.count - a.count);
    },
    enabled: !!user
  });

  // Usage over time
  const { data: usageOverTime } = useQuery({
    queryKey: ['module-analytics-timeline', moduleId, clientId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('module_usage_analytics')
        .select('created_at, total_tokens, estimated_cost');

      if (moduleId) query = query.eq('module_id', moduleId);
      if (clientId) query = query.eq('client_id', clientId);
      if (!isAdmin) query = query.eq('user_id', user?.id);
      if (dateRange?.from) query = query.gte('created_at', dateRange.from.toISOString());
      if (dateRange?.to) query = query.lte('created_at', dateRange.to.toISOString());

      const { data, error } = await query.order('created_at');
      if (error) throw error;

      // Group by day
      const byDay: Record<string, { requests: number; tokens: number; cost: number }> = {};
      for (const record of data || []) {
        const day = record.created_at.split('T')[0];
        if (!byDay[day]) byDay[day] = { requests: 0, tokens: 0, cost: 0 };
        byDay[day].requests++;
        byDay[day].tokens += record.total_tokens || 0;
        byDay[day].cost += Number(record.estimated_cost) || 0;
      }

      return Object.entries(byDay).map(([date, stats]) => ({
        date,
        ...stats
      }));
    },
    enabled: !!user
  });

  // Best model recommendation
  const getBestModelForTaskType = (taskType: string): string | null => {
    if (!modelPerformance) return null;
    
    const relevantModels = modelPerformance.filter(m => m.taskType === taskType);
    if (relevantModels.length === 0) return null;

    // Score: rating (40%) + success rate (30%) + speed (20%) + cost efficiency (10%)
    const scored = relevantModels.map(m => ({
      model: m.model,
      score: 
        (m.avgRating / 5) * 40 +
        (m.successRate / 100) * 30 +
        (1 - Math.min(m.avgResponseTime / 10000, 1)) * 20 +
        (1 - Math.min(m.avgCost * 100, 1)) * 10
    }));

    const best = scored.sort((a, b) => b.score - a.score)[0];
    return best?.model || null;
  };

  return {
    summary,
    summaryLoading,
    modelPerformance,
    modelPerformanceLoading,
    taskTypeBreakdown,
    taskTypeLoading,
    usageOverTime,
    getBestModelForTaskType,
    isLoading: summaryLoading || modelPerformanceLoading || taskTypeLoading
  };
}
