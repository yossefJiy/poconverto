import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Zap, Play, Pause, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface Props {
  clientId?: string;
}

export function PlacementOptimizer({ clientId }: Props) {
  const queryClient = useQueryClient();

  const { data: placements = [], isLoading } = useQuery({
    queryKey: ["placements-optimizer", clientId],
    queryFn: async () => {
      const query = supabase
        .from("ad_placements")
        .select("*, campaigns(name)")
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

  const togglePlacement = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("ad_placements")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["placements-optimizer"] });
      toast.success("סטטוס עודכן");
    },
  });

  // Mock performance data
  const getPerformanceScore = () => Math.floor(Math.random() * 100);
  const getPerformanceTrend = () => (Math.random() > 0.5 ? "up" : "down");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              המלצות אופטימיזציה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-400">
                    3 מיקומים עם ביצועים נמוכים
                  </p>
                  <p className="text-sm text-muted-foreground">
                    שקול להשהות מיקומים אלה או להוריד את ההצעה
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    2 מיקומים מומלצים להרחבה
                  </p>
                  <p className="text-sm text-muted-foreground">
                    מיקומים אלה מראים ROI גבוה - שקול להגדיל תקציב
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>הגדרות אופטימיזציה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">השהה מיקומים בעלי CTR נמוך</p>
                <p className="text-sm text-muted-foreground">CTR מתחת ל-0.5%</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">הגדל הצעה במיקומים מצליחים</p>
                <p className="text-sm text-muted-foreground">עד 20% מעל ההצעה הנוכחית</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">דוחות יומיים</p>
                <p className="text-sm text-muted-foreground">קבל עדכון על ביצועי מיקומים</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>מיקומי פרסום</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : placements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              אין מיקומי פרסום
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מיקום</TableHead>
                  <TableHead>פלטפורמה</TableHead>
                  <TableHead>ציון ביצועים</TableHead>
                  <TableHead>מגמה</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placements.map((placement) => {
                  const score = getPerformanceScore();
                  const trend = getPerformanceTrend();
                  
                  return (
                    <TableRow key={placement.id}>
                      <TableCell className="font-medium">
                        {placement.placement_name || placement.placement_type}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{placement.platform}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={score} className="w-20" />
                          <span className="text-sm font-mono">{score}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={placement.status === "active" ? "default" : "secondary"}
                        >
                          {placement.status === "active" ? "פעיל" : "מושהה"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => 
                            togglePlacement.mutate({
                              id: placement.id,
                              status: placement.status === "active" ? "paused" : "active"
                            })
                          }
                        >
                          {placement.status === "active" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
