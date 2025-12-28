import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Package,
  ShoppingCart,
  Boxes,
  RefreshCw,
  Loader2,
  Store,
  AlertCircle,
} from "lucide-react";
import { useShopifyData } from "@/hooks/useShopifyData";
import { ShopifyProductsGallery } from "./ShopifyProductsGallery";
import { ShopifyInventoryTable } from "./ShopifyInventoryTable";
import { ShopifyOrdersTable } from "./ShopifyOrdersTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ShopifyDashboard() {
  const { products, orders, shop, isLoading, isError, error, refetch } = useShopifyData();
  const [activeTab, setActiveTab] = useState("products");

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>שגיאה בחיבור ל-Shopify</AlertTitle>
        <AlertDescription>
          {error?.message || 'לא ניתן לטעון נתונים מהחנות'}
          <Button variant="outline" size="sm" className="mr-4" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 ml-2" />
            נסה שוב
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate stats
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const totalInventory = products.reduce((sum, p) => 
    sum + p.variants.reduce((vSum, v) => vSum + (v.inventory_quantity || 0), 0), 0
  );
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);

  return (
    <div className="space-y-6">
      {/* Shop Header */}
      {shop && (
        <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-gradient-to-l from-primary/10 to-transparent rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold">{shop.name}</h3>
              <p className="text-sm text-muted-foreground">{shop.domain}</p>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {shop.plan_name}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={isLoading} onClick={() => refetch()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 ml-2" />
              )}
              רענן
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a 
                href={`https://${shop.myshopify_domain}/admin`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 ml-2" />
                ניהול החנות
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a 
                href={`https://${shop.domain}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Store className="w-4 h-4 ml-2" />
                צפה באתר
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold">{isLoading ? '...' : totalProducts}</div>
          <div className="text-sm text-muted-foreground">מוצרים</div>
        </div>
        <div className="bg-green-500/10 rounded-lg p-4 text-center">
          <Package className="w-6 h-6 mx-auto mb-2 text-green-400" />
          <div className="text-2xl font-bold text-green-400">{isLoading ? '...' : activeProducts}</div>
          <div className="text-sm text-muted-foreground">פעילים</div>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-4 text-center">
          <Boxes className="w-6 h-6 mx-auto mb-2 text-blue-400" />
          <div className="text-2xl font-bold text-blue-400">{isLoading ? '...' : totalInventory.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">יחידות במלאי</div>
        </div>
        <div className="bg-purple-500/10 rounded-lg p-4 text-center">
          <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-purple-400" />
          <div className="text-2xl font-bold text-purple-400">{isLoading ? '...' : totalOrders}</div>
          <div className="text-sm text-muted-foreground">הזמנות</div>
        </div>
        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {isLoading ? '...' : `₪${totalRevenue.toLocaleString()}`}
          </div>
          <div className="text-sm text-muted-foreground">הכנסות</div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            גלריית מוצרים
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Boxes className="w-4 h-4" />
            מלאי
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            הזמנות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <ShopifyProductsGallery 
              products={products} 
              storeDomain={shop?.domain}
            />
          )}
        </TabsContent>

        <TabsContent value="inventory" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <ShopifyInventoryTable products={products} />
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <ShopifyOrdersTable orders={orders} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
