import { useRoleSimulation, ROLE_LABELS } from '@/hooks/useRoleSimulation';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth, type AppRole } from '@/hooks/useAuth';

export function RoleSimulationBanner() {
  const { isSimulating, simulatedRole, stopSimulation } = useRoleSimulation();
  const { role: actualRole } = useAuth();

  if (!isSimulating || !simulatedRole) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5" />
          <span className="font-medium">מצב סימולציה</span>
          <Badge variant="secondary" className="bg-blue-600 text-white">
            צופה כ: {ROLE_LABELS[simulatedRole]}
          </Badge>
          <span className="text-blue-100 text-sm">
            (תפקיד אמיתי: {actualRole ? ROLE_LABELS[actualRole as AppRole] : 'לא ידוע'})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={stopSimulation}
          className="text-white hover:bg-blue-600/50"
        >
          <X className="h-4 w-4 ml-2" />
          חזרה לתפקיד האמיתי
        </Button>
      </div>
    </div>
  );
}
