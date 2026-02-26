// Route Configuration - MVP: Clients + Analytics only

import { lazy } from 'react';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const ClientProfile = lazy(() => import('@/pages/ClientProfile'));
const Settings = lazy(() => import('@/pages/Settings'));

export interface RouteConfig {
  path: string;
  element: React.LazyExoticComponent<React.ComponentType<unknown>>;
  domain: string;
  requiresAuth: boolean;
  requiredPermission?: {
    domain: string;
    action: string;
  };
}

export const routeConfig: RouteConfig[] = [
  {
    path: '/dashboard',
    element: Dashboard,
    domain: 'core',
    requiresAuth: true,
  },
  {
    path: '/analytics',
    element: Analytics,
    domain: 'analytics',
    requiresAuth: true,
    requiredPermission: { domain: 'analytics', action: 'view' },
  },
  {
    path: '/clients',
    element: ClientProfile,
    domain: 'clients',
    requiresAuth: true,
    requiredPermission: { domain: 'clients', action: 'view' },
  },
  {
    path: '/settings',
    element: Settings,
    domain: 'settings',
    requiresAuth: true,
    requiredPermission: { domain: 'settings', action: 'view' },
  },
];

export function getRoutesByDomain(domain: string): RouteConfig[] {
  return routeConfig.filter(route => route.domain === domain);
}

export function canAccessRoute(
  route: RouteConfig, 
  hasPermission: (domain: string, action: string) => boolean
): boolean {
  if (!route.requiredPermission) return true;
  return hasPermission(route.requiredPermission.domain, route.requiredPermission.action);
}

export default routeConfig;
