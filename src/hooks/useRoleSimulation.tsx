import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth, type AppRole, ROLE_LABELS } from './useAuth';

interface RoleSimulationContextType {
  simulatedRole: AppRole | null;
  effectiveRole: AppRole | null;
  isSimulating: boolean;
  canSimulate: boolean;
  availableRoles: AppRole[];
  startSimulation: (role: AppRole) => void;
  stopSimulation: () => void;
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
  const { role: actualRole } = useAuth();
  const [simulatedRole, setSimulatedRole] = useState<AppRole | null>(null);

  // Only super_admin and admin can simulate roles
  const canSimulate = actualRole === 'super_admin' || actualRole === 'admin';

  // Get available roles for simulation (only roles at or below current level)
  const availableRoles = ROLE_HIERARCHY.filter(r => {
    if (!actualRole) return false;
    const actualIndex = ROLE_HIERARCHY.indexOf(actualRole);
    const roleIndex = ROLE_HIERARCHY.indexOf(r);
    return roleIndex >= actualIndex; // Can only simulate same level or lower
  });

  const startSimulation = useCallback((role: AppRole) => {
    if (!canSimulate) return;
    
    // Verify the role is available for simulation
    if (!availableRoles.includes(role)) return;
    
    setSimulatedRole(role);
  }, [canSimulate, availableRoles]);

  const stopSimulation = useCallback(() => {
    setSimulatedRole(null);
  }, []);

  const effectiveRole = simulatedRole || actualRole;

  return (
    <RoleSimulationContext.Provider value={{
      simulatedRole,
      effectiveRole,
      isSimulating: !!simulatedRole,
      canSimulate,
      availableRoles,
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
