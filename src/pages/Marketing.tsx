import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Target, 
  TrendingUp, 
  MessageSquare,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Loader2
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
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Marketing() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);

  const { data: personas = [], isLoading: loadingPersonas } = useQuery({
    queryKey: ["personas", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("personas")
        .select("*")
        .eq("client_id", selectedClient.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  const { data: brandMessages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["brand-messages", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("brand_messages")
        .select("*")
        .eq("client_id", selectedClient.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ["goals", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("client_id", selectedClient.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  const { data: competitors = [], isLoading: loadingCompetitors } = useQuery({
    queryKey: ["competitors", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("competitors")
        .select("*")
        .eq("client_id", selectedClient.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader title="שיווק" description="בחר לקוח מהתפריט כדי לראות אסטרטגיית שיווק" />
          <div className="glass rounded-xl p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח</h3>
            <p className="text-muted-foreground">בחר לקוח מהתפריט הצדדי כדי לראות את אסטרטגיית השיווק שלו</p>
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPersonaDialog(true)}>
                <Plus className="w-4 h-4 ml-1" />
                פרסונה
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowMessageDialog(true)}>
                <Plus className="w-4 h-4 ml-1" />
                מסר
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowGoalDialog(true)}>
                <Plus className="w-4 h-4 ml-1" />
                יעד
              </Button>
            </div>
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Personas */}
            <section className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">פרסונות</h2>
              </div>
              {personas.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <p className="text-muted-foreground">לא הוגדרו פרסונות עדיין</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {personas.map((persona, index) => (
                    <div 
                      key={persona.id}
                      className="glass rounded-xl overflow-hidden card-shadow opacity-0 animate-slide-up"
                      style={{ animationDelay: `${0.1 + index * 0.1}s`, animationFillMode: "forwards" }}
                    >
                      <div className="h-2 bg-gradient-to-l from-primary to-primary/60" />
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold">{persona.name}</h3>
                          <span className="text-sm text-muted-foreground">{persona.age_range}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{persona.occupation}</p>
                        
                        {persona.goals && persona.goals.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-2">מטרות</p>
                            <div className="flex flex-wrap gap-2">
                              {persona.goals.map((goal: string) => (
                                <span key={goal} className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                                  {goal}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {persona.pain_points && persona.pain_points.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">כאבים</p>
                            <div className="flex flex-wrap gap-2">
                              {persona.pain_points.map((point: string) => (
                                <span key={point} className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full">
                                  {point}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Brand Messages & Goals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Brand Messages */}
              <div className="glass rounded-xl card-shadow">
                <div className="p-6 border-b border-border flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">מסרי מותג</h2>
                </div>
                {brandMessages.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">לא הוגדרו מסרים עדיין</div>
                ) : (
                  <div className="divide-y divide-border">
                    {brandMessages.map((msg) => (
                      <div key={msg.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-primary">{msg.category}</span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Goals Progress */}
              <div className="glass rounded-xl card-shadow">
                <div className="p-6 border-b border-border flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-bold">יעדים מול מצב בפועל</h2>
                </div>
                {goals.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">לא הוגדרו יעדים עדיין</div>
                ) : (
                  <div className="p-6 space-y-6">
                    {goals.map((goal) => {
                      const percentage = goal.target_value > 0 
                        ? ((goal.current_value || 0) / goal.target_value) * 100 
                        : 0;
                      return (
                        <div key={goal.id}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{goal.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {(goal.current_value || 0).toLocaleString()}{goal.unit} / {goal.target_value.toLocaleString()}{goal.unit}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                percentage >= 80 ? "bg-success" : percentage >= 50 ? "bg-warning" : "bg-destructive"
                              )}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Competitors */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">ניתוח מתחרים</h2>
              </div>
              {competitors.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <p className="text-muted-foreground">לא הוגדרו מתחרים עדיין</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {competitors.map((competitor, index) => (
                    <div 
                      key={competitor.id}
                      className="glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up"
                      style={{ animationDelay: `${0.3 + index * 0.1}s`, animationFillMode: "forwards" }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold">{competitor.name}</h3>
                      </div>
                      
                      {competitor.strengths && competitor.strengths.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground mb-2">חוזקות</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {competitor.strengths.map((s: string) => (
                              <span key={s} className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">חולשות</p>
                          <div className="flex flex-wrap gap-2">
                            {competitor.weaknesses.map((w: string) => (
                              <span key={w} className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full">
                                {w}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </MainLayout>
  );
}
