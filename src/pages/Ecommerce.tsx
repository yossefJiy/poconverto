import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { ShopifyDashboard } from "@/components/shopify/ShopifyDashboard";
import { Button } from "@/components/ui/button";
import { 
  Plug, 
  ArrowRight, 
  ShoppingBag,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Ecommerce() {
  const { selectedClient } = useClient();

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

  if (!selectedClient.is_ecommerce) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader 
            title={`חנות ומלאי - ${selectedClient.name}`}
            description="ניהול חנות Shopify"
          />
          <div className="glass rounded-xl p-12 text-center">
            <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">לקוח לא מוגדר כאיקומרס</h3>
            <p className="text-muted-foreground mb-4">
              כדי לראות נתוני חנות, יש להפעיל את אפשרות האיקומרס בהגדרות הלקוח
            </p>
            <Button asChild>
              <Link to="/clients">
                <Plug className="w-4 h-4 ml-2" />
                הגדרות לקוח
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        <PageHeader 
          title={`חנות ומלאי - ${selectedClient.name}`}
          description="מוצרים, מלאי, קולקציות והזמנות מ-Shopify"
        />
        <div className="glass rounded-xl p-6 card-shadow">
          <ShopifyDashboard />
        </div>
      </div>
    </MainLayout>
  );
}
