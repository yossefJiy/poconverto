import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, Package, TrendingUp, AlertTriangle, RefreshCw, Settings } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  clientId?: string;
}

export function GoogleShoppingManager({ clientId }: Props) {
  const { data: feeds = [] } = useQuery({
    queryKey: ["product-feeds", clientId],
    queryFn: async () => {
      const query = supabase
        .from("product_feeds")
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

  const totalProducts = feeds.reduce((sum, f) => sum + (f.product_count || 0), 0);
  const totalErrors = feeds.reduce((sum, f) => sum + (f.error_count || 0), 0);
  const activeFeeds = feeds.filter(f => f.status === "active").length;

  // Mock chart data
  const chartData = Array.from({ length: 7 }, (_, i) => ({
    day: ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"][i],
    clicks: Math.floor(Math.random() * 500 + 200),
    impressions: Math.floor(Math.random() * 5000 + 2000),
    conversions: Math.floor(Math.random() * 50 + 10),
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">פידים פעילים</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFeeds}</div>
            <p className="text-xs text-muted-foreground">מתוך {feeds.length} פידים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">מוצרים</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">בכל הפידים</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">שגיאות</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalErrors}</div>
            <p className="text-xs text-muted-foreground">מוצרים עם בעיות</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ROAS</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">4.2x</div>
            <p className="text-xs text-muted-foreground">+0.3 מהחודש שעבר</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ביצועי Shopping</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 ml-1" />
              סנכרן
            </Button>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4 ml-1" />
              הגדרות
            </Button>
          </div>
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
                  dataKey="impressions" 
                  stackId="1"
                  stroke="hsl(var(--muted-foreground))" 
                  fill="hsl(var(--muted) / 0.5)" 
                  name="חשיפות"
                />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stackId="2"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary) / 0.3)" 
                  name="קליקים"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>פידים מחוברים</CardTitle>
        </CardHeader>
        <CardContent>
          {feeds.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">אין פידים מחוברים</h3>
              <p className="text-muted-foreground mb-4">
                חבר את הפיד הראשון שלך מ-Google Merchant Center
              </p>
              <Button>חבר פיד</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {feeds.map((feed) => (
                <div 
                  key={feed.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{feed.feed_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {feed.product_count} מוצרים · {feed.platform}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={feed.status === "active" ? "default" : "secondary"}>
                      {feed.status === "active" ? "פעיל" : "מושהה"}
                    </Badge>
                    {feed.error_count > 0 && (
                      <Badge variant="destructive">{feed.error_count} שגיאות</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
