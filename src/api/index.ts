// API barrel export - updated with new APIs

import { analyticsAPI } from './analytics.api';
import { campaignsAPI } from './campaigns.api';
import { clientsAPI } from './clients.api';
import { tasksAPI } from './tasks.api';
import { aiAPI } from './ai.api';
import { kpiAPI } from './kpi.api';
import { competitorAPI } from './competitor.api';
import { socialAPI } from './social.api';
import { contentAPI } from './content.api';
import { reportsAPI } from './reports.api';

export const api = {
  analytics: analyticsAPI,
  campaigns: campaignsAPI,
  clients: clientsAPI,
  tasks: tasksAPI,
  ai: aiAPI,
  kpi: kpiAPI,
  competitors: competitorAPI,
  social: socialAPI,
  content: contentAPI,
  reports: reportsAPI,
};

export { analyticsAPI } from './analytics.api';
export { campaignsAPI } from './campaigns.api';
export { clientsAPI } from './clients.api';
export { reportsAPI } from './reports.api';
export type { ReportTemplate, ScheduledReport, ReportHistoryItem, CreateScheduledReportInput } from './reports.api';
export { tasksAPI } from './tasks.api';
export { aiAPI } from './ai.api';
export { kpiAPI } from './kpi.api';
export { competitorAPI } from './competitor.api';
export { socialAPI } from './social.api';
export { contentAPI } from './content.api';
export { BaseAPI } from './base';
