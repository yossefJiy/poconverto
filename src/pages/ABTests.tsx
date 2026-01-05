import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Play, Pause, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { ABTestManager } from "@/components/programmatic/ABTestManager";
import { CreateABTestDialog } from "@/components/programmatic/CreateABTestDialog";

export default function ABTests() {
  const { selectedClient } = useClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ["ab-tests", selectedClient?.id],
    queryFn: async () => {
      const query = supabase
        .from("ab_tests")
        .select("*, campaigns(name)")
        .order("created_at", { ascending: false });
      
      if (selectedClient?.id) {
        query.eq("client_id", selectedClient.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient?.id,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("ab_tests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ab-tests"] });
      toast.success("סטטוס עודכן בהצלחה");
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "outline", label: "טיוטה" },
      running: { variant: "default", label: "פעיל" },
      paused: { variant: "secondary", label: "מושהה" },
      completed: { variant: "default", label: "הושלם" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">בדיקות A/B</h1>
            <p className="text-muted-foreground">נהל ניסויים להשוואת ביצועים</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 ml-2" />
            ניסוי חדש
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-20 bg-muted/50" />
                <CardContent className="h-32 bg-muted/30" />
              </Card>
            ))}
          </div>
        ) : tests.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין בדיקות A/B</h3>
            <p className="text-muted-foreground mb-4">צור את הניסוי הראשון שלך</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 ml-2" />
              צור ניסוי
            </Button>
          </Card>
        ) : (
          <ABTestManager tests={tests} onStatusChange={updateStatus.mutate} />
        )}

        <CreateABTestDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog}
          clientId={selectedClient?.id}
        />
      </div>
    </MainLayout>
  );
}
