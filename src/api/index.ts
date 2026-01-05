// API barrel export

import { analyticsAPI } from './analytics.api';
import { campaignsAPI } from './campaigns.api';
import { clientsAPI } from './clients.api';
import { tasksAPI } from './tasks.api';
import { aiAPI } from './ai.api';

export const api = {
  analytics: analyticsAPI,
  campaigns: campaignsAPI,
  clients: clientsAPI,
  tasks: tasksAPI,
  ai: aiAPI,
};

export { analyticsAPI } from './analytics.api';
export { campaignsAPI } from './campaigns.api';
export { clientsAPI } from './clients.api';
export { tasksAPI } from './tasks.api';
export { aiAPI } from './ai.api';
export { BaseAPI } from './base';
