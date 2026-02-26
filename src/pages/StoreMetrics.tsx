import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDateRange, formatILS, formatNum, type DatePreset } from "@/lib/dateUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShoppingCart, Store, DollarSign, TrendingDown, Plug, ArrowRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function StoreMetrics() {
  const { selectedClient } = useClient();
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const range = getDateRange(datePreset);

  const { data: siteData = [], isLoading, refetch } = useQuery({
    queryKey: ["store-metrics", selectedClient?.id, range.from, range.to],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("daily_site_metrics")
        .select("*")
        .eq("client_id", selectedClient.id)
        .gte("date", range.from)
        .lte("date", range.to)
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClient,
  });

  const handleRefresh = async () => {
    if (!selectedClient) return;
    setIsRefreshing(true);
    try {
      await supabase.functions.invoke("sync-daily", {
        body: {
          client_id: selectedClient.id,
          date_from: range.from,
          date_to: range.to,
          platforms: ["shopify", "woocommerce"],
        },
      });
      await refetch();
      toast.success("נתוני החנות עודכנו");
    } catch {
      toast.error("שגיאה בסנכרון");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Aggregate totals
  const totals = siteData.reduce(
    (acc, row) => ({
      orders: acc.orders + (row.orders || 0),
      gross_sales: acc.gross_sales + (row.gross_sales || 0),
      discounts: acc.discounts + (row.discounts || 0),
      refunds: acc.refunds + (row.refunds || 0),
      net_sales: acc.net_sales + (row.net_sales_reporting || 0),
    }),
    { orders: 0, gross_sales: 0, discounts: 0, refunds: 0, net_sales: 0 }
  );

  const aov = totals.orders > 0 ? totals.net_sales / totals.orders : 0;
  const platforms = [...new Set(siteData.map(r => r.store_platform))];

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader title="הכנסות מהאתר" description="בחר לקוח כדי לצפות בנתונים" />
          <div className="glass rounded-xl p-12 text-center">
            <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח כדי להתחיל</h3>
            <ArrowRight className="w-5 h-5 mx-auto mt-4 text-primary animate-pulse" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageHeader title="הכנסות מהאתר" description={`Shopify / WooCommerce — ${selectedClient.name}`} />
          <div className="flex items-center gap-2">
            <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 ימים</SelectItem>
                <SelectItem value="14d">14 ימים</SelectItem>
                <SelectItem value="30d">30 ימים</SelectItem>
                <SelectItem value="mtd">החודש</SelectItem>
                <SelectItem value="ytd">השנה</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : siteData.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">אין נתוני חנות</h3>
            <p className="text-muted-foreground mb-4">
              וודא שאינטגרציית Shopify או WooCommerce מחוברת עם credentials בהגדרות הלקוח
            </p>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className="w-4 h-4 ml-2" />
              נסה לסנכרן
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Platform badges */}
            <div className="flex gap-2">
              {platforms.map(p => (
                <Badge key={p} variant="secondary" className="text-sm py-1 px-3 capitalize">
                  {p === "shopify" ? "🛒 Shopify" : p === "woocommerce" ? "🏪 WooCommerce" : p}
                </Badge>
              ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KPICard label="הזמנות" value={formatNum(totals.orders)} icon={<ShoppingCart className="w-5 h-5" />} />
              <KPICard label="מכירות ברוטו" value={formatILS(totals.gross_sales)} icon={<DollarSign className="w-5 h-5" />} />
              <KPICard label="הנחות" value={formatILS(totals.discounts)} icon={<TrendingDown className="w-5 h-5" />} negative />
              <KPICard label="החזרים" value={formatILS(totals.refunds)} icon={<TrendingDown className="w-5 h-5" />} negative />
              <KPICard label="מכירות נטו" value={formatILS(totals.net_sales)} icon={<Store className="w-5 h-5" />} highlight />
            </div>

            {/* AOV */}
            <Card className="glass">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">סל ממוצע (AOV)</span>
                  <span className="text-xl font-bold">{formatILS(aov)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Daily table */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">נתונים יומיים</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">תאריך</TableHead>
                        <TableHead className="text-right">פלטפורמה</TableHead>
                        <TableHead className="text-right">הזמנות</TableHead>
                        <TableHead className="text-right">ברוטו</TableHead>
                        <TableHead className="text-right">הנחות</TableHead>
                        <TableHead className="text-right">החזרים</TableHead>
                        <TableHead className="text-right">נטו</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {siteData.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{new Date(row.date).toLocaleDateString("he-IL")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-xs">
                              {row.store_platform}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.orders || 0}</TableCell>
                          <TableCell>{formatILS(row.gross_sales || 0)}</TableCell>
                          <TableCell className="text-destructive">{formatILS(row.discounts || 0)}</TableCell>
                          <TableCell className="text-destructive">{formatILS(row.refunds || 0)}</TableCell>
                          <TableCell className="font-medium">{formatILS(row.net_sales_reporting || 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function KPICard({ label, value, icon, highlight, negative }: { label: string; value: string; icon?: React.ReactNode; highlight?: boolean; negative?: boolean }) {
  return (
    <div className={cn(
      "rounded-lg p-4 transition-all",
      highlight ? "bg-primary/10 border border-primary/30" : "bg-muted/50"
    )}>
      {icon && (
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center mb-2",
          negative ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
        )}>
          {icon}
        </div>
      )}
      <p className={cn("text-2xl font-bold", negative && "text-destructive")}>{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
