import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Package } from "lucide-react";

interface ShopifyProduct {
  id: number;
  title: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku: string | null;
    inventory_quantity: number;
  }>;
}

interface Props {
  products: ShopifyProduct[];
}

export function ShopifyInventoryTable({ products }: Props) {
  // Flatten all variants with product info
  const inventoryItems = products.flatMap(product => 
    product.variants.map(variant => ({
      productId: product.id,
      productTitle: product.title,
      variantId: variant.id,
      variantTitle: variant.title,
      sku: variant.sku,
      price: parseFloat(variant.price),
      quantity: variant.inventory_quantity,
    }))
  );

  // Sort by quantity (low stock first)
  const sortedItems = [...inventoryItems].sort((a, b) => a.quantity - b.quantity);

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: 'אזל', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle };
    if (qty < 10) return { label: 'נמוך', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertTriangle };
    return { label: 'במלאי', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Check };
  };

  const lowStockCount = inventoryItems.filter(i => i.quantity < 10 && i.quantity > 0).length;
  const outOfStockCount = inventoryItems.filter(i => i.quantity === 0).length;
  const totalValue = inventoryItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">אין נתוני מלאי</h3>
        <p className="text-muted-foreground">לא נמצאו מוצרים לניהול מלאי</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">סה"כ פריטים</div>
          <div className="text-2xl font-bold">{inventoryItems.length}</div>
        </div>
        <div className="bg-red-500/10 rounded-lg p-4">
          <div className="text-sm text-red-400">אזל מהמלאי</div>
          <div className="text-2xl font-bold text-red-400">{outOfStockCount}</div>
        </div>
        <div className="bg-yellow-500/10 rounded-lg p-4">
          <div className="text-sm text-yellow-400">מלאי נמוך</div>
          <div className="text-2xl font-bold text-yellow-400">{lowStockCount}</div>
        </div>
        <div className="bg-green-500/10 rounded-lg p-4">
          <div className="text-sm text-green-400">ערך מלאי</div>
          <div className="text-2xl font-bold text-green-400">₪{totalValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">מוצר</TableHead>
              <TableHead className="text-right">וריאנט</TableHead>
              <TableHead className="text-right">מק"ט</TableHead>
              <TableHead className="text-right">מחיר</TableHead>
              <TableHead className="text-right">כמות</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.slice(0, 50).map((item) => {
              const status = getStockStatus(item.quantity);
              const StatusIcon = status.icon;

              return (
                <TableRow key={`${item.productId}-${item.variantId}`}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {item.productTitle}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.variantTitle !== 'Default Title' ? item.variantTitle : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.sku || '-'}
                  </TableCell>
                  <TableCell>₪{item.price.toFixed(2)}</TableCell>
                  <TableCell className="font-medium">{item.quantity}</TableCell>
                  <TableCell>
                    <Badge className={status.color}>
                      <StatusIcon className="w-3 h-3 ml-1" />
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {inventoryItems.length > 50 && (
        <p className="text-sm text-muted-foreground text-center">
          מוצגים 50 מתוך {inventoryItems.length} פריטים
        </p>
      )}
    </div>
  );
}
