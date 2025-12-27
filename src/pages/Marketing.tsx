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
  Loader2,
  ExternalLink
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
import { PersonaDialog } from "@/components/marketing/PersonaDialog";
import { BrandMessageDialog } from "@/components/marketing/BrandMessageDialog";
import { GoalDialog } from "@/components/marketing/GoalDialog";
import { CompetitorDialog } from "@/components/marketing/CompetitorDialog";

export default function Marketing() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  
  const [personaDialogOpen, setPersonaDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [competitorDialogOpen, setCompetitorDialogOpen] = useState(false);
  
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<any>(null);
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; item: any }>({ open: false, type: "", item: null });

  const { data: personas = [], isLoading: loadingPersonas } = useQuery({
    queryKey: ["personas", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase.from("personas").select("*").eq("client_id", selectedClient.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  const { data: brandMessages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["brand-messages", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase.from("brand_messages").select("*").eq("client_id", selectedClient.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ["goals", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase.from("goals").select("*").eq("client_id", selectedClient.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  const { data: competitors = [], isLoading: loadingCompetitors } = useQuery({
    queryKey: ["competitors", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase.from("competitors").select("*").eq("client_id", selectedClient.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  // Mutations
  const personaMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await supabase.from("personas").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("personas").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
      toast.success("הפרסונה נשמרה בהצלחה");
      setPersonaDialogOpen(false);
      setSelectedPersona(null);
    },
    onError: () => toast.error("שגיאה בשמירת פרסונה"),
  });

  const messageMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await supabase.from("brand_messages").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("brand_messages").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-messages"] });
      toast.success("המסר נשמר בהצלחה");
      setMessageDialogOpen(false);
      setSelectedMessage(null);
    },
    onError: () => toast.error("שגיאה בשמירת מסר"),
  });

  const goalMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await supabase.from("goals").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("goals").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("היעד נשמר בהצלחה");
      setGoalDialogOpen(false);
      setSelectedGoal(null);
    },
    onError: () => toast.error("שגיאה בשמירת יעד"),
  });

  const competitorMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await supabase.from("competitors").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("competitors").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      toast.success("המתחרה נשמר בהצלחה");
      setCompetitorDialogOpen(false);
      setSelectedCompetitor(null);
    },
    onError: () => toast.error("שגיאה בשמירת מתחרה"),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const { error } = await supabase.from(type === "persona" ? "personas" : type === "goal" ? "goals" : "competitors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [deleteDialog.type === "persona" ? "personas" : deleteDialog.type === "goal" ? "goals" : "competitors"] });
      toast.success("נמחק בהצלחה");
      setDeleteDialog({ open: false, type: "", item: null });
    },
    onError: () => toast.error("שגיאה במחיקה"),
  });

  const handleSavePersona = (data: any) => personaMutation.mutate(selectedPersona?.id ? { ...data, id: selectedPersona.id } : data);
  const handleSaveMessage = (data: any) => messageMutation.mutate(selectedMessage?.id ? { ...data, id: selectedMessage.id } : data);
  const handleSaveGoal = (data: any) => goalMutation.mutate(selectedGoal?.id ? { ...data, id: selectedGoal.id } : data);
  const handleSaveCompetitor = (data: any) => competitorMutation.mutate(selectedCompetitor?.id ? { ...data, id: selectedCompetitor.id } : data);

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader title="שיווק" description="בחר לקוח מהתפריט" />
          <div className="glass rounded-xl p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח</h3>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isLoading = loadingPersonas || loadingMessages || loadingGoals || loadingCompetitors;

  return (
    <MainLayout>
      <div className="p-8">
        <PageHeader 
          title={`שיווק - ${selectedClient.name}`}
          description="פרסונות, מסרים, מתחרים ויעדים"
          actions={
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => { setSelectedPersona(null); setPersonaDialogOpen(true); }}><Plus className="w-4 h-4 ml-1" />פרסונה</Button>
              <Button variant="outline" size="sm" onClick={() => { setSelectedMessage(null); setMessageDialogOpen(true); }}><Plus className="w-4 h-4 ml-1" />מסר</Button>
              <Button variant="outline" size="sm" onClick={() => { setSelectedGoal(null); setGoalDialogOpen(true); }}><Plus className="w-4 h-4 ml-1" />יעד</Button>
              <Button variant="outline" size="sm" onClick={() => { setSelectedCompetitor(null); setCompetitorDialogOpen(true); }}><Plus className="w-4 h-4 ml-1" />מתחרה</Button>
            </div>
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-primary" /><h2 className="text-xl font-bold">פרסונות</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {personas.map((persona: any) => (
                  <div key={persona.id} className="glass rounded-xl overflow-hidden card-shadow group">
                    <div className="h-2 bg-gradient-to-l from-primary to-primary/60" />
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">{persona.name}</h3>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedPersona(persona); setPersonaDialogOpen(true); }}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ open: true, type: "persona", item: persona })}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{persona.occupation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="glass rounded-xl card-shadow">
                <div className="p-6 border-b border-border flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /><h2 className="text-xl font-bold">מסרי מותג</h2></div>
                <div className="divide-y divide-border">
                  {brandMessages.map((msg: any) => (
                    <div key={msg.id} className="p-4 hover:bg-muted/30 group">
                      <div className="flex justify-between"><span className="text-sm font-medium text-primary">{msg.category}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => { setSelectedMessage(msg); setMessageDialogOpen(true); }}><Edit2 className="w-3 h-3" /></Button>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-xl card-shadow">
                <div className="p-6 border-b border-border flex items-center gap-2"><Target className="w-5 h-5 text-primary" /><h2 className="text-xl font-bold">יעדים</h2></div>
                <div className="p-6 space-y-6">
                  {goals.map((goal: any) => {
                    const pct = goal.target_value > 0 ? ((goal.current_value || 0) / goal.target_value) * 100 : 0;
                    return (
                      <div key={goal.id} className="group">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{goal.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{goal.current_value || 0}/{goal.target_value}{goal.unit}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => { setSelectedGoal(goal); setGoalDialogOpen(true); }}><Edit2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full"><div className={cn("h-full rounded-full", pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-destructive")} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <section>
              <div className="flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-primary" /><h2 className="text-xl font-bold">מתחרים</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {competitors.map((c: any) => (
                  <div key={c.id} className="glass rounded-xl p-6 card-shadow group">
                    <div className="flex justify-between mb-4">
                      <h3 className="text-lg font-bold">{c.name}</h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedCompetitor(c); setCompetitorDialogOpen(true); }}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog({ open: true, type: "competitor", item: c })}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    {c.strengths?.map((s: string) => <span key={s} className="px-2 py-1 bg-success/10 text-success text-xs rounded-full mr-1">{s}</span>)}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <PersonaDialog open={personaDialogOpen} onOpenChange={setPersonaDialogOpen} persona={selectedPersona} clientId={selectedClient?.id || ""} onSave={handleSavePersona} isLoading={personaMutation.isPending} />
      <BrandMessageDialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen} message={selectedMessage} clientId={selectedClient?.id || ""} onSave={handleSaveMessage} isLoading={messageMutation.isPending} />
      <GoalDialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen} goal={selectedGoal} clientId={selectedClient?.id || ""} onSave={handleSaveGoal} isLoading={goalMutation.isPending} />
      <CompetitorDialog open={competitorDialogOpen} onOpenChange={setCompetitorDialogOpen} competitor={selectedCompetitor} clientId={selectedClient?.id || ""} onSave={handleSaveCompetitor} isLoading={competitorMutation.isPending} />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>אישור מחיקה</AlertDialogTitle><AlertDialogDescription>האם למחוק את "{deleteDialog.item?.name}"?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate({ type: deleteDialog.type, id: deleteDialog.item?.id })} className="bg-destructive hover:bg-destructive/90">מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}