import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Target, 
  MessageSquare,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type MarketingType = 'persona' | 'competitor' | 'goal' | 'brand_message';

interface MarketingItem {
  id: string;
  client_id: string;
  type: MarketingType;
  name: string;
  data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function Marketing() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<MarketingType>('persona');
  const [selectedItem, setSelectedItem] = useState<MarketingItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: MarketingItem | null }>({ open: false, item: null });
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: marketingData = [], isLoading } = useQuery({
    queryKey: ["marketing-data", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("marketing_data")
        .select("*")
        .eq("client_id", selectedClient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MarketingItem[];
    },
    enabled: !!selectedClient,
  });

  const personas = marketingData.filter(item => item.type === 'persona');
  const brandMessages = marketingData.filter(item => item.type === 'brand_message');
  const goals = marketingData.filter(item => item.type === 'goal');
  const competitors = marketingData.filter(item => item.type === 'competitor');

  const saveMutation = useMutation({
    mutationFn: async ({ id, type, name, data }: { id?: string; type: MarketingType; name: string; data: Record<string, any> }) => {
      if (id) {
        const { error } = await supabase
          .from("marketing_data")
          .update({ name, data, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("marketing_data")
          .insert({ client_id: selectedClient!.id, type, name, data });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-data"] });
      toast.success("נשמר בהצלחה");
      closeDialog();
    },
    onError: () => toast.error("שגיאה בשמירה"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_data").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-data"] });
      toast.success("נמחק בהצלחה");
      setDeleteDialog({ open: false, item: null });
    },
    onError: () => toast.error("שגיאה במחיקה"),
  });

  const openDialog = (type: MarketingType, item?: MarketingItem) => {
    setDialogType(type);
    setSelectedItem(item || null);
    setFormName(item?.name || "");
    setFormData(item?.data || {});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
    setFormName("");
    setFormData({});
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error("נא להזין שם");
      return;
    }
    saveMutation.mutate({
      id: selectedItem?.id,
      type: dialogType,
      name: formName,
      data: formData,
    });
  };

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8">
          <PageHeader title="שיווק" description="בחר לקוח מהתפריט" />
          <div className="glass rounded-xl p-8 md:p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח</h3>
          </div>
        </div>
      </MainLayout>
    );
  }

  const renderDialogContent = () => {
    switch (dialogType) {
      case 'persona':
        return (
          <>
            <div className="space-y-2">
              <Label>שם הפרסונה</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="לדוגמה: שרה המנהלת" />
            </div>
            <div className="space-y-2">
              <Label>תפקיד</Label>
              <Input value={formData.occupation || ""} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>טווח גילאים</Label>
              <Input value={formData.age_range || ""} onChange={(e) => setFormData({ ...formData, age_range: e.target.value })} placeholder="25-35" />
            </div>
            <div className="space-y-2">
              <Label>תחומי עניין</Label>
              <Textarea value={formData.interests || ""} onChange={(e) => setFormData({ ...formData, interests: e.target.value })} placeholder="תחביבים, תחומי עניין..." />
            </div>
          </>
        );
      case 'brand_message':
        return (
          <>
            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="לדוגמה: ערך מותג" />
            </div>
            <div className="space-y-2">
              <Label>המסר</Label>
              <Textarea value={formData.message || ""} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={4} />
            </div>
          </>
        );
      case 'goal':
        return (
          <>
            <div className="space-y-2">
              <Label>שם היעד</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="לדוגמה: גידול במכירות" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ערך נוכחי</Label>
                <Input type="number" value={formData.current_value || ""} onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>יעד</Label>
                <Input type="number" value={formData.target_value || ""} onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>יחידה</Label>
              <Input value={formData.unit || ""} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="%, ₪, יח'..." />
            </div>
          </>
        );
      case 'competitor':
        return (
          <>
            <div className="space-y-2">
              <Label>שם המתחרה</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>אתר</Label>
              <Input value={formData.website || ""} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>חוזקות</Label>
              <Textarea value={formData.strengths || ""} onChange={(e) => setFormData({ ...formData, strengths: e.target.value })} placeholder="נקודות חוזק..." />
            </div>
            <div className="space-y-2">
              <Label>חולשות</Label>
              <Textarea value={formData.weaknesses || ""} onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })} placeholder="נקודות חולשה..." />
            </div>
          </>
        );
    }
  };

  const getDialogTitle = () => {
    const action = selectedItem ? "עריכת" : "הוספת";
    switch (dialogType) {
      case 'persona': return `${action} פרסונה`;
      case 'brand_message': return `${action} מסר`;
      case 'goal': return `${action} יעד`;
      case 'competitor': return `${action} מתחרה`;
    }
  };

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <PageHeader 
          title={`שיווק - ${selectedClient.name}`}
          description="פרסונות, מסרים, מתחרים ויעדים"
          actions={
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => openDialog('persona')}><Plus className="w-4 h-4 ml-1" />פרסונה</Button>
              <Button variant="outline" size="sm" onClick={() => openDialog('brand_message')}><Plus className="w-4 h-4 ml-1" />מסר</Button>
              <Button variant="outline" size="sm" onClick={() => openDialog('goal')}><Plus className="w-4 h-4 ml-1" />יעד</Button>
              <Button variant="outline" size="sm" onClick={() => openDialog('competitor')}><Plus className="w-4 h-4 ml-1" />מתחרה</Button>
            </div>
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Personas */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-primary" /><h2 className="text-xl font-bold">פרסונות</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {personas.map((persona) => (
                  <div key={persona.id} className="glass rounded-xl overflow-hidden card-shadow group">
                    <div className="h-2 bg-gradient-to-l from-primary to-primary/60" />
                    <div className="p-4 md:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">{persona.name}</h3>
                        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog('persona', persona)}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ open: true, item: persona })}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{persona.data.occupation}</p>
                      {persona.data.age_range && <p className="text-xs text-muted-foreground mt-1">גיל: {persona.data.age_range}</p>}
                    </div>
                  </div>
                ))}
                {personas.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">אין פרסונות עדיין</p>}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
              {/* Brand Messages */}
              <div className="glass rounded-xl card-shadow">
                <div className="p-4 md:p-6 border-b border-border flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /><h2 className="text-xl font-bold">מסרי מותג</h2></div>
                <div className="divide-y divide-border max-h-80 overflow-y-auto">
                  {brandMessages.map((msg) => (
                    <div key={msg.id} className="p-4 hover:bg-muted/30 group">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-primary">{msg.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={() => openDialog('brand_message', msg)}><Edit2 className="w-3 h-3" /></Button>
                      </div>
                      <p className="text-sm mt-1">{msg.data.message}</p>
                    </div>
                  ))}
                  {brandMessages.length === 0 && <p className="text-muted-foreground text-center py-8">אין מסרים עדיין</p>}
                </div>
              </div>

              {/* Goals */}
              <div className="glass rounded-xl card-shadow">
                <div className="p-4 md:p-6 border-b border-border flex items-center gap-2"><Target className="w-5 h-5 text-primary" /><h2 className="text-xl font-bold">יעדים</h2></div>
                <div className="p-4 md:p-6 space-y-6 max-h-80 overflow-y-auto">
                  {goals.map((goal) => {
                    const current = goal.data.current_value || 0;
                    const target = goal.data.target_value || 1;
                    const pct = (current / target) * 100;
                    return (
                      <div key={goal.id} className="group">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{goal.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{current}/{target}{goal.data.unit}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={() => openDialog('goal', goal)}><Edit2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full">
                          <div className={cn("h-full rounded-full transition-all", pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-destructive")} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {goals.length === 0 && <p className="text-muted-foreground text-center py-4">אין יעדים עדיין</p>}
                </div>
              </div>
            </div>

            {/* Competitors */}
            <section>
              <div className="flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-primary" /><h2 className="text-xl font-bold">מתחרים</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {competitors.map((c) => (
                  <div key={c.id} className="glass rounded-xl p-4 md:p-6 card-shadow group">
                    <div className="flex justify-between mb-4">
                      <h3 className="text-lg font-bold">{c.name}</h3>
                      <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog('competitor', c)}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ open: true, item: c })}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    {c.data.strengths && <p className="text-sm text-success mb-2">חוזקות: {c.data.strengths}</p>}
                    {c.data.weaknesses && <p className="text-sm text-destructive">חולשות: {c.data.weaknesses}</p>}
                  </div>
                ))}
                {competitors.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">אין מתחרים עדיין</p>}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {renderDialogContent()}
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
            <AlertDialogDescription>האם למחוק את "{deleteDialog.item?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog.item && deleteMutation.mutate(deleteDialog.item.id)} className="bg-destructive hover:bg-destructive/90">
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
