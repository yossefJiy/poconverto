import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  Globe,
  Loader2,
  MoreVertical,
  Users,
  Megaphone,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useClient } from "@/hooks/useClient";

interface ClientForm {
  name: string;
  industry: string;
  website: string;
  description: string;
  logo_url: string;
}

const emptyForm: ClientForm = {
  name: "",
  industry: "",
  website: "",
  description: "",
  logo_url: "",
};

export default function Clients() {
  const queryClient = useQueryClient();
  const { setSelectedClient } = useClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clientStats = {} } = useQuery({
    queryKey: ["client-stats"],
    queryFn: async () => {
      const { data: campaigns } = await supabase.from("campaigns").select("client_id, status");
      const { data: tasks } = await supabase.from("tasks").select("client_id, status");
      
      const stats: Record<string, { campaigns: number; tasks: number; activeCampaigns: number }> = {};
      
      campaigns?.forEach(c => {
        if (!stats[c.client_id]) stats[c.client_id] = { campaigns: 0, tasks: 0, activeCampaigns: 0 };
        stats[c.client_id].campaigns++;
        if (c.status === "active") stats[c.client_id].activeCampaigns++;
      });
      
      tasks?.forEach(t => {
        if (t.client_id) {
          if (!stats[t.client_id]) stats[t.client_id] = { campaigns: 0, tasks: 0, activeCampaigns: 0 };
          stats[t.client_id].tasks++;
        }
      });
      
      return stats;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClientForm) => {
      const { data: newClient, error } = await supabase.from("clients").insert({
        name: data.name,
        industry: data.industry || null,
        website: data.website || null,
        description: data.description || null,
        logo_url: data.logo_url || null,
      }).select().single();
      if (error) throw error;
      return newClient;
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      toast.success("הלקוח נוצר בהצלחה");
      setShowDialog(false);
      setForm(emptyForm);
      setSelectedClient(newClient);
    },
    onError: () => toast.error("שגיאה ביצירת לקוח"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClientForm }) => {
      const { error } = await supabase.from("clients").update({
        name: data.name,
        industry: data.industry || null,
        website: data.website || null,
        description: data.description || null,
        logo_url: data.logo_url || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      toast.success("הלקוח עודכן בהצלחה");
      setShowDialog(false);
      setEditingClient(null);
      setForm(emptyForm);
    },
    onError: () => toast.error("שגיאה בעדכון לקוח"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      toast.success("הלקוח נמחק");
      setDeleteId(null);
    },
    onError: () => toast.error("שגיאה במחיקת לקוח"),
  });

  const openEditDialog = (client: any) => {
    setEditingClient(client);
    setForm({
      name: client.name,
      industry: client.industry || "",
      website: client.website || "",
      description: client.description || "",
      logo_url: client.logo_url || "",
    });
    setShowDialog(true);
  };

  const openCreateDialog = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("שם הלקוח הוא שדה חובה");
      return;
    }
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <MainLayout>
      <div className="p-8">
        <PageHeader 
          title="ניהול לקוחות"
          description="הוסף, ערוך ונהל לקוחות במערכת"
          actions={
            <Button className="glow" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 ml-2" />
              לקוח חדש
            </Button>
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : clients.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">אין לקוחות עדיין</h3>
            <p className="text-muted-foreground mb-4">הוסף את הלקוח הראשון שלך כדי להתחיל</p>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף לקוח
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client, index) => {
              const stats = clientStats[client.id] || { campaigns: 0, tasks: 0, activeCampaigns: 0 };
              
              return (
                <div 
                  key={client.id}
                  className="glass rounded-xl card-shadow opacity-0 animate-slide-up overflow-hidden group"
                  style={{ animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: "forwards" }}
                >
                  <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {client.logo_url ? (
                          <img 
                            src={client.logo_url} 
                            alt={client.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                            {client.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-lg">{client.name}</h3>
                          {client.industry && (
                            <p className="text-sm text-muted-foreground">{client.industry}</p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedClient(client)}>
                            <Target className="w-4 h-4 ml-2" />
                            בחר לקוח זה
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(client)}>
                            <Edit2 className="w-4 h-4 ml-2" />
                            ערוך
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteId(client.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            מחק
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {client.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{client.description}</p>
                    )}

                    {client.website && (
                      <a 
                        href={client.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline mb-4"
                      >
                        <Globe className="w-3 h-3" />
                        {client.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    )}

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-primary mb-1">
                          <Megaphone className="w-4 h-4" />
                        </div>
                        <p className="text-lg font-bold">{stats.campaigns}</p>
                        <p className="text-xs text-muted-foreground">קמפיינים</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-success mb-1">
                          <Target className="w-4 h-4" />
                        </div>
                        <p className="text-lg font-bold">{stats.activeCampaigns}</p>
                        <p className="text-xs text-muted-foreground">פעילים</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-warning mb-1">
                          <Users className="w-4 h-4" />
                        </div>
                        <p className="text-lg font-bold">{stats.tasks}</p>
                        <p className="text-xs text-muted-foreground">משימות</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingClient ? "עריכת לקוח" : "לקוח חדש"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">שם הלקוח *</label>
                <Input
                  placeholder="שם הלקוח"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">תחום</label>
                <Input
                  placeholder="לדוגמה: טכנולוגיה, נדל״ן, אופנה..."
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">אתר אינטרנט</label>
                <Input
                  placeholder="https://example.com"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">לוגו (URL)</label>
                <Input
                  placeholder="https://example.com/logo.png"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">תיאור</label>
                <Textarea
                  placeholder="תיאור קצר על הלקוח..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingClient ? "שמור שינויים" : "צור לקוח")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו תמחק את הלקוח לצמיתות. כל הקמפיינים, המשימות והנתונים המשויכים אליו יימחקו גם הם.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "מחק"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
