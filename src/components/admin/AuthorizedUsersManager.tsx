import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  UserPlus, 
  Mail, 
  Trash2, 
  Loader2,
  Send,
  CheckCircle,
  XCircle,
  Phone,
  User,
  Pencil,
  MessageSquare
} from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("אימייל לא תקין");
const phoneSchema = z.string().regex(/^0\d{9}$/, "מספר טלפון לא תקין (10 ספרות)").optional().or(z.literal(""));

type AppRole = 'super_admin' | 'admin' | 'agency_manager' | 'team_manager' | 'employee' | 'premium_client' | 'basic_client' | 'demo';
type NotificationPreference = 'email' | 'sms' | 'both';

interface AuthorizedEmail {
  id: string;
  email: string;
  role: AppRole;
  name: string | null;
  phone: string | null;
  notification_preference: NotificationPreference;
  is_active: boolean;
  invited_at: string | null;
  last_login_at: string | null;
  created_at: string;
}

const roleLabels: Record<AppRole, string> = {
  super_admin: "סופר אדמין",
  admin: "אדמין",
  agency_manager: "מנהל סוכנות",
  team_manager: "מנהל צוות",
  employee: "עובד",
  premium_client: "לקוח פרמיום",
  basic_client: "לקוח בסיס",
  demo: "דמו",
};

const notificationLabels: Record<NotificationPreference, string> = {
  email: "אימייל",
  sms: "SMS",
  both: "שניהם",
};

