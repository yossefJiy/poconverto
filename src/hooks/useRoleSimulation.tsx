import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth, type AppRole, ROLE_LABELS } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SimulationOptions {
  clientId?: string;
  contactId?: string;
  reason?: string;
}

interface RoleSimulationContextType {
  simulatedRole: AppRole | null;
  effectiveRole: AppRole | null;
  isSimulating: boolean;
  canSimulate: boolean;
  availableRoles: AppRole[];
  simulatedClientId: string | null;
  simulatedContactId: string | null;
  startSimulation: (role: AppRole, options?: SimulationOptions) => Promise<void>;
  stopSimulation: (reason?: string) => Promise<void>;
}

const RoleSimulationContext = createContext<RoleSimulationContextType | undefined>(undefined);

// Role hierarchy from highest to lowest
const ROLE_HIERARCHY: AppRole[] = [
  'super_admin',
  'admin',
  'agency_manager',
  'team_manager',
  'employee',
  'premium_client',
  'basic_client',
  'demo'
];

export function RoleSimulationProvider({ children }: { children: ReactNode }) {
  const { role: actualRole, user } = useAuth();
  const [simulatedRole, setSimulatedRole] = useState<AppRole | null>(null);
  const [simulatedClientId, setSimulatedClientId] = useState<string | null>(null);
  const [simulatedContactId, setSimulatedContactId] = useState<string | null>(null);

  // Only super_admin and admin can simulate roles
  const canSimulate = actualRole === 'super_admin' || actualRole === 'admin';

  // Get available roles for simulation (only roles at or below current level)
  const availableRoles = ROLE_HIERARCHY.filter(r => {
    if (!actualRole) return false;
    const actualIndex = ROLE_HIERARCHY.indexOf(actualRole);
    const roleIndex = ROLE_HIERARCHY.indexOf(r);
    return roleIndex >= actualIndex; // Can only simulate same level or lower
  });

  const logSimulationAction = useCallback(async (
    action: 'start' | 'stop' | 'switch',
    role: AppRole,
    options?: SimulationOptions
  ) => {
    if (!user || !actualRole) return;
    
    try {
      await supabase.from('role_simulation_log').insert({
        user_id: user.id,
        actual_role: actualRole,
        simulated_role: role,
        simulated_client_id: options?.clientId || null,
        simulated_contact_id: options?.contactId || null,
        action,
        reason: options?.reason || null,
      });
    } catch (error) {
      console.error('Failed to log simulation action:', error);
    }
  }, [user, actualRole]);

  const startSimulation = useCallback(async (role: AppRole, options?: SimulationOptions) => {
    if (!canSimulate) return;
    
    // Verify the role is available for simulation
    if (!availableRoles.includes(role)) return;
    
    const action = simulatedRole ? 'switch' : 'start';
    
    setSimulatedRole(role);
    setSimulatedClientId(options?.clientId || null);
    setSimulatedContactId(options?.contactId || null);
    
    await logSimulationAction(action, role, options);
  }, [canSimulate, availableRoles, simulatedRole, logSimulationAction]);

  const stopSimulation = useCallback(async (reason?: string) => {
    if (!simulatedRole || !actualRole) return;
    
    await logSimulationAction('stop', simulatedRole, { reason });
    
    setSimulatedRole(null);
    setSimulatedClientId(null);
    setSimulatedContactId(null);
  }, [simulatedRole, actualRole, logSimulationAction]);

  const effectiveRole = simulatedRole || actualRole;

  return (
    <RoleSimulationContext.Provider value={{
      simulatedRole,
      effectiveRole,
      isSimulating: !!simulatedRole,
      canSimulate,
      availableRoles,
      simulatedClientId,
      simulatedContactId,
      startSimulation,
      stopSimulation,
    }}>
      {children}
    </RoleSimulationContext.Provider>
  );
}

export function useRoleSimulation() {
  const context = useContext(RoleSimulationContext);
  if (context === undefined) {
    throw new Error('useRoleSimulation must be used within a RoleSimulationProvider');
  }
  return context;
}

export { ROLE_LABELS };
