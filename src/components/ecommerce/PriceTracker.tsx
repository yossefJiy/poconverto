import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus, Search, AlertTriangle, DollarSign, Plus, Loader2 } from "lucide-react";

interface Props {
  clientId?: string;
}

export function PriceTracker({ clientId }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: priceData = [], isLoading } = useQuery({
    queryKey: ["price-tracking", clientId],
    queryFn: async () => {
      const query = supabase
        .from("price_tracking")
        .select("*")
        .order("tracked_at", { ascending: false })
        .limit(100);
      
      if (clientId) {
        query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const filteredData = priceData.filter(item => 
    item.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.competitor_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cheaperCount = filteredData.filter(d => (d.price_difference || 0) > 0).length;
  const expensiveCount = filteredData.filter(d => (d.price_difference || 0) < 0).length;

  const getPriceDiffDisplay = (diff: number) => {
    if (diff > 0) {
      return (
        <span className="flex items-center gap-1 text-success">
          <TrendingUp className="h-4 w-4" />
          +₪{diff}
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="flex items-center gap-1 text-destructive">
          <TrendingDown className="h-4 w-4" />
          ₪{diff}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        שווה
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">אנחנו זולים יותר</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{cheaperCount}</div>
            <p className="text-xs text-muted-foreground">מוצרים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">אנחנו יקרים יותר</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{expensiveCount}</div>
            <p className="text-xs text-muted-foreground">מוצרים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">מוצרים במעקב</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredData.length}</div>
            <p className="text-xs text-muted-foreground">סה"כ</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>השוואת מחירים</CardTitle>
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חפש מוצר או מתחרה..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">אין מוצרים במעקב מחירים</p>
              <p className="text-sm text-muted-foreground mt-1">הוסף מוצרים לקבלת השוואת מחירים</p>
              <Button className="mt-4" variant="outline" size="sm">
                <Plus className="h-4 w-4 ml-1" />
                הוסף מוצר למעקב
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מוצר</TableHead>
                  <TableHead>המחיר שלנו</TableHead>
                  <TableHead>מתחרה</TableHead>
                  <TableHead>מחיר מתחרה</TableHead>
                  <TableHead>הפרש</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="font-mono">₪{item.our_price}</TableCell>
                    <TableCell>{item.competitor_name}</TableCell>
                    <TableCell className="font-mono">₪{item.competitor_price}</TableCell>
                    <TableCell>{getPriceDiffDisplay(item.price_difference || 0)}</TableCell>
                    <TableCell>
                      {(item.price_difference || 0) > 0 ? (
                        <Badge className="bg-success text-success-foreground">זול יותר</Badge>
                      ) : (item.price_difference || 0) < 0 ? (
                        <Badge variant="destructive">יקר יותר</Badge>
                      ) : (
                        <Badge variant="secondary">שווה</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
