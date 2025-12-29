import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { ShopifyDashboard } from "@/components/shopify/ShopifyDashboard";
import { WooCommerceDashboard } from "@/components/woocommerce/WooCommerceDashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plug, 
  ArrowRight, 
  ShoppingBag,
  Store,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Ecommerce() {
  const { selectedClient } = useClient();

  // Fetch integrations for the selected client
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["integrations", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("client_id", selectedClient.id)
        .eq("is_connected", true);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  const hasShopify = integrations.some(i => i.platform === 'shopify' && i.is_connected);
  const hasWooCommerce = integrations.some(i => i.platform === 'woocommerce' && i.is_connected);
  const hasAnyEcommerce = hasShopify || hasWooCommerce;

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader title="חנות ומלאי" description="בחר לקוח כדי לצפות בנתונים" />
          <div className="glass rounded-xl p-12 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח כדי להתחיל</h3>
            <p className="text-muted-foreground mb-4">
              כדי לצפות בנתוני החנות והמלאי, יש לבחור לקוח מהתפריט בסרגל הצד
            </p>
            <div className="flex items-center justify-center gap-2">
              <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
              <span className="text-primary font-medium">בחר לקוח מהתפריט בצד שמאל</span>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader 
            title={`חנות ומלאי - ${selectedClient.name}`}
            description="טוען נתונים..."
          />
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!hasAnyEcommerce) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader 
            title={`חנות ומלאי - ${selectedClient.name}`}
            description="ניהול חנות אונליין"
          />
          <div className="glass rounded-xl p-12 text-center">
            <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">אין אינטגרציות חנות מחוברות</h3>
            <p className="text-muted-foreground mb-4">
              חבר Shopify או WooCommerce כדי לראות נתוני חנות ומלאי
            </p>
            <Button asChild>
              <Link to="/analytics?integrations=open">
                <Plug className="w-4 h-4 ml-2" />
                חבר אינטגרציה
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Determine the connected platforms
  const connectedPlatforms = [];
  if (hasShopify) connectedPlatforms.push({ id: 'shopify', name: 'Shopify', icon: ShoppingBag });
  if (hasWooCommerce) connectedPlatforms.push({ id: 'woocommerce', name: 'WooCommerce', icon: Store });

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <PageHeader 
              title={`חנות ומלאי - ${selectedClient.name}`}
              description="מוצרים, מלאי, קולקציות והזמנות"
            />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground">פלטפורמות מחוברות:</span>
              {connectedPlatforms.map((platform) => (
                <Badge 
                  key={platform.id} 
                  variant="outline" 
                  className="bg-primary/10 text-primary border-primary/30 flex items-center gap-1"
                >
                  <platform.icon className="w-3 h-3" />
                  {platform.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* If only one platform is connected, show it directly */}
        {connectedPlatforms.length === 1 ? (
          <div className="glass rounded-xl p-6 card-shadow">
            {hasShopify ? (
              <ShopifyDashboard />
            ) : (
              <WooCommerceDashboard clientId={selectedClient.id} />
            )}
          </div>
        ) : (
          /* If multiple platforms are connected, use tabs */
          <Tabs defaultValue={connectedPlatforms[0]?.id} className="space-y-6">
            <TabsList className="glass">
              {connectedPlatforms.map((platform) => (
                <TabsTrigger key={platform.id} value={platform.id} className="flex items-center gap-2">
                  <platform.icon className="w-4 h-4" />
                  {platform.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {hasShopify && (
              <TabsContent value="shopify">
                <div className="glass rounded-xl p-6 card-shadow">
                  <ShopifyDashboard />
                </div>
              </TabsContent>
            )}

            {hasWooCommerce && (
              <TabsContent value="woocommerce">
                <div className="glass rounded-xl p-6 card-shadow">
                  <WooCommerceDashboard clientId={selectedClient.id} />
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}
