// Route Configuration
// Centralized route definitions with domain grouping

import { lazy } from 'react';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Campaigns = lazy(() => import('@/pages/Campaigns'));
const Tasks = lazy(() => import('@/pages/Tasks'));
const AIAgents = lazy(() => import('@/pages/AIAgents'));
const Ecommerce = lazy(() => import('@/pages/Ecommerce'));
const ClientProfile = lazy(() => import('@/pages/ClientProfile'));
const Settings = lazy(() => import('@/pages/Settings'));
const Reports = lazy(() => import('@/pages/Reports'));

export interface RouteConfig {
  path: string;
  element: React.LazyExoticComponent<React.ComponentType<unknown>>;
  domain: string;
  requiresAuth: boolean;
  requiredPermission?: {
    domain: string;
    action: string;
  };
  children?: RouteConfig[];
}

export const routeConfig: RouteConfig[] = [
  // Dashboard
  {
    path: '/dashboard',
    element: Dashboard,
    domain: 'core',
    requiresAuth: true,
  },
  
  // Analytics Domain
  {
    path: '/analytics',
    element: Analytics,
    domain: 'analytics',
    requiresAuth: true,
    requiredPermission: { domain: 'analytics', action: 'view' },
  },
  
  // Campaigns Domain
  {
    path: '/campaigns',
    element: Campaigns,
    domain: 'campaigns',
    requiresAuth: true,
    requiredPermission: { domain: 'campaigns', action: 'view' },
  },
  
  // Tasks Domain
  {
    path: '/tasks',
    element: Tasks,
    domain: 'tasks',
    requiresAuth: true,
    requiredPermission: { domain: 'tasks', action: 'view' },
  },
  
  // AI Domain
  {
    path: '/ai-agents',
    element: AIAgents,
    domain: 'ai',
    requiresAuth: true,
    requiredPermission: { domain: 'ai', action: 'view' },
  },
  
  // E-commerce Domain
  {
    path: '/ecommerce',
    element: Ecommerce,
    domain: 'ecommerce',
    requiresAuth: true,
    requiredPermission: { domain: 'ecommerce', action: 'view' },
  },
  
  // Clients Domain
  {
    path: '/clients',
    element: ClientProfile,
    domain: 'clients',
    requiresAuth: true,
    requiredPermission: { domain: 'clients', action: 'view' },
  },
  
  // Reports Domain
  {
    path: '/reports',
    element: Reports,
    domain: 'reports',
    requiresAuth: true,
    requiredPermission: { domain: 'reports', action: 'view' },
  },
  
  // Settings Domain
  {
    path: '/settings',
    element: Settings,
    domain: 'settings',
    requiresAuth: true,
    requiredPermission: { domain: 'settings', action: 'view' },
  },
];

// Helper to get routes by domain
export function getRoutesByDomain(domain: string): RouteConfig[] {
  return routeConfig.filter(route => route.domain === domain);
}

// Helper to check if user can access route
export function canAccessRoute(
  route: RouteConfig, 
  hasPermission: (domain: string, action: string) => boolean
): boolean {
  if (!route.requiredPermission) return true;
  return hasPermission(route.requiredPermission.domain, route.requiredPermission.action);
}

export default routeConfig;
