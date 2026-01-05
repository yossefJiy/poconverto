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
import { Edit2, Save, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface Props {
  clientId?: string;
}

export function BidManagement({ clientId }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBid, setEditBid] = useState<number>(0);
  const [maxIncrease, setMaxIncrease] = useState([20]);
  const [maxDecrease, setMaxDecrease] = useState([15]);
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
    onError: () => {
      toast.error("שגיאה בעדכון הצעת מחיר");
    },
  });

  const handleSave = (id: string) => {
    updateBid.mutate({ id, bid_amount: editBid });
  };

  const handleIncreaseChange = (value: number[]) => {
    setMaxIncrease(value);
    toast.success(`העלאה מקסימלית הוגדרה ל-${value[0]}%`);
  };

  const handleDecreaseChange = (value: number[]) => {
    setMaxDecrease(value);
    toast.success(`הורדה מקסימלית הוגדרה ל-${value[0]}%`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ניהול הצעות מחיר</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : placements.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">אין מיקומי פרסום פעילים</p>
              <p className="text-sm text-muted-foreground mt-1">הוסף מיקומי פרסום כדי לנהל הצעות מחיר</p>
            </div>
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
                      {(placement.campaigns as { name?: string } | null)?.name || "-"}
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
                          {updateBid.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
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
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>העלאה מקסימלית</Label>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="font-medium text-success">{maxIncrease[0]}%</span>
              </div>
            </div>
            <Slider 
              value={maxIncrease} 
              onValueChange={handleIncreaseChange}
              max={100} 
              step={5} 
            />
            <p className="text-xs text-muted-foreground">
              הגדר עד כמה המערכת יכולה להעלות את ההצעה באופן אוטומטי
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>הורדה מקסימלית</Label>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <span className="font-medium text-destructive">{maxDecrease[0]}%</span>
              </div>
            </div>
            <Slider 
              value={maxDecrease} 
              onValueChange={handleDecreaseChange}
              max={100} 
              step={5} 
            />
            <p className="text-xs text-muted-foreground">
              הגדר עד כמה המערכת יכולה להוריד את ההצעה באופן אוטומטי
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
