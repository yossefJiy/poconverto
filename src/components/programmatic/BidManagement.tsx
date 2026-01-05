import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, TrendingDown, Edit2, Save } from "lucide-react";
import { toast } from "sonner";

interface Props {
  clientId?: string;
}

export function BidManagement({ clientId }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBid, setEditBid] = useState<number>(0);
  const queryClient = useQueryClient();

  const { data: placements = [], isLoading } = useQuery({
    queryKey: ["ad-placements-bids", clientId],
    queryFn: async () => {
      const query = supabase
        .from("ad_placements")
        .select("*, campaigns(name)")
        .order("bid_amount", { ascending: false });
      
      if (clientId) {
        query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const updateBid = useMutation({
    mutationFn: async ({ id, bid_amount }: { id: string; bid_amount: number }) => {
      const { error } = await supabase
        .from("ad_placements")
        .update({ bid_amount })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-placements-bids"] });
      setEditingId(null);
      toast.success("הצעת מחיר עודכנה");
    },
  });

  const handleSave = (id: string) => {
    updateBid.mutate({ id, bid_amount: editBid });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ניהול הצעות מחיר</CardTitle>
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
              אין מיקומי פרסום פעילים
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מיקום</TableHead>
                  <TableHead>קמפיין</TableHead>
                  <TableHead>פלטפורמה</TableHead>
                  <TableHead>הצעת מחיר</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placements.map((placement) => (
                  <TableRow key={placement.id}>
                    <TableCell className="font-medium">
                      {placement.placement_name || placement.placement_type}
                    </TableCell>
                    <TableCell>
                      {(placement.campaigns as any)?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{placement.platform}</Badge>
                    </TableCell>
                    <TableCell>
                      {editingId === placement.id ? (
                        <Input
                          type="number"
                          value={editBid}
                          onChange={(e) => setEditBid(Number(e.target.value))}
                          className="w-24"
                        />
                      ) : (
                        <span className="font-mono">
                          ₪{(placement.bid_amount || 0).toFixed(2)}
                        </span>
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
                      {editingId === placement.id ? (
                        <Button 
                          size="sm" 
                          onClick={() => handleSave(placement.id)}
                          disabled={updateBid.isPending}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingId(placement.id);
                            setEditBid(placement.bid_amount || 0);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>כללי התאמה אוטומטית</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>העלאה מקסימלית (%)</Label>
            <Slider defaultValue={[20]} max={100} step={5} />
            <p className="text-xs text-muted-foreground">
              הגדר עד כמה המערכת יכולה להעלות את ההצעה באופן אוטומטי
            </p>
          </div>
          <div className="space-y-2">
            <Label>הורדה מקסימלית (%)</Label>
            <Slider defaultValue={[15]} max={100} step={5} />
            <p className="text-xs text-muted-foreground">
              הגדר עד כמה המערכת יכולה להוריד את ההצעה באופן אוטומטי
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
