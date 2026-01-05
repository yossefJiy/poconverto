// Domain Permissions Hook
// Extends useAuth with domain-specific permission checking

import { useAuth } from '@/hooks/useAuth';
import { useClient } from '@/hooks/useClient';
import { useMemo } from 'react';

export type Domain = 
  | 'analytics' 
  | 'campaigns' 
  | 'tasks' 
  | 'ai' 
  | 'ecommerce' 
  | 'clients' 
  | 'settings'
  | 'marketing'
  | 'reports';

export type Permission = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export interface DomainPermissions {
  analytics: { view: boolean; export: boolean };
  campaigns: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  tasks: { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean };
  ai: { view: boolean; create: boolean; approve: boolean };
  ecommerce: { view: boolean; edit: boolean };
  clients: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  settings: { view: boolean; edit: boolean };
  marketing: { view: boolean; create: boolean; edit: boolean };
  reports: { view: boolean; create: boolean; export: boolean };
}

// Role-based default permissions
const ROLE_PERMISSIONS: Record<string, Partial<DomainPermissions>> = {
  super_admin: {
    analytics: { view: true, export: true },
    campaigns: { view: true, create: true, edit: true, delete: true },
    tasks: { view: true, create: true, edit: true, delete: true, approve: true },
    ai: { view: true, create: true, approve: true },
    ecommerce: { view: true, edit: true },
    clients: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, edit: true },
    marketing: { view: true, create: true, edit: true },
    reports: { view: true, create: true, export: true },
  },
  admin: {
    analytics: { view: true, export: true },
    campaigns: { view: true, create: true, edit: true, delete: true },
    tasks: { view: true, create: true, edit: true, delete: true, approve: true },
    ai: { view: true, create: true, approve: true },
    ecommerce: { view: true, edit: true },
    clients: { view: true, create: true, edit: true, delete: false },
    settings: { view: true, edit: true },
    marketing: { view: true, create: true, edit: true },
    reports: { view: true, create: true, export: true },
  },
  agency_manager: {
    analytics: { view: true, export: true },
    campaigns: { view: true, create: true, edit: true, delete: false },
    tasks: { view: true, create: true, edit: true, delete: false, approve: true },
    ai: { view: true, create: true, approve: false },
    ecommerce: { view: true, edit: false },
    clients: { view: true, create: true, edit: true, delete: false },
    settings: { view: true, edit: false },
    marketing: { view: true, create: true, edit: true },
    reports: { view: true, create: true, export: true },
  },
  team_manager: {
    analytics: { view: true, export: true },
    campaigns: { view: true, create: true, edit: true, delete: false },
    tasks: { view: true, create: true, edit: true, delete: false, approve: true },
    ai: { view: true, create: true, approve: false },
    ecommerce: { view: true, edit: false },
    clients: { view: true, create: false, edit: true, delete: false },
    settings: { view: true, edit: false },
    marketing: { view: true, create: true, edit: true },
    reports: { view: true, create: true, export: true },
  },
  employee: {
    analytics: { view: true, export: false },
    campaigns: { view: true, create: true, edit: true, delete: false },
    tasks: { view: true, create: true, edit: true, delete: false, approve: false },
    ai: { view: true, create: true, approve: false },
    ecommerce: { view: true, edit: false },
    clients: { view: true, create: false, edit: false, delete: false },
    settings: { view: false, edit: false },
    marketing: { view: true, create: true, edit: false },
    reports: { view: true, create: false, export: false },
  },
  premium_client: {
    analytics: { view: true, export: true },
    campaigns: { view: true, create: false, edit: false, delete: false },
    tasks: { view: true, create: true, edit: false, delete: false, approve: false },
    ai: { view: true, create: true, approve: false },
    ecommerce: { view: true, edit: false },
    clients: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, edit: false },
    marketing: { view: true, create: false, edit: false },
    reports: { view: true, create: false, export: true },
  },
  basic_client: {
    analytics: { view: true, export: false },
    campaigns: { view: true, create: false, edit: false, delete: false },
    tasks: { view: true, create: true, edit: false, delete: false, approve: false },
    ai: { view: false, create: false, approve: false },
    ecommerce: { view: true, edit: false },
    clients: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, edit: false },
    marketing: { view: false, create: false, edit: false },
    reports: { view: true, create: false, export: false },
  },
  demo: {
    analytics: { view: true, export: false },
    campaigns: { view: true, create: false, edit: false, delete: false },
    tasks: { view: true, create: false, edit: false, delete: false, approve: false },
    ai: { view: true, create: false, approve: false },
    ecommerce: { view: true, edit: false },
    clients: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, edit: false },
    marketing: { view: true, create: false, edit: false },
    reports: { view: true, create: false, export: false },
  },
};

const ADMIN_ROLES = ['super_admin', 'admin'];

export function useDomainPermissions() {
  const { role } = useAuth();
  const { selectedClient } = useClient();

  const isAdmin = role ? ADMIN_ROLES.includes(role) : false;

  const permissions = useMemo<DomainPermissions>(() => {
    const userRole = role || 'demo';
    const basePermissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.demo;

    // Admin override
    if (isAdmin) {
      return ROLE_PERMISSIONS.admin as DomainPermissions;
    }

    return basePermissions as DomainPermissions;
  }, [role, isAdmin]);

  const hasPermission = (domain: Domain, permission: Permission): boolean => {
    const domainPerms = permissions[domain];
    if (!domainPerms) return false;
    return (domainPerms as Record<string, boolean>)[permission] ?? false;
  };

  const canAccess = (domain: Domain): boolean => {
    return hasPermission(domain, 'view');
  };

  return {
    permissions,
    hasPermission,
    canAccess,
    userRole: role,
    isAdmin,
    selectedClient,
  };
}

export default useDomainPermissions;
