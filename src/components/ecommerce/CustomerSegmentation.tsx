import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Eye, Trash2, TrendingUp, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  clientId?: string;
}

export function CustomerSegmentation({ clientId }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [newSegment, setNewSegment] = useState({
    name: "",
    description: "",
    segment_type: "custom",
  });
  const queryClient = useQueryClient();

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ["customer-segments-ecom", clientId],
    queryFn: async () => {
      const query = supabase
        .from("customer_segments")
        .select("*")
        .order("customer_count", { ascending: false });
      
      if (clientId) {
        query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const createSegment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("customer_segments").insert({
        client_id: clientId,
        ...newSegment,
        customer_count: 0,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-segments-ecom"] });
      setShowCreate(false);
      setNewSegment({ name: "", description: "", segment_type: "custom" });
      toast.success("סגמנט נוצר בהצלחה");
    },
  });

  const deleteSegment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customer_segments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-segments-ecom"] });
      toast.success("סגמנט נמחק");
    },
  });

  // Default segments to show if none exist
  const defaultSegments = [
    { id: "1", name: "לקוחות VIP", description: "לקוחות עם 5+ רכישות", customer_count: 342, avg_order_value: 450, total_revenue: 153900, segment_type: "behavioral" },
    { id: "2", name: "נטשו עגלה", description: "הוסיפו לעגלה אך לא רכשו", customer_count: 1205, avg_order_value: 280, total_revenue: 0, segment_type: "behavioral" },
    { id: "3", name: "לקוחות חדשים", description: "רכשו פעם אחת ב-30 ימים אחרונים", customer_count: 567, avg_order_value: 180, total_revenue: 102060, segment_type: "demographic" },
    { id: "4", name: "לקוחות לא פעילים", description: "לא רכשו 90+ ימים", customer_count: 892, avg_order_value: 320, total_revenue: 285440, segment_type: "behavioral" },
  ];

  const displaySegments = segments.length > 0 ? segments : defaultSegments;
  const totalCustomers = displaySegments.reduce((sum, s) => sum + (s.customer_count || 0), 0);
  const totalRevenue = displaySegments.reduce((sum, s) => sum + (s.total_revenue || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">סה"כ לקוחות</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">ב-{displaySegments.length} סגמנטים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">הכנסה כוללת</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">מכל הסגמנטים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ממוצע להזמנה</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₪{Math.round(totalRevenue / totalCustomers || 0)}
            </div>
            <p className="text-xs text-muted-foreground">AOV ממוצע</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>סגמנטים של לקוחות</CardTitle>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-1" />
                סגמנט חדש
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>צור סגמנט חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>שם הסגמנט</Label>
                  <Input
                    value={newSegment.name}
                    onChange={(e) => setNewSegment({ ...newSegment, name: e.target.value })}
                    placeholder="לדוגמה: לקוחות חוזרים"
                  />
                </div>
                <div>
                  <Label>תיאור</Label>
                  <Textarea
                    value={newSegment.description}
                    onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
                    placeholder="תאר את הקריטריונים לסגמנט"
                    rows={3}
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createSegment.mutate()}
                  disabled={!newSegment.name || createSegment.isPending}
                >
                  צור סגמנט
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {displaySegments.map((segment) => (
                <Card key={segment.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{segment.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{segment.description}</p>
                      </div>
                      <Badge variant="outline">{segment.segment_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">{(segment.customer_count || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">לקוחות</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">₪{segment.avg_order_value || 0}</p>
                        <p className="text-xs text-muted-foreground">AOV</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">₪{((segment.total_revenue || 0) / 1000).toFixed(0)}K</p>
                        <p className="text-xs text-muted-foreground">הכנסה</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-4 w-4 ml-1" />
                        צפה
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteSegment.mutate(segment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
