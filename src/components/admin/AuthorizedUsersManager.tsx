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
  User
} from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("אימייל לא תקין");
const phoneSchema = z.string().regex(/^0\d{9}$/, "מספר טלפון לא תקין (10 ספרות)").optional().or(z.literal(""));

type AppRole = 'admin' | 'manager' | 'department_head' | 'team_lead' | 'team_member' | 'client' | 'demo';

interface AuthorizedEmail {
  id: string;
  email: string;
  role: AppRole;
  name: string | null;
  phone: string | null;
  is_active: boolean;
  invited_at: string | null;
  last_login_at: string | null;
  created_at: string;
}

const roleLabels: Record<AppRole, string> = {
  admin: "מנהל מערכת",
  manager: "מנהל",
  department_head: "ראש מחלקה",
  team_lead: "ראש צוות",
  team_member: "חבר צוות",
  client: "לקוח",
  demo: "דמו",
};

export function AuthorizedUsersManager() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("client");
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

  const handleAdd = () => {
    if (!validateInputs()) return;
    addMutation.mutate();
  };

  const resetForm = () => {
    setNewEmail("");
    setNewName("");
    setNewPhone("");
    setNewRole("client");
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
                <Label htmlFor="phone">טלפון</Label>
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

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">שם</TableHead>
              <TableHead className="text-right">אימייל</TableHead>
              <TableHead className="text-right">טלפון</TableHead>
              <TableHead className="text-right">תפקיד</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {authorizedEmails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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