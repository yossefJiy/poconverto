import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, UserCircle, Mail, Phone, Briefcase, Star } from "lucide-react";

interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_primary: boolean;
  receive_task_updates: boolean;
  has_portal_access: boolean;
  created_at: string;
  updated_at: string;
}

interface ClientContactsManagerProps {
  clientId: string;
  clientName: string;
}

export function ClientContactsManager({ clientId, clientName }: ClientContactsManagerProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; contact: ClientContact | null }>({
    open: false,
    contact: null,
  });
  const [selectedContact, setSelectedContact] = useState<ClientContact | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [receiveUpdates, setReceiveUpdates] = useState(true);
  const [hasPortalAccess, setHasPortalAccess] = useState(false);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["client-contacts", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_contacts")
        .select("*")
        .eq("client_id", clientId)
        .order("is_primary", { ascending: false })
        .order("name");

      if (error) throw error;
      return data as ClientContact[];
    },
    enabled: !!clientId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const contactData = {
        client_id: clientId,
        name,
        email: email || null,
        phone: phone || null,
        role: role || null,
        is_primary: isPrimary,
        receive_task_updates: receiveUpdates,
        has_portal_access: hasPortalAccess,
      };

      if (selectedContact) {
        const { error } = await supabase
          .from("client_contacts")
          .update(contactData)
          .eq("id", selectedContact.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("client_contacts").insert(contactData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-contacts", clientId] });
      toast.success(selectedContact ? "איש הקשר עודכן" : "איש הקשר נוסף");
      closeDialog();
    },
    onError: (error: any) => {
      toast.error(error.message || "שגיאה בשמירה");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase.from("client_contacts").delete().eq("id", contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-contacts", clientId] });
      toast.success("איש הקשר נמחק");
      setDeleteDialog({ open: false, contact: null });
    },
    onError: (error: any) => {
      toast.error(error.message || "שגיאה במחיקה");
    },
  });

  const openDialog = (contact?: ClientContact) => {
    if (contact) {
      setSelectedContact(contact);
      setName(contact.name);
      setEmail(contact.email || "");
      setPhone(contact.phone || "");
      setRole(contact.role || "");
      setIsPrimary(contact.is_primary);
      setReceiveUpdates(contact.receive_task_updates);
      setHasPortalAccess(contact.has_portal_access);
    } else {
      setSelectedContact(null);
      setName("");
      setEmail("");
      setPhone("");
      setRole("");
      setIsPrimary(false);
      setReceiveUpdates(true);
      setHasPortalAccess(false);
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedContact(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("יש להזין שם");
      return;
    }
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="w-5 h-5" />
            אנשי קשר - {clientName}
          </CardTitle>
          <CardDescription>ניהול אנשי הקשר של הלקוח והרשאותיהם</CardDescription>
        </div>
        <Button onClick={() => openDialog()} size="sm">
          <Plus className="w-4 h-4 ml-2" />
          הוסף איש קשר
        </Button>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>אין אנשי קשר עדיין</p>
            <Button variant="link" onClick={() => openDialog()}>
              הוסף את הראשון
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contact.name}</span>
                      {contact.is_primary && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                      {contact.role && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{contact.role}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1" dir="ltr">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      {contact.receive_task_updates && (
                        <span className="text-green-600 dark:text-green-400">✓ עדכוני משימות</span>
                      )}
                      {contact.has_portal_access && (
                        <span className="text-blue-600 dark:text-blue-400">✓ גישה לפורטל</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openDialog(contact)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteDialog({ open: true, contact })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedContact ? "עריכת איש קשר" : "הוספת איש קשר"}</DialogTitle>
            <DialogDescription>
              {selectedContact ? "ערוך את פרטי איש הקשר" : "הוסף איש קשר חדש ללקוח"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="שם מלא"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="050-000-0000"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">תפקיד</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="למשל: מנכ״ל, מנהל שיווק..."
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="is-primary"
                  checked={isPrimary}
                  onCheckedChange={(checked) => setIsPrimary(checked === true)}
                />
                <Label htmlFor="is-primary" className="cursor-pointer">
                  איש קשר ראשי
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="receive-updates"
                  checked={receiveUpdates}
                  onCheckedChange={(checked) => setReceiveUpdates(checked === true)}
                />
                <Label htmlFor="receive-updates" className="cursor-pointer">
                  קבלת עדכוני משימות במייל
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="portal-access"
                  checked={hasPortalAccess}
                  onCheckedChange={(checked) => setHasPortalAccess(checked === true)}
                />
                <Label htmlFor="portal-access" className="cursor-pointer">
                  גישה לפורטל הלקוח
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              ביטול
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : null}
              {selectedContact ? "עדכן" : "הוסף"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, contact: deleteDialog.contact })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם למחוק את איש הקשר?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את {deleteDialog.contact?.name} לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDialog.contact && deleteMutation.mutate(deleteDialog.contact.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "מחק"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
