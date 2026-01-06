import { useRoleSimulation, ROLE_LABELS } from '@/hooks/useRoleSimulation';
import { useAuth, type AppRole } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Check, Building2, User } from 'lucide-react';
import { useState } from 'react';

const ROLE_ICONS: Record<AppRole, string> = {
  super_admin: '👑',
  admin: '🛡️',
  agency_manager: '🏢',
  team_manager: '👥',
  employee: '💼',
  premium_client: '⭐',
  basic_client: '👤',
  demo: '🎭',
};

const CLIENT_ROLES: AppRole[] = ['premium_client', 'basic_client'];

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

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [pendingSimulation, setPendingSimulation] = useState<{
    role: AppRole;
    clientId?: string;
    contactId?: string;
    clientName?: string;
    contactName?: string;
  } | null>(null);
  const [reason, setReason] = useState('');

  type ClientSimple = { id: string; name: string };
  type ContactSimple = { id: string; name: string; role: string | null };

  // Fetch clients for simulation
  const { data: clientsData } = useQuery({
    queryKey: ['clients-for-simulation'],
    queryFn: async (): Promise<ClientSimple[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (supabase as any)
        .from('clients')
        .select('id, name')
        .eq('is_deleted', false)
        .order('name');
      if (response.error) throw response.error;
      return (response.data ?? []) as ClientSimple[];
    },
    enabled: canSimulate,
  });
  const clients = clientsData ?? [];

  // Fetch contacts for selected client
  const { data: contactsData } = useQuery({
    queryKey: ['contacts-for-simulation', selectedClientId],
    queryFn: async (): Promise<ContactSimple[]> => {
      if (!selectedClientId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (supabase as any)
        .from('client_contacts')
        .select('id, name, role')
        .eq('client_id', selectedClientId)
        .eq('has_portal_access', true)
        .order('name');
      if (response.error) throw response.error;
      return (response.data ?? []) as ContactSimple[];
    },
    enabled: !!selectedClientId,
  });
  const contacts = contactsData ?? [];

  if (!canSimulate) return null;

  const handleNonClientRoleSelect = (role: AppRole) => {
    setPendingSimulation({ role });
    setShowReasonDialog(true);
  };


  const handleContactSelect = (role: AppRole, clientId: string, contactId: string | null, contactName: string | null) => {
    const client = clients.find(c => c.id === clientId);
    setPendingSimulation({
      role,
      clientId,
      contactId: contactId || undefined,
      clientName: client?.name,
      contactName: contactName || undefined,
    });
    setShowReasonDialog(true);
  };

  const confirmSimulation = async () => {
    if (!pendingSimulation) return;
    
    await startSimulation(pendingSimulation.role, {
      clientId: pendingSimulation.clientId,
      contactId: pendingSimulation.contactId,
      reason: reason || undefined,
    });
    
    setShowReasonDialog(false);
    setPendingSimulation(null);
    setReason('');
    
    setSelectedClientId(null);
  };

  const handleStopSimulation = async () => {
    await stopSimulation();
  };

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
        <DropdownMenuSubContent className="w-56">
          {availableRoles.map((role) => {
            const isActualRole = role === actualRole;
            const isCurrentSimulated = role === simulatedRole;
            const isClientRole = CLIENT_ROLES.includes(role);
            
            if (isClientRole) {
              return (
                <DropdownMenuSub key={role}>
                  <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer">
                    <span>{ROLE_ICONS[role]}</span>
                    <span className="flex-1">{ROLE_LABELS[role]}</span>
                    {isCurrentSimulated && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56 max-h-[300px] overflow-y-auto">
                    {clients.map((client) => (
                      <DropdownMenuSub
                        key={client.id}
                        onOpenChange={(open) => {
                          if (open) setSelectedClientId(client.id);
                        }}
                      >
                        <DropdownMenuSubTrigger
                          className="flex items-center gap-2 cursor-pointer"
                          onPointerMove={() => setSelectedClientId(client.id)}
                          onFocus={() => setSelectedClientId(client.id)}
                        >
                          <Building2 className="w-4 h-4" />
                          <span className="truncate flex-1">{client.name}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-52 max-h-[250px] overflow-y-auto">
                          <DropdownMenuItem
                            onClick={() => handleContactSelect(role, client.id, null, null)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <User className="w-4 h-4 opacity-50" />
                            <span>כללי (ללא איש קשר)</span>
                          </DropdownMenuItem>
                          {selectedClientId === client.id && contacts.length > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              {contacts.map((contact) => (
                                <DropdownMenuItem
                                  key={contact.id}
                                  onClick={() => handleContactSelect(role, client.id, contact.id, contact.name)}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <User className="w-4 h-4" />
                                  <span className="truncate flex-1">{contact.name}</span>
                                  {contact.role && (
                                    <span className="text-xs text-muted-foreground">
                                      {contact.role}
                                    </span>
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            }

            return (
              <DropdownMenuItem
                key={role}
                onClick={() => {
                  if (isActualRole && !isSimulating) return;
                  handleNonClientRoleSelect(role);
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
                onClick={() => handleStopSimulation()}
                className="text-blue-600 cursor-pointer flex items-center gap-2"
              >
                <span>↩️</span>
                <span>חזרה לתפקיד האמיתי</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>התחלת סימולציה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                אתה עומד לצפות במערכת כ:
              </p>
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <div className="flex items-center gap-2">
                  <span>{pendingSimulation?.role && ROLE_ICONS[pendingSimulation.role]}</span>
                  <span className="font-medium">
                    {pendingSimulation?.role && ROLE_LABELS[pendingSimulation.role]}
                  </span>
                </div>
                {pendingSimulation?.clientName && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    {pendingSimulation.clientName}
                  </div>
                )}
                {pendingSimulation?.contactName && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-3 w-3" />
                    {pendingSimulation.contactName}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">סיבת הסימולציה (אופציונלי)</Label>
              <Input
                id="reason"
                placeholder="לדוגמה: בדיקת חוויית משתמש"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReasonDialog(false)}>
              ביטול
            </Button>
            <Button onClick={confirmSimulation}>
              התחל סימולציה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