export function AuthorizedUsersManager() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthorizedEmail | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("basic_client");
  const [newNotificationPref, setNewNotificationPref] = useState<NotificationPreference>("email");
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const { data: authorizedEmails = [], isLoading } = useQuery({
    queryKey: ["authorized-emails"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("authorized_emails")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AuthorizedEmail[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("authorized_emails").insert({
        email: newEmail.toLowerCase().trim(),
        name: newName.trim() || null,
        phone: newPhone.trim() || null,
        role: newRole,
        notification_preference: newNotificationPref,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorized-emails"] });
      toast.success("המשתמש נוסף בהצלחה");
      resetForm();
      setIsOpen(false);
    },
    onError: (error: any) => {
      if (error.message.includes("duplicate")) {
        toast.error("האימייל כבר קיים במערכת");
      } else {
        toast.error("שגיאה בהוספת המשתמש");
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (user: Partial<AuthorizedEmail> & { id: string }) => {
      const { error } = await supabase
        .from("authorized_emails")
        .update({
          name: user.name,
          phone: user.phone,
          role: user.role,
          notification_preference: user.notification_preference,
        })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorized-emails"] });
      toast.success("המשתמש עודכן בהצלחה");
      setIsEditOpen(false);
      setEditingUser(null);
    },
    onError: () => toast.error("שגיאה בעדכון המשתמש"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("authorized_emails").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorized-emails"] });
      toast.success("המשתמש הוסר בהצלחה");
    },
    onError: () => toast.error("שגיאה בהסרת המשתמש"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("authorized_emails")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorized-emails"] });
      toast.success("הסטטוס עודכן");
    },
    onError: () => toast.error("שגיאה בעדכון הסטטוס"),
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async (user: AuthorizedEmail) => {
      const { error } = await supabase.functions.invoke("send-client-invitation", {
        body: {
          email: user.email,
          clientName: "JIY Marketing",
          dashboardUrl: window.location.origin,
          inviterName: "מנהל המערכת",
          userRole: user.role,
          userName: user.name,
          userPhone: user.phone,
        },
      });
      if (error) throw error;
      
      // Update invited_at
      await supabase
        .from("authorized_emails")
        .update({ invited_at: new Date().toISOString() })
        .eq("id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authorized-emails"] });
      toast.success("ההזמנה נשלחה בהצלחה");
    },
    onError: () => toast.error("שגיאה בשליחת ההזמנה"),
  });

  const validateInputs = () => {
    const newErrors: { email?: string; phone?: string } = {};
    
    try {
      emailSchema.parse(newEmail);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0]?.message;
      }
    }
    
    if (newPhone) {
      try {
        phoneSchema.parse(newPhone);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.phone = e.errors[0]?.message;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEditInputs = () => {
    if (!editingUser) return false;
    
    const newErrors: { email?: string; phone?: string } = {};
    
    if (editingUser.phone) {
      try {
        phoneSchema.parse(editingUser.phone);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.phone = e.errors[0]?.message;
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (!validateInputs()) return;
    addMutation.mutate();
  };

  const handleEdit = (user: AuthorizedEmail) => {
    setEditingUser({ ...user });
    setErrors({});
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!editingUser || !validateEditInputs()) return;
    updateMutation.mutate(editingUser);
  };

  const resetForm = () => {
    setNewEmail("");
    setNewName("");
    setNewPhone("");
    setNewRole("basic_client");
    setNewNotificationPref("email");
    setErrors({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">משתמשים מורשים</h2>
          <p className="text-muted-foreground text-sm">
            רק משתמשים ברשימה זו יכולים להתחבר למערכת
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsOpen(true); }}>
              <UserPlus className="w-4 h-4 ml-2" />
              הוסף משתמש
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הוספת משתמש מורשה</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">שם</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="שם המשתמש"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">אימייל *</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    dir="ltr"
                    className="pr-10"
                  />
                </div>
                {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון (לקבלת SMS)</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0501234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    dir="ltr"
                    className="pr-10"
                  />
                </div>
                {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">תפקיד</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תפקיד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">מנהל מערכת</SelectItem>
                    <SelectItem value="manager">מנהל</SelectItem>
                    <SelectItem value="team_lead">ראש צוות</SelectItem>
                    <SelectItem value="team_member">חבר צוות</SelectItem>
                    <SelectItem value="client">לקוח</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification">קבלת קוד אימות דרך</Label>
                <Select value={newNotificationPref} onValueChange={(v) => setNewNotificationPref(v as NotificationPreference)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר שיטת התראה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        אימייל
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        SMS
                      </div>
                    </SelectItem>
                    <SelectItem value="both">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        שניהם (SMS + אימייל)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleAdd}
                disabled={addMutation.isPending}
              >
                {addMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <UserPlus className="w-4 h-4 ml-2" />
                )}
                הוסף משתמש
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת משתמש</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input value={editingUser.email} disabled dir="ltr" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-name">שם</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="edit-name"
                    placeholder="שם המשתמש"
                    value={editingUser.name || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="pr-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-phone">טלפון (לקבלת SMS)</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="edit-phone"
                    type="tel"
                    placeholder="0501234567"
                    value={editingUser.phone || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    dir="ltr"
                    className="pr-10"
                  />
                </div>
                {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-role">תפקיד</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(v) => setEditingUser({ ...editingUser, role: v as AppRole })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תפקיד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">מנהל מערכת</SelectItem>
                    <SelectItem value="manager">מנהל</SelectItem>
                    <SelectItem value="team_lead">ראש צוות</SelectItem>
                    <SelectItem value="team_member">חבר צוות</SelectItem>
                    <SelectItem value="client">לקוח</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notification">קבלת קוד אימות דרך</Label>
                <Select 
                  value={editingUser.notification_preference} 
                  onValueChange={(v) => setEditingUser({ ...editingUser, notification_preference: v as NotificationPreference })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר שיטת התראה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        אימייל
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        SMS
                      </div>
                    </SelectItem>
                    <SelectItem value="both">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        שניהם (SMS + אימייל)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                ) : (
                  <Pencil className="w-4 h-4 ml-2" />
                )}
                שמור שינויים
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">שם</TableHead>
              <TableHead className="text-right">אימייל</TableHead>
              <TableHead className="text-right">טלפון</TableHead>
              <TableHead className="text-right">תפקיד</TableHead>
              <TableHead className="text-right">התראות</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {authorizedEmails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  אין משתמשים מורשים
                </TableCell>
              </TableRow>
            ) : (
              authorizedEmails.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || "-"}</TableCell>
                  <TableCell dir="ltr" className="text-right">{user.email}</TableCell>
                  <TableCell dir="ltr" className="text-right">{user.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{roleLabels[user.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      {user.notification_preference === "sms" && <MessageSquare className="w-3 h-3" />}
                      {user.notification_preference === "email" && <Mail className="w-3 h-3" />}
                      {user.notification_preference === "both" && (
                        <>
                          <MessageSquare className="w-3 h-3" />
                          <Mail className="w-3 h-3" />
                        </>
                      )}
                      {notificationLabels[user.notification_preference] || "אימייל"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActiveMutation.mutate({ id: user.id, is_active: !user.is_active })}
                    >
                      {user.is_active ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                        title="ערוך משתמש"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendInvitationMutation.mutate(user)}
                        disabled={sendInvitationMutation.isPending}
                        title="שלח הזמנה במייל"
                      >
                        {sendInvitationMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(user.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
