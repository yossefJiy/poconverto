import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient } from "@/hooks/useClient";
import { GoogleShoppingManager } from "@/components/ecommerce/GoogleShoppingManager";
import { ProductFeedManager } from "@/components/ecommerce/ProductFeedManager";
import { PriceTracker } from "@/components/ecommerce/PriceTracker";
import { CustomerSegmentation } from "@/components/ecommerce/CustomerSegmentation";

export default function GoogleShopping() {
  const { selectedClient } = useClient();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Google Shopping</h1>
          <p className="text-muted-foreground">ניהול מוצרים, פידים ומעקב מחירים</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">סקירה</TabsTrigger>
            <TabsTrigger value="feeds">פידים</TabsTrigger>
            <TabsTrigger value="prices">מעקב מחירים</TabsTrigger>
            <TabsTrigger value="segments">פילוח לקוחות</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <GoogleShoppingManager clientId={selectedClient?.id} />
          </TabsContent>

          <TabsContent value="feeds">
            <ProductFeedManager clientId={selectedClient?.id} />
          </TabsContent>

          <TabsContent value="prices">
            <PriceTracker clientId={selectedClient?.id} />
          </TabsContent>

          <TabsContent value="segments">
            <CustomerSegmentation clientId={selectedClient?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
