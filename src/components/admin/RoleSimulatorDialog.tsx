import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type AppRole } from "@/hooks/useAuth";
import { useRoleSimulation } from "@/hooks/useRoleSimulation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Building2, User } from "lucide-react";

type ClientSimple = { id: string; name: string };
type ContactSimple = { id: string; name: string; role: string | null };

interface RoleSimulatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleSimulatorDialog({ open, onOpenChange }: RoleSimulatorDialogProps) {
  const { canSimulate, startSimulation } = useRoleSimulation();

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");

  // Reset state when dialog opens
  useEffect(() => {
    if (!open) return;
    setSelectedClientId("");
    setSelectedContactId("");
  }, [open]);

  // Fetch clients
  const {
    data: clientsData,
    isLoading: isClientsLoading,
    isError: isClientsError,
  } = useQuery({
    queryKey: ["clients-for-simulation"],
    queryFn: async (): Promise<ClientSimple[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (supabase as any)
        .from("clients")
        .select("id, name")
        .order("name");
      if (response.error) throw response.error;
      return (response.data ?? []) as ClientSimple[];
    },
    enabled: open && canSimulate,
  });
  const clients = clientsData ?? [];

  // Fetch contacts when client is selected
  const {
    data: contactsData,
    isLoading: isContactsLoading,
    isError: isContactsError,
  } = useQuery({
    queryKey: ["contacts-for-simulation", selectedClientId],
    queryFn: async (): Promise<ContactSimple[]> => {
      if (!selectedClientId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (supabase as any)
        .from("client_contacts")
        .select("id, name, role")
        .eq("client_id", selectedClientId)
        .eq("has_portal_access", true)
        .order("name");
      if (response.error) throw response.error;
      return (response.data ?? []) as ContactSimple[];
    },
    enabled: open && !!selectedClientId,
  });
  const contacts = contactsData ?? [];

  // Reset contact when client changes
  useEffect(() => {
    setSelectedContactId("");
  }, [selectedClientId]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId],
  );
  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId),
    [contacts, selectedContactId],
  );

  const canConfirm = !!selectedClientId && !!selectedContactId;

  const confirm = async () => {
    if (!canConfirm) return;

    const roleToSimulate: AppRole = "basic_client";

    await startSimulation(roleToSimulate, {
      clientId: selectedClientId,
      contactId: selectedContactId,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>סימולציית הרשאות</DialogTitle>
          <DialogDescription>
            בחר לקוח ואיש קשר כדי לראות את המערכת מנקודת המבט שלו.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              בחר לקוח
            </Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isClientsLoading
                      ? "טוען לקוחות…"
                      : isClientsError
                        ? "שגיאה בטעינת לקוחות"
                        : "בחר לקוח…"
                  }
                />
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

          {!!selectedClientId && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                בחר איש קשר
              </Label>
              <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isContactsLoading
                        ? "טוען אנשי קשר…"
                        : isContactsError
                          ? "שגיאה בטעינת אנשי קשר"
                          : contacts.length === 0
                            ? "אין אנשי קשר עם גישה לפורטל"
                            : "בחר איש קשר…"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                      {contact.role ? ` (${contact.role})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(selectedClient && selectedContact) && (
            <div className="rounded-md border bg-blue-500/10 border-blue-500/30 p-3 text-sm">
              <div className="font-medium mb-1 text-blue-600">סיכום הסימולציה</div>
              <div className="space-y-1 text-muted-foreground">
                <div>👤 איש קשר: <span className="font-medium text-foreground">{selectedContact.name}</span></div>
                <div>🏢 לקוח: <span className="font-medium text-foreground">{selectedClient.name}</span></div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                תראה את המערכת בדיוק כפי שאיש הקשר רואה אותה, כולל הגבלות גישה למודולים.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={confirm} disabled={!canConfirm} className="bg-blue-600 hover:bg-blue-700">
            התחל סימולציה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
