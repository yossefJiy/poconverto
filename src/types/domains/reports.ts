// Report types for useReports hook

export interface ReportPlatformMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spent: number;
  ctr: number;
  cpc: number;
}

export interface ReportCampaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spent: number;
  budget: number;
}

export interface ReportGoal {
  name: string;
  target: number;
  current: number;
  progress: number;
  unit: string;
  period: string;
}

export interface ReportData {
  generated_at: string;
  report_type: string;
  client: {
    name: string;
    industry: string;
    website: string;
  };
  period: {
    from: string;
    to: string;
  };
  summary: {
    total_campaigns: number;
    active_campaigns: number;
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
    total_spent: number;
    total_budget: number;
    budget_utilization: number;
  };
  performance: {
    ctr: number;
    conversion_rate: number;
    cost_per_click: number;
    cost_per_conversion: number;
    roi: number;
  };
  platforms: Record<string, ReportPlatformMetrics>;
  tasks: {
    completed: number;
    in_progress: number;
    pending: number;
    total: number;
    completion_rate: number;
  };
  goals: ReportGoal[];
  campaigns: ReportCampaign[];
}
