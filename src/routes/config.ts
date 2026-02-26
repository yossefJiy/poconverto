// Route Configuration - MVP: Clients + Analytics only

import { lazy } from 'react';

const AnalyticsOverview = lazy(() => import('@/pages/AnalyticsOverview'));
const CampaignPerformance = lazy(() => import('@/pages/CampaignPerformance'));
const OfflineRevenue = lazy(() => import('@/pages/OfflineRevenue'));
const ClientProfile = lazy(() => import('@/pages/ClientProfile'));
const ClientManagement = lazy(() => import('@/pages/ClientManagement'));
const Settings = lazy(() => import('@/pages/Settings'));
const Permissions = lazy(() => import('@/pages/Permissions'));

export interface RouteConfig {
  path: string;
  element: React.LazyExoticComponent<React.ComponentType<unknown>>;
  domain: string;
  requiresAuth: boolean;
}

export const routeConfig: RouteConfig[] = [
  { path: '/dashboard', element: AnalyticsOverview, domain: 'analytics', requiresAuth: true },
  { path: '/analytics', element: AnalyticsOverview, domain: 'analytics', requiresAuth: true },
  { path: '/analytics/campaigns', element: CampaignPerformance, domain: 'analytics', requiresAuth: true },
  { path: '/analytics/offline-revenue', element: OfflineRevenue, domain: 'analytics', requiresAuth: true },
  { path: '/clients', element: ClientProfile, domain: 'clients', requiresAuth: true },
  { path: '/client-management', element: ClientManagement, domain: 'clients', requiresAuth: true },
  { path: '/settings', element: Settings, domain: 'settings', requiresAuth: true },
  { path: '/permissions', element: Permissions, domain: 'admin', requiresAuth: true },
];

export default routeConfig;
