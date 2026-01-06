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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Check, Building2, User } from 'lucide-react';
import { useState, useEffect } from 'react';

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

type ClientSimple = { id: string; name: string };
type ContactSimple = { id: string; name: string; role: string | null };

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

  const [showClientDialog, setShowClientDialog] = useState(false);
  const [pendingRole, setPendingRole] = useState<AppRole | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [reason, setReason] = useState('');

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

  // Reset contact when client changes
  useEffect(() => {
    setSelectedContactId('');
  }, [selectedClientId]);

  if (!canSimulate) return null;

  const handleClientRoleSelect = (role: AppRole) => {
    setPendingRole(role);
    setSelectedClientId('');
    setSelectedContactId('');
    setReason('');
    setShowClientDialog(true);
  };

  const handleNonClientRoleSelect = (role: AppRole) => {
    setPendingRole(role);
    setSelectedClientId('');
    setSelectedContactId('');
    setReason('');
    setShowClientDialog(true);
  };

  const confirmSimulation = async () => {
    if (!pendingRole) return;
    
    const client = clients.find(c => c.id === selectedClientId);
    const contact = contacts.find(c => c.id === selectedContactId);
    
    await startSimulation(pendingRole, {
      clientId: selectedClientId || undefined,
      contactId: selectedContactId || undefined,
      reason: reason || undefined,
    });
    
    setShowClientDialog(false);
    setPendingRole(null);
    setSelectedClientId('');
    setSelectedContactId('');
    setReason('');
  };

  const handleStopSimulation = async () => {
    await stopSimulation();
  };

  const isClientRole = pendingRole && CLIENT_ROLES.includes(pendingRole);
  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedContact = contacts.find(c => c.id === selectedContactId);

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
            const isClientRoleType = CLIENT_ROLES.includes(role);
            
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => {
                  if (isActualRole && !isSimulating) return;
                  if (isClientRoleType) {
                    handleClientRoleSelect(role);
                  } else {
                    handleNonClientRoleSelect(role);
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

      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>התחלת סימולציה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Role display */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">{pendingRole && ROLE_ICONS[pendingRole]}</span>
                <span className="font-medium text-lg">
                  {pendingRole && ROLE_LABELS[pendingRole]}
                </span>
              </div>
            </div>

            {/* Client selection - only for client roles */}
            {isClientRole && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  בחר לקוח
                </Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר לקוח..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Contact selection - only when client is selected */}
            {isClientRole && selectedClientId && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  בחר איש קשר (אופציונלי)
                </Label>
                <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                  <SelectTrigger>
                    <SelectValue placeholder="כללי (ללא איש קשר)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">כללי (ללא איש קשר)</SelectItem>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name} {contact.role && `(${contact.role})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Reason input */}
            <div className="space-y-2">
              <Label htmlFor="reason">סיבת הסימולציה (אופציונלי)</Label>
              <Input
                id="reason"
                placeholder="לדוגמה: בדיקת חוויית משתמש"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* Summary */}
            {(selectedClient || selectedContact) && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                  תראה את המערכת כ:
                </p>
                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  {selectedClient && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      {selectedClient.name}
                    </div>
                  )}
                  {selectedContact && (
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      {selectedContact.name}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientDialog(false)}>
              ביטול
            </Button>
            <Button 
              onClick={confirmSimulation}
              disabled={isClientRole && !selectedClientId}
            >
              התחל סימולציה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
