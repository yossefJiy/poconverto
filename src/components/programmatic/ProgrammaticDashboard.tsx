import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, DollarSign, Target, MousePointer, Eye } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  clientId?: string;
}

export function ProgrammaticDashboard({ clientId }: Props) {
  const { data: placements = [] } = useQuery({
    queryKey: ["ad-placements", clientId],
    queryFn: async () => {
      const query = supabase
        .from("ad_placements")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (clientId) {
        query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const { data: budgetRules = [] } = useQuery({
    queryKey: ["budget-rules", clientId],
    queryFn: async () => {
      const query = supabase
        .from("budget_rules")
        .select("*")
        .eq("is_active", true);
      
      if (clientId) {
        query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const totalSpend = placements.reduce((sum, p) => sum + (p.daily_budget || 0), 0);
  const activePlacements = placements.filter(p => p.status === "active").length;

  // Mock chart data
  const chartData = Array.from({ length: 7 }, (_, i) => ({
    day: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"][i],
    spend: Math.random() * 1000 + 500,
    conversions: Math.floor(Math.random() * 50 + 10),
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">הוצאה יומית</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{totalSpend.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 ml-1" />
              +12% מאתמול
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">מיקומים פעילים</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlacements}</div>
            <p className="text-xs text-muted-foreground">מתוך {placements.length} מיקומים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">כללים פעילים</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetRules.length}</div>
            <p className="text-xs text-muted-foreground">כללי אופטימיזציה</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">חשיפות</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">125K</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 ml-1" />
              +8% מאתמול
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ביצועים שבועיים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="spend" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.2)" 
                  name="הוצאה (₪)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
