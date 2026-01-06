import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type AppRole } from "@/hooks/useAuth";
import { useRoleSimulation, ROLE_LABELS } from "@/hooks/useRoleSimulation";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Building2, User } from "lucide-react";

type ClientSimple = { id: string; name: string };
type ContactSimple = { id: string; name: string; role: string | null };

type PermissionTarget = "client" | "contact";

const ROLE_ICONS: Record<AppRole, string> = {
  super_admin: "👑",
  admin: "🛡️",
  agency_manager: "🏢",
  team_manager: "👥",
  employee: "💼",
  premium_client: "⭐",
  basic_client: "👤",
  demo: "🎭",
};

interface RoleSimulatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleSimulatorDialog({ open, onOpenChange }: RoleSimulatorDialogProps) {
  const { canSimulate, startSimulation } = useRoleSimulation();

  const [target, setTarget] = useState<PermissionTarget>("client");
  const [clientRole, setClientRole] = useState<AppRole>("basic_client");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");

  // Reset state when dialog opens
  useEffect(() => {
    if (!open) return;
    setTarget("client");
    setClientRole("basic_client");
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

  // Fetch contacts (only when simulating a contact)
  const {
    data: contactsData,
    isLoading: isContactsLoading,
    isError: isContactsError,
  } = useQuery({
    queryKey: ["contacts-for-simulation", selectedClientId, target],
    queryFn: async (): Promise<ContactSimple[]> => {
      if (!selectedClientId || target !== "contact") return [];
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
    enabled: open && !!selectedClientId && target === "contact",
  });
  const contacts = contactsData ?? [];

  // Reset contact when client changes / switching mode
  useEffect(() => {
    setSelectedContactId("");
  }, [selectedClientId, target]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId],
  );
  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId),
    [contacts, selectedContactId],
  );

  const canConfirm =
    !!selectedClientId &&
    (target === "client" || (target === "contact" && !!selectedContactId));

  const confirm = async () => {
    if (!canConfirm) return;

    const roleToSimulate: AppRole =
      target === "client" ? clientRole : "basic_client";

    await startSimulation(roleToSimulate, {
      clientId: selectedClientId,
      contactId: target === "contact" ? selectedContactId : undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>סימולציית הרשאות</DialogTitle>
          <DialogDescription>
            בחר סוג הרשאה, ואז בחר לקוח (ובמידת הצורך גם איש קשר).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>סוג הרשאה</Label>
            <RadioGroup
              value={target}
              onValueChange={(v) => setTarget(v as PermissionTarget)}
              className="grid grid-cols-2 gap-3"
            >
              <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer">
                <RadioGroupItem value="client" />
                <span className="font-medium">לקוח</span>
              </label>
              <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer">
                <RadioGroupItem value="contact" />
                <span className="font-medium">איש קשר</span>
              </label>
            </RadioGroup>
          </div>

          {target === "client" && (
            <div className="space-y-2">
              <Label>סוג לקוח</Label>
              <Select
                value={clientRole}
                onValueChange={(v) => setClientRole(v as AppRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג לקוח" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic_client">
                    {ROLE_ICONS.basic_client} {ROLE_LABELS.basic_client}
                  </SelectItem>
                  <SelectItem value="premium_client">
                    {ROLE_ICONS.premium_client} {ROLE_LABELS.premium_client}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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

          {target === "contact" && !!selectedClientId && (
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

          {(selectedClient || selectedContact) && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <div className="font-medium mb-1">סיכום</div>
              <div className="space-y-1 text-muted-foreground">
                {target === "client" ? (
                  <div>
                    {ROLE_ICONS[clientRole]} {ROLE_LABELS[clientRole]}
                  </div>
                ) : (
                  <div>איש קשר (בתוך לקוח)</div>
                )}
                {selectedClient && <div>לקוח: {selectedClient.name}</div>}
                {selectedContact && <div>איש קשר: {selectedContact.name}</div>}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={confirm} disabled={!canConfirm}>
            התחל סימולציה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
