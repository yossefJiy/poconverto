import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  created_at: string;
  total_price: string;
  subtotal_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
}

interface Props {
  orders: ShopifyOrder[];
}

export function ShopifyOrdersTable({ orders }: Props) {
  const getFinancialStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'refunded': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'partially_refunded': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getFinancialStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'שולם';
      case 'pending': return 'ממתין';
      case 'refunded': return 'הוחזר';
      case 'partially_refunded': return 'החזר חלקי';
      case 'authorized': return 'אושר';
      default: return status;
    }
  };

  const getFulfillmentStatusColor = (status: string | null) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'partial': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case null: return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getFulfillmentStatusLabel = (status: string | null) => {
    switch (status) {
      case 'fulfilled': return 'נשלח';
      case 'partial': return 'חלקי';
      case null: return 'לא נשלח';
      default: return status;
    }
  };

  // Calculate summary stats
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_price), 0);
  const paidOrders = orders.filter(o => o.financial_status === 'paid').length;
  const fulfilledOrders = orders.filter(o => o.fulfillment_status === 'fulfilled').length;

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">אין הזמנות</h3>
        <p className="text-muted-foreground">לא נמצאו הזמנות בחנות</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="text-sm text-muted-foreground">סה"כ הזמנות</div>
          <div className="text-2xl font-bold">{orders.length}</div>
        </div>
        <div className="bg-primary/10 rounded-lg p-4">
          <div className="text-sm text-primary">הכנסות</div>
          <div className="text-2xl font-bold text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            ₪{totalRevenue.toLocaleString()}
          </div>
        </div>
        <div className="bg-green-500/10 rounded-lg p-4">
          <div className="text-sm text-green-400">שולמו</div>
          <div className="text-2xl font-bold text-green-400">{paidOrders}</div>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-4">
          <div className="text-sm text-blue-400">נשלחו</div>
          <div className="text-2xl font-bold text-blue-400">{fulfilledOrders}</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">הזמנה</TableHead>
              <TableHead className="text-right">תאריך</TableHead>
              <TableHead className="text-right">לקוח</TableHead>
              <TableHead className="text-right">פריטים</TableHead>
              <TableHead className="text-right">סכום</TableHead>
              <TableHead className="text-right">תשלום</TableHead>
              <TableHead className="text-right">משלוח</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: he })}
                </TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {order.email || '-'}
                </TableCell>
                <TableCell>
                  {order.line_items.reduce((sum, i) => sum + i.quantity, 0)} פריטים
                </TableCell>
                <TableCell className="font-bold">
                  ₪{parseFloat(order.total_price).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge className={getFinancialStatusColor(order.financial_status)}>
                    {getFinancialStatusLabel(order.financial_status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getFulfillmentStatusColor(order.fulfillment_status)}>
                    {getFulfillmentStatusLabel(order.fulfillment_status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
