// Performance Monitoring System

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface PageLoadMetric extends PerformanceMetric {
  type: 'page_load';
  route: string;
}

interface APICallMetric extends PerformanceMetric {
  type: 'api_call';
  endpoint: string;
  status: number;
  method: string;
}

interface ErrorMetric extends PerformanceMetric {
  type: 'error';
  message: string;
  stack?: string;
}

interface UserActionMetric extends PerformanceMetric {
  type: 'user_action';
  action: string;
}

type Metric = PageLoadMetric | APICallMetric | ErrorMetric | UserActionMetric;

class MonitoringService {
  private metrics: Metric[] = [];
  private isDevelopment = import.meta.env.DEV;
  private maxMetrics = 100;

  trackPageLoad(route: string, duration: number) {
    const metric: PageLoadMetric = {
      type: 'page_load',
      name: 'page_load',
      route,
      value: duration,
      timestamp: Date.now(),
    };
    this.addMetric(metric);

    if (this.isDevelopment) {
      console.log(`[PERF] Page load: ${route} - ${duration}ms`);
    }
  }

  trackAPICall(endpoint: string, duration: number, status: number, method = 'GET') {
    const metric: APICallMetric = {
      type: 'api_call',
      name: 'api_call',
      endpoint,
      value: duration,
      status,
      method,
      timestamp: Date.now(),
    };
    this.addMetric(metric);

    if (this.isDevelopment && duration > 1000) {
      console.warn(`[PERF] Slow API call: ${method} ${endpoint} - ${duration}ms`);
    }
  }

  trackError(error: Error, context?: Record<string, unknown>) {
    const metric: ErrorMetric = {
      type: 'error',
      name: 'error',
      message: error.message,
      stack: error.stack,
      value: 1,
      timestamp: Date.now(),
      metadata: context,
    };
    this.addMetric(metric);

    if (this.isDevelopment) {
      console.error('[PERF] Error tracked:', error.message, context);
    }
  }

  trackUserAction(action: string, details?: Record<string, unknown>) {
    const metric: UserActionMetric = {
      type: 'user_action',
      name: 'user_action',
      action,
      value: 1,
      timestamp: Date.now(),
      metadata: details,
    };
    this.addMetric(metric);
  }

  private addMetric(metric: Metric) {
    this.metrics.push(metric);
    
    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  getMetricsByType<T extends Metric['type']>(type: T): Metric[] {
    return this.metrics.filter(m => m.type === type);
  }

  getAveragePageLoad(): number {
    const pageLoads = this.getMetricsByType('page_load');
    if (pageLoads.length === 0) return 0;
    const sum = pageLoads.reduce((acc, m) => acc + m.value, 0);
    return sum / pageLoads.length;
  }

  getAverageAPITime(): number {
    const apiCalls = this.getMetricsByType('api_call');
    if (apiCalls.length === 0) return 0;
    const sum = apiCalls.reduce((acc, m) => acc + m.value, 0);
    return sum / apiCalls.length;
  }

  getErrorCount(): number {
    return this.getMetricsByType('error').length;
  }

  clearMetrics() {
    this.metrics = [];
  }
}

export const monitoring = new MonitoringService();

// React hook for tracking page loads
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageLoadTracking() {
  const location = useLocation();

  useEffect(() => {
    const startTime = performance.now();
    
    // Track when the component is fully rendered
    const timeoutId = setTimeout(() => {
      const duration = performance.now() - startTime;
      monitoring.trackPageLoad(location.pathname, duration);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);
}
