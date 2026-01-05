import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Plus, Trash2, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CreateRuleDialog } from "./CreateRuleDialog";

interface Props {
  clientId?: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#10b981", "#f59e0b", "#ef4444"];

export function BudgetAllocator({ clientId }: Props) {
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [limitDailySpend, setLimitDailySpend] = useState(false);
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ["budget-rules", clientId],
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

  const { data: placements = [] } = useQuery({
    queryKey: ["placements-budget", clientId],
    queryFn: async () => {
      const query = supabase
        .from("ad_placements")
        .select("platform, daily_budget")
        .eq("status", "active");
      
      if (clientId) {
        query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
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
      queryClient.invalidateQueries({ queryKey: ["budget-rules"] });
      toast.success("כלל עודכן");
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
      queryClient.invalidateQueries({ queryKey: ["budget-rules"] });
      toast.success("כלל נמחק");
    },
  });

  const handleAutoOptimizeChange = (checked: boolean) => {
    setAutoOptimize(checked);
    toast.success(checked ? "אופטימיזציה אוטומטית הופעלה" : "אופטימיזציה אוטומטית הושבתה");
  };

  const handleLimitSpendChange = (checked: boolean) => {
    setLimitDailySpend(checked);
    toast.success(checked ? "הגבלת הוצאה יומית הופעלה" : "הגבלת הוצאה יומית הושבתה");
  };

  // Aggregate budget by platform
  const budgetByPlatform = placements.reduce((acc, p) => {
    const platform = p.platform || "other";
    acc[platform] = (acc[platform] || 0) + (p.daily_budget || 0);
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(budgetByPlatform).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>חלוקת תקציב לפי פלטפורמה</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                  <Zap className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">אין נתוני תקציב</p>
                <p className="text-sm text-muted-foreground mt-1">הוסף מיקומי פרסום כדי לראות חלוקה</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => 
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₪${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>כללי הקצאה</CardTitle>
            <Button size="sm" onClick={() => setShowCreateRule(true)}>
              <Plus className="h-4 w-4 ml-1" />
              חדש
            </Button>
          </CardHeader>
          <CardContent>
            {rulesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">אין כללי הקצאה</p>
                <p className="text-sm text-muted-foreground mt-1">צור כלל ראשון לניהול תקציבים אוטומטי</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div 
                    key={rule.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => 
                          toggleRule.mutate({ id: rule.id, is_active: checked })
                        }
                      />
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {rule.rule_type}
                        </p>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            אופטימיזציה אוטומטית
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>העבר תקציב מקמפיינים בעלי ביצועים נמוכים</Label>
              <p className="text-sm text-muted-foreground">
                המערכת תעביר תקציב אוטומטית לקמפיינים עם ROAS גבוה
              </p>
            </div>
            <Switch 
              checked={autoOptimize}
              onCheckedChange={handleAutoOptimizeChange}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>הגבל הוצאה יומית</Label>
              <p className="text-sm text-muted-foreground">
                עצור קמפיינים שמגיעים ל-80% מהתקציב היומי
              </p>
            </div>
            <Switch 
              checked={limitDailySpend}
              onCheckedChange={handleLimitSpendChange}
            />
          </div>
        </CardContent>
      </Card>

      <CreateRuleDialog 
        open={showCreateRule} 
        onOpenChange={setShowCreateRule}
        clientId={clientId}
      />
    </div>
  );
}
