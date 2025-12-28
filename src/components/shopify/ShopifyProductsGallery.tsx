import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  status: string;
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
  }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    inventory_quantity: number;
  }>;
  tags: string;
}

interface Props {
  products: ShopifyProduct[];
  storeDomain?: string;
}

export function ShopifyProductsGallery({ products, storeDomain }: Props) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">אין מוצרים</h3>
        <p className="text-muted-foreground">לא נמצאו מוצרים בחנות</p>
      </div>
    );
  }

  const getTotalInventory = (variants: ShopifyProduct['variants']) => {
    return variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0);
  };

  const getLowestPrice = (variants: ShopifyProduct['variants']) => {
    const prices = variants.map(v => parseFloat(v.price));
    return Math.min(...prices);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'draft': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'archived': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getInventoryColor = (qty: number) => {
    if (qty === 0) return 'text-red-400';
    if (qty < 10) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => {
        const inventory = getTotalInventory(product.variants);
        const price = getLowestPrice(product.variants);
        const imageUrl = product.images[0]?.src;

        return (
          <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all">
            <div className="aspect-square bg-muted relative overflow-hidden">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <Badge className={`absolute top-2 right-2 ${getStatusColor(product.status)}`}>
                {product.status === 'active' ? 'פעיל' : product.status === 'draft' ? 'טיוטה' : 'ארכיון'}
              </Badge>
            </div>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold line-clamp-2 min-h-[3rem]">{product.title}</h3>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">מחיר:</span>
                <span className="font-bold text-primary">₪{price.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">מלאי:</span>
                <span className={`font-medium ${getInventoryColor(inventory)}`}>
                  {inventory} יחידות
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">וריאנטים:</span>
                <span>{product.variants.length}</span>
              </div>

              {storeDomain && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  asChild
                >
                  <a 
                    href={`https://${storeDomain}/products/${product.handle}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 ml-2" />
                    צפה באתר
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
