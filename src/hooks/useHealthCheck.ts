import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ServiceHealth {
  name: string;
  displayName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  version?: string;
  message?: string;
  lastCheck: string;
}

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: ServiceHealth[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

interface UseHealthCheckResult {
  data: HealthCheckResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useHealthCheck(autoRefreshInterval = 30000): UseHealthCheckResult {
  const [data, setData] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: responseData, error: fetchError } = await supabase.functions.invoke('health-check', {
        method: 'POST',
        body: {},
      });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (responseData?.data) {
        setData(responseData.data);
      } else if (responseData?.status) {
        setData(responseData);
      } else {
        throw new Error('Invalid response format');
      }

      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch health status';
      setError(message);
      console.error('Health check error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthStatus();

    if (autoRefreshInterval > 0) {
      const interval = setInterval(fetchHealthStatus, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchHealthStatus, autoRefreshInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchHealthStatus,
    lastUpdated,
  };
}
