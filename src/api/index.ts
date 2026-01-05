// API barrel export - updated with new APIs

import { analyticsAPI } from './analytics.api';
import { campaignsAPI } from './campaigns.api';
import { clientsAPI } from './clients.api';
import { tasksAPI } from './tasks.api';
import { aiAPI } from './ai.api';
import { kpiAPI } from './kpi.api';
import { competitorAPI } from './competitor.api';
import { socialAPI } from './social.api';

export const api = {
  analytics: analyticsAPI,
  campaigns: campaignsAPI,
  clients: clientsAPI,
  tasks: tasksAPI,
  ai: aiAPI,
  kpi: kpiAPI,
  competitors: competitorAPI,
  social: socialAPI,
};

export { analyticsAPI } from './analytics.api';
export { campaignsAPI } from './campaigns.api';
export { clientsAPI } from './clients.api';
export { tasksAPI } from './tasks.api';
export { aiAPI } from './ai.api';
export { kpiAPI } from './kpi.api';
export { competitorAPI } from './competitor.api';
export { socialAPI } from './social.api';
export { BaseAPI } from './base';
