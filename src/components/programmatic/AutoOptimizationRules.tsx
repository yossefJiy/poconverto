import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Zap, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Props {
  clientId?: string;
}

export function AutoOptimizationRules({ clientId }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    rule_type: "budget",
    conditions: [] as any[],
    actions: [] as any[],
  });
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["optimization-rules", clientId],
    queryFn: async () => {
      const query = supabase
        .from("budget_rules")
        .select("*")
        .order("priority", { ascending: true });
      
      if (clientId) {
        query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const createRule = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("budget_rules")
        .insert({
          client_id: clientId,
          name: newRule.name,
          rule_type: newRule.rule_type,
          conditions: newRule.conditions,
          actions: newRule.actions,
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["optimization-rules"] });
      setShowCreate(false);
      setNewRule({ name: "", rule_type: "budget", conditions: [], actions: [] });
      toast.success("כלל נוצר בהצלחה");
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("budget_rules")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["optimization-rules"] });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("budget_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["optimization-rules"] });
      toast.success("כלל נמחק");
    },
  });

  const ruleTypeLabels: Record<string, string> = {
    budget: "תקציב",
    bid: "הצעת מחיר",
    placement: "מיקום",
    schedule: "תזמון",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              כללי אופטימיזציה אוטומטית
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              הגדר כללים שיפעלו אוטומטית על הקמפיינים
            </p>
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-1" />
                כלל חדש
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>צור כלל אופטימיזציה</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>שם הכלל</Label>
                  <Input
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="לדוגמה: הפחת הצעה ב-CTR נמוך"
                  />
                </div>
                <div>
                  <Label>סוג כלל</Label>
                  <Select
                    value={newRule.rule_type}
                    onValueChange={(value) => setNewRule({ ...newRule, rule_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">תקציב</SelectItem>
                      <SelectItem value="bid">הצעת מחיר</SelectItem>
                      <SelectItem value="placement">מיקום</SelectItem>
                      <SelectItem value="schedule">תזמון</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createRule.mutate()}
                  disabled={!newRule.name || createRule.isPending}
                >
                  צור כלל
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">אין כללים מוגדרים</h3>
              <p className="text-muted-foreground mb-4">
                צור את הכלל הראשון שלך לאופטימיזציה אוטומטית
              </p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 ml-1" />
                צור כלל
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div 
                  key={rule.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => 
                        toggleRule.mutate({ id: rule.id, is_active: checked })
                      }
                    />
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {ruleTypeLabels[rule.rule_type] || rule.rule_type}
                        </Badge>
                        {rule.trigger_count > 0 && (
                          <span className="text-xs text-muted-foreground">
                            הופעל {rule.trigger_count} פעמים
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "פעיל" : "מושבת"}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteRule.mutate(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>כללים מובנים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">השהה קמפיינים עם ROAS שלילי</p>
              <p className="text-sm text-muted-foreground">
                קמפיין עם ROAS מתחת ל-1 למשך 7 ימים יושהה אוטומטית
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">העלה תקציב בקמפיינים מצליחים</p>
              <p className="text-sm text-muted-foreground">
                קמפיין עם ROAS מעל 3 יקבל 20% תקציב נוסף
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">כיבוי אוטומטי בסוף שבוע</p>
              <p className="text-sm text-muted-foreground">
                השהה קמפיינים B2B בימי שישי-שבת
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
