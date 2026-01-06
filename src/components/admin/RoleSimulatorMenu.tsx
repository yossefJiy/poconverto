import { useRoleSimulation, ROLE_LABELS } from '@/hooks/useRoleSimulation';
import { useAuth, type AppRole } from '@/hooks/useAuth';
import { Check, Eye } from 'lucide-react';
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const ROLE_ICONS: Record<AppRole, string> = {
  super_admin: '🔴',
  admin: '🟠',
  agency_manager: '🟡',
  team_manager: '🟢',
  employee: '🔵',
  premium_client: '🟣',
  basic_client: '⚪',
  demo: '⚫',
};

export function RoleSimulatorMenu() {
  const { role: actualRole } = useAuth();
  const { 
    canSimulate, 
    isSimulating, 
    simulatedRole, 
    availableRoles,
    startSimulation, 
    stopSimulation 
  } = useRoleSimulation();

  if (!canSimulate) return null;

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>צפה כתפקיד</span>
          {isSimulating && (
            <span className="text-xs text-blue-500 mr-auto">פעיל</span>
          )}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-48">
          {availableRoles.map((role) => {
            const isActualRole = role === actualRole;
            const isCurrentSimulated = role === simulatedRole;
            
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => {
                  if (isActualRole) {
                    stopSimulation();
                  } else {
                    startSimulation(role);
                  }
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span>{ROLE_ICONS[role]}</span>
                <span className="flex-1">{ROLE_LABELS[role]}</span>
                {isActualRole && !isSimulating && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {isCurrentSimulated && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
                {isActualRole && (
                  <span className="text-xs text-muted-foreground">(אמיתי)</span>
                )}
              </DropdownMenuItem>
            );
          })}
          
          {isSimulating && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={stopSimulation}
                className="text-blue-600 cursor-pointer"
              >
                <Eye className="w-4 h-4 ml-2" />
                חזרה לתפקיד האמיתי
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );
}
