import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatILS } from "@/lib/dateUtils";
import { format, startOfMonth, endOfMonth } from "date-fns";

const sourceLabels: Record<string, string> = {
  branch: "סניף",
  fairs: "יריד",
  phone: "טלפון",
  wholesale: "סיטונאי",
  other: "אחר",
};

export default function OfflineRevenue() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [newEntry, setNewEntry] = useState({ date: format(new Date(), "yyyy-MM-dd"), source: "branch", amount: "", notes: "" });

  const monthStart = format(startOfMonth(new Date(month + "-01")), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date(month + "-01")), "yyyy-MM-dd");

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["offline-revenue", selectedClient?.id, monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_offline_revenue")
        .select("*")
        .eq("client_id", selectedClient!.id)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClient,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(newEntry.amount);
      if (!amount || !selectedClient) throw new Error("חסרים פרטים");
      const { error } = await supabase.from("daily_offline_revenue").upsert({
        client_id: selectedClient.id,
        date: newEntry.date,
        source: newEntry.source,
        amount_original: amount,
        currency_original: "ILS",
        amount_reporting: amount,
        notes: newEntry.notes || null,
      }, { onConflict: "client_id,date,source" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offline-revenue"] });
      queryClient.invalidateQueries({ queryKey: ["daily-offline"] });
      setNewEntry({ ...newEntry, amount: "", notes: "" });
      toast.success("נוסף בהצלחה");
    },
    onError: () => toast.error("שגיאה בשמירה"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_offline_revenue").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offline-revenue"] });
      queryClient.invalidateQueries({ queryKey: ["daily-offline"] });
      toast.success("נמחק");
    },
  });

  const monthTotal = entries.reduce((s: number, e: any) => s + (e.amount_reporting || 0), 0);

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader title="הכנסות אופליין" description="בחר לקוח" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        <PageHeader title="הכנסות אופליין" description={`הזנה ידנית — ${selectedClient.name}`} />

        <div className="flex items-center gap-3">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[180px] h-9" />
          <Card className="px-4 py-2">
            <span className="text-sm text-muted-foreground ml-2">סה״כ החודש:</span>
            <span className="font-bold text-lg">{formatILS(monthTotal)}</span>
          </Card>
        </div>

        {/* Add Entry */}
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4" />
              הוספת שורה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="text-xs text-muted-foreground">תאריך</label>
                <Input type="date" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} className="w-[160px] h-9" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">מקור</label>
                <Select value={newEntry.source} onValueChange={(v) => setNewEntry({ ...newEntry, source: v })}>
                  <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(sourceLabels).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">סכום (₪)</label>
                <Input type="number" value={newEntry.amount} onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })} className="w-[120px] h-9" placeholder="0" />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs text-muted-foreground">הערות</label>
                <Input value={newEntry.notes} onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })} className="h-9" placeholder="אופציונלי" />
              </div>
              <Button onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !newEntry.amount} className="h-9">
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 ml-1" />}
                הוסף
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Entries Table */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : entries.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground">
            <Wallet className="w-10 h-10 mx-auto mb-3 opacity-50" />
            אין נתונים לחודש זה
          </div>
        ) : (
          <div className="glass rounded-xl card-shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">תאריך</TableHead>
                  <TableHead className="text-right">מקור</TableHead>
                  <TableHead className="text-right">סכום</TableHead>
                  <TableHead className="text-right">הערות</TableHead>
                  <TableHead className="text-right w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.date}</TableCell>
                    <TableCell>{sourceLabels[e.source] || e.source}</TableCell>
                    <TableCell className="font-mono font-medium">{formatILS(e.amount_reporting || 0)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{e.notes || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(e.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
