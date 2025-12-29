import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, 
  ShoppingCart, 
  Package, 
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface WooCommerceDashboardProps {
  clientId: string;
}

const statusColors: Record<string, string> = {
  processing: "bg-blue-500",
  completed: "bg-green-500",
  pending: "bg-yellow-500",
  cancelled: "bg-red-500",
  refunded: "bg-purple-500",
  failed: "bg-red-700",
  "on-hold": "bg-orange-500",
  publish: "bg-green-500",
  draft: "bg-yellow-500",
  private: "bg-gray-500",
  instock: "bg-green-500",
  outofstock: "bg-red-500",
  onbackorder: "bg-yellow-500",
};

const statusLabels: Record<string, string> = {
  processing: "בעיבוד",
  completed: "הושלם",
  pending: "ממתין",
  cancelled: "בוטל",
  refunded: "הוחזר",
  failed: "נכשל",
  "on-hold": "בהמתנה",
  publish: "פורסם",
  draft: "טיוטה",
  private: "פרטי",
  instock: "במלאי",
  outofstock: "אזל",
  onbackorder: "בהזמנה",
};

function formatCurrency(value: number, currency = 'ILS') {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function WooCommerceDashboard({ clientId }: WooCommerceDashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: products, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ["woocommerce-products", clientId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('woocommerce-api', {
        body: { action: 'get_products', client_id: clientId, limit: 50 }
      });
      if (error) throw error;
      return data.data || [];
    },
    enabled: !!clientId,
  });

  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["woocommerce-orders", clientId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('woocommerce-api', {
        body: { action: 'get_orders', client_id: clientId, limit: 50 }
      });
      if (error) throw error;
      return data.data || [];
    },
    enabled: !!clientId,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await supabase.functions.invoke('woocommerce-api', {
        body: { action: 'sync_all', client_id: clientId }
      });
      await Promise.all([refetchProducts(), refetchOrders()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading = productsLoading || ordersLoading;
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter((p: any) => p.status === 'publish')?.length || 0;
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum: number, o: any) => sum + parseFloat(o.total || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#96588A]/20 flex items-center justify-center">
            <Store className="w-5 h-5 text-[#96588A]" />
          </div>
          <div>
            <h3 className="font-bold text-lg">WooCommerce</h3>
            <p className="text-sm text-muted-foreground">ניהול מוצרים והזמנות</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 ml-2" />
          )}
          סנכרן
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Package className="w-4 h-4" />
            סה״כ מוצרים
          </div>
          <div className="text-2xl font-bold">{totalProducts}</div>
        </div>
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Package className="w-4 h-4" />
            מוצרים פעילים
          </div>
          <div className="text-2xl font-bold">{activeProducts}</div>
        </div>
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <ShoppingCart className="w-4 h-4" />
            הזמנות
          </div>
          <div className="text-2xl font-bold">{totalOrders}</div>
        </div>
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Store className="w-4 h-4" />
            הכנסות
          </div>
          <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
        </div>
      </div>

      {/* Tabs for Products, Inventory, Orders */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">מוצרים</TabsTrigger>
          <TabsTrigger value="inventory">מלאי</TabsTrigger>
          <TabsTrigger value="orders">הזמנות</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products?.slice(0, 20).map((product: any) => (
                <div key={product.id} className="rounded-lg border bg-card overflow-hidden">
                  <div className="aspect-square relative bg-muted">
                    {product.images?.[0]?.src ? (
                      <img 
                        src={product.images[0].src} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge 
                      className={cn(
                        "absolute top-2 right-2 text-xs",
                        statusColors[product.status] || "bg-gray-500"
                      )}
                    >
                      {statusLabels[product.status] || product.status}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                    <p className="text-primary font-bold mt-1">{formatCurrency(parseFloat(product.price || 0))}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      מלאי: {product.stock_quantity ?? 'לא מנוהל'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">מוצר</TableHead>
                    <TableHead className="text-right">SKU</TableHead>
                    <TableHead className="text-right">מלאי</TableHead>
                    <TableHead className="text-right">סטטוס מלאי</TableHead>
                    <TableHead className="text-right">מחיר</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.sku || '-'}</TableCell>
                      <TableCell>{product.stock_quantity ?? 'לא מנוהל'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className="flex items-center gap-1 w-fit"
                        >
                          <span className={cn("w-2 h-2 rounded-full", statusColors[product.stock_status] || "bg-gray-500")} />
                          {statusLabels[product.stock_status] || product.stock_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(parseFloat(product.price || 0))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">מס' הזמנה</TableHead>
                    <TableHead className="text-right">לקוח</TableHead>
                    <TableHead className="text-right">סטטוס</TableHead>
                    <TableHead className="text-right">סכום</TableHead>
                    <TableHead className="text-right">תאריך</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.number || order.id}</TableCell>
                      <TableCell>{order.billing?.first_name} {order.billing?.last_name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className="flex items-center gap-1 w-fit"
                        >
                          <span className={cn("w-2 h-2 rounded-full", statusColors[order.status] || "bg-gray-500")} />
                          {statusLabels[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(parseFloat(order.total || 0), order.currency)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.date_created).toLocaleDateString('he-IL')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
