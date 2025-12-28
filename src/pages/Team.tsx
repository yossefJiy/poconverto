import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Plus,
  Loader2,
  Users,
  Edit2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface TeamMember {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  departments: string[];
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const departmentOptions = [
  "קריאייטיב", "תוכן", "אסטרטגיה", "קופירייטינג", "קמפיינים",
  "מנהל מוצר", "מנהל פרוייקטים", "סטודיו", "גרפיקה", "סרטונים",
  "כלי AI", "מיתוג", "אפיון אתרים", "חוויית משתמש", "עיצוב אתרים",
  "תכנות", "ניהול אתרים", "מדיה"
];

export default function Team() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; member: TeamMember | null }>({ open: false, member: null });
  
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDepartments, setFormDepartments] = useState<string[]>([]);

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string; name: string; email: string; departments: string[] }) => {
      if (data.id) {
        const { error } = await supabase
          .from("team")
          .update({ name: data.name, email: data.email, departments: data.departments, updated_at: new Date().toISOString() })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("team")
          .insert({ name: data.name, email: data.email, departments: data.departments });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("נשמר בהצלחה");
      closeDialog();
    },
    onError: () => toast.error("שגיאה בשמירה"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("נמחק בהצלחה");
      setDeleteDialog({ open: false, member: null });
    },
    onError: () => toast.error("שגיאה במחיקה"),
  });

  const openDialog = (member?: TeamMember) => {
    setSelectedMember(member || null);
    setFormName(member?.name || "");
    setFormEmail(member?.email || "");
    setFormDepartments(member?.departments || []);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedMember(null);
    setFormName("");
    setFormEmail("");
    setFormDepartments([]);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error("נא להזין שם");
      return;
    }
    saveMutation.mutate({
      id: selectedMember?.id,
      name: formName,
      email: formEmail,
      departments: formDepartments,
    });
  };

  const toggleDepartment = (dept: string) => {
    setFormDepartments(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <PageHeader 
          title="הצוות"
          description="ניהול חברי צוות"
          actions={
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף חבר צוות
            </Button>
          }
        />

        {teamMembers.length === 0 ? (
          <div className="glass rounded-xl p-8 md:p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">אין חברי צוות</h3>
            <p className="text-muted-foreground mb-4">הוסף חברי צוות כדי להתחיל</p>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף חבר צוות
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {teamMembers.map((member, index) => (
              <div 
                key={member.id}
                className="glass rounded-xl card-shadow opacity-0 animate-slide-up overflow-hidden group"
                style={{ animationDelay: `${0.1 + index * 0.08}s`, animationFillMode: "forwards" }}
              >
                <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                        {member.name.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{member.name}</h3>
                        {member.email && (
                          <a 
                            href={`mailto:${member.email}`}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(member)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ open: true, member })}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {member.departments.map((dept) => (
                      <Badge key={dept} variant="secondary" className="text-xs">
                        {dept}
                      </Badge>
                    ))}
                    {member.departments.length === 0 && (
                      <span className="text-sm text-muted-foreground">אין מחלקות</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMember ? "עריכת חבר צוות" : "הוספת חבר צוות"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>שם</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="שם מלא" />
            </div>
            <div className="space-y-2">
              <Label>אימייל</Label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>מחלקות</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {departmentOptions.map((dept) => (
                  <div key={dept} className="flex items-center gap-2">
                    <Checkbox 
                      id={dept}
                      checked={formDepartments.includes(dept)}
                      onCheckedChange={() => toggleDepartment(dept)}
                    />
                    <label htmlFor={dept} className="text-sm cursor-pointer">{dept}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={closeDialog}>ביטול</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                שמור
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
            <AlertDialogDescription>האם למחוק את "{deleteDialog.member?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog.member && deleteMutation.mutate(deleteDialog.member.id)} className="bg-destructive hover:bg-destructive/90">
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
