import { useRoleSimulation, ROLE_LABELS } from '@/hooks/useRoleSimulation';
import { Button } from '@/components/ui/button';
import { Eye, LogOut, Building2, User } from 'lucide-react';
import { useAuth, type AppRole } from '@/hooks/useAuth';

export function RoleSimulationBanner() {
  const { 
    isSimulating, 
    simulatedRole, 
    simulatedClientName,
    simulatedContactName,
    stopSimulation 
  } = useRoleSimulation();
  const { role: actualRole } = useAuth();

  if (!isSimulating || !simulatedRole) return null;

  const handleStop = async () => {
    await stopSimulation();
  };

  return (
    <div className="w-full bg-blue-600 text-white px-4 py-2.5 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-blue-500/50 px-3 py-1 rounded-full">
            <Eye className="h-4 w-4" />
            <span className="font-semibold text-sm">מצב סימולציה</span>
          </div>
          
          {simulatedClientName && (
            <div className="flex items-center gap-1.5 text-blue-100">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{simulatedClientName}</span>
            </div>
          )}
          
          {simulatedContactName && (
            <div className="flex items-center gap-1.5 text-blue-100">
              <User className="h-4 w-4" />
              <span className="font-medium">{simulatedContactName}</span>
            </div>
          )}
          
          <span className="text-blue-200 text-xs hidden sm:inline">
            (תפקיד אמיתי: {actualRole ? ROLE_LABELS[actualRole as AppRole] : 'לא ידוע'})
          </span>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={handleStop}
          className="bg-white text-blue-600 hover:bg-blue-50 font-medium gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">חזרה למצב אדמין</span>
          <span className="sm:hidden">יציאה</span>
        </Button>
      </div>
    </div>
  );
}
