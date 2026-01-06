import { useRoleSimulation, ROLE_LABELS } from '@/hooks/useRoleSimulation';
import { Button } from '@/components/ui/button';
import { Eye, X, Building2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth, type AppRole } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function RoleSimulationBanner() {
  const { 
    isSimulating, 
    simulatedRole, 
    simulatedClientId,
    simulatedContactId,
    stopSimulation 
  } = useRoleSimulation();
  const { role: actualRole } = useAuth();

  // Fetch client name dynamically
  const { data: clientData } = useQuery({
    queryKey: ['simulation-client', simulatedClientId],
    queryFn: async () => {
      if (!simulatedClientId) return null;
      const { data } = await supabase
        .from('clients')
        .select('name')
        .eq('id', simulatedClientId)
        .single();
      return data;
    },
    enabled: !!simulatedClientId,
  });

  // Fetch contact name dynamically
  const { data: contactData } = useQuery({
    queryKey: ['simulation-contact', simulatedContactId],
    queryFn: async () => {
      if (!simulatedContactId) return null;
      const { data } = await supabase
        .from('client_contacts')
        .select('name, role')
        .eq('id', simulatedContactId)
        .single();
      return data;
    },
    enabled: !!simulatedContactId,
  });

  if (!isSimulating || !simulatedRole) return null;

  const handleStop = async () => {
    await stopSimulation();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white px-4 py-2">
      <div className="container mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <Eye className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">מצב סימולציה</span>
          <Badge variant="secondary" className="bg-blue-600 text-white">
            {ROLE_LABELS[simulatedRole]}
          </Badge>
          
          {clientData && (
            <div className="flex items-center gap-1 text-blue-100">
              <Building2 className="h-4 w-4" />
              <span>{clientData.name}</span>
            </div>
          )}
          
          {contactData && (
            <div className="flex items-center gap-1 text-blue-100">
              <User className="h-4 w-4" />
              <span>{contactData.name}</span>
              {contactData.role && (
                <span className="text-blue-200 text-xs">({contactData.role})</span>
              )}
            </div>
          )}
          
          <span className="text-blue-100 text-sm">
            (תפקיד אמיתי: {actualRole ? ROLE_LABELS[actualRole as AppRole] : 'לא ידוע'})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          className="text-white hover:bg-blue-600/50"
        >
          <X className="h-4 w-4 ml-2" />
          חזרה לתפקיד האמיתי
        </Button>
      </div>
    </div>
  );
}
