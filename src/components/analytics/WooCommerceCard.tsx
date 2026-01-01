import { useState } from "react";
import { 
  Store, 
  ShoppingCart, 
  DollarSign, 
  Package,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Plus,
  Plug,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isAuthError } from "@/lib/authError";
import { useNavigate } from "react-router-dom";
import { useAnalyticsSnapshot, formatSnapshotDate } from "@/hooks/useAnalyticsSnapshot";

interface WooCommerceCardProps {
  globalDateFrom: string;
  globalDateTo: string;
  clientId?: string;
  isAdmin?: boolean;
  onAddIntegration?: () => void;
}

const statusColors: Record<string, string> = {
  processing: "bg-blue-500",
  completed: "bg-green-500",
  pending: "bg-yellow-500",
  cancelled: "bg-red-500",
  refunded: "bg-purple-500",
  failed: "bg-red-700",
  "on-hold": "bg-orange-500",
};

const statusLabels: Record<string, string> = {
  processing: "בעיבוד",
  completed: "הושלם",
  pending: "ממתין",
  cancelled: "בוטל",
  refunded: "הוחזר",
  failed: "נכשל",
  "on-hold": "בהמתנה",
};

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

function formatCurrency(num: number, currency = "ILS"): string {
  const symbol = currency === "USD" ? "$" : "₪";
  return symbol + formatNumber(num);
}

interface MetricWithComparisonProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

function MetricWithComparison({ label, value, change, icon, color }: MetricWithComparisonProps) {
  const isPositive = change !== undefined && change >= 0;
  
  return (
    <div className="bg-muted/50 rounded-lg p-3 transition-all hover:bg-muted/70">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", color)}>
          {icon}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold">{value}</p>
        {change !== undefined && (
          <span className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5",
            isPositive ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? "+" : ""}{change}%
          </span>
        )}
      </div>
    </div>
  );
}

export function WooCommerceCard({ 
  globalDateFrom,
  globalDateTo,
  clientId,
  isAdmin = false,
  onAddIntegration,
}: WooCommerceCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const startDate = globalDateFrom.split('T')[0];
  const endDate = globalDateTo.split('T')[0];

  const { data, isLoading, error } = useQuery({
    queryKey: ["woocommerce-analytics", clientId, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('woocommerce-api', {
        body: {
          action: 'get_analytics',
          client_id: clientId,
          start_date: startDate,
          end_date: endDate,
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data.data;
    },
    enabled: !!clientId,
    staleTime: 8 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  // Fetch snapshot fallback
  const { data: snapshot } = useAnalyticsSnapshot(clientId, 'woocommerce');

  // Loading state
  if (isLoading && !data) {
    return (
      <div className="glass rounded-xl p-4 card-shadow animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#96588A]/20 flex items-center justify-center">
            <Store className="w-4 h-4 text-[#96588A]" />
          </div>
          <div className="h-5 bg-muted rounded w-28"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error handling
  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (isAuthError(error)) {
      return (
        <div className="glass rounded-xl p-4 card-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#96588A]/20 flex items-center justify-center">
              <Store className="w-4 h-4 text-[#96588A]" />
            </div>
            <h3 className="font-bold">WooCommerce</h3>
          </div>
          <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-600">פג תוקף ההתחברות</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              התחבר
            </Button>
          </div>
        </div>
      );
    }
    
    const isIntegrationError = errorMessage?.includes('לא מוגדר') || errorMessage?.includes('חסר') || errorMessage?.includes('credentials');
    
    if (isIntegrationError && isAdmin && onAddIntegration) {
      return (
        <div className="glass rounded-xl p-4 card-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#96588A]/20 flex items-center justify-center">
              <Store className="w-4 h-4 text-[#96588A]" />
            </div>
            <h3 className="font-bold">WooCommerce</h3>
          </div>
          <div className="flex flex-col items-center gap-3 py-6">
            <Plug className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">לא מוגדר עבור לקוח זה</p>
            <Button onClick={onAddIntegration} size="sm">
              <Plus className="w-4 h-4 ml-2" />
              הוסף
            </Button>
          </div>
        </div>
      );
    }

    // If we have a snapshot, use it as fallback
    if (!snapshot) {
      return (
        <div className="glass rounded-xl p-4 card-shadow">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#96588A]/20 flex items-center justify-center">
              <Store className="w-4 h-4 text-[#96588A]" />
            </div>
            <h3 className="font-bold">WooCommerce</h3>
          </div>
          <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive truncate">{errorMessage}</p>
          </div>
        </div>
      );
    }
  }

  // Determine if using snapshot fallback
  const usingSnapshot = !data && !!snapshot;
  const effectiveData = data || (snapshot?.data as typeof data | undefined);

  const summary = effectiveData?.summary || {};
  const dailySales = effectiveData?.dailySales || [];
  const topProducts = effectiveData?.topProducts || [];
  const recentOrders = effectiveData?.recentOrders || [];
  const statusBreakdown = effectiveData?.statusBreakdown || {};

  const summaryMetrics = [
    {
      label: "הכנסות",
      value: formatCurrency(summary.totalRevenue || 0, summary.currency),
      icon: <DollarSign className="w-4 h-4" />,
      color: "bg-[#96588A]/20 text-[#96588A]",
    },
    {
      label: "הזמנות",
      value: formatNumber(summary.totalOrders || 0),
      icon: <ShoppingCart className="w-4 h-4" />,
      color: "bg-blue-500/20 text-blue-500",
    },
    {
      label: "ממוצע",
      value: formatCurrency(summary.averageOrderValue || 0, summary.currency),
      icon: <TrendingUp className="w-4 h-4" />,
      color: "bg-green-500/20 text-green-500",
    },
    {
      label: "פריטים",
      value: formatNumber(summary.totalItems || 0),
      icon: <Package className="w-4 h-4" />,
      color: "bg-orange-500/20 text-orange-500",
    },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="glass rounded-xl p-4 card-shadow">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-[#96588A]/20 flex items-center justify-center">
                <Store className="w-4 h-4 text-[#96588A]" />
              </div>
              <div>
                <h3 className="font-bold">WooCommerce</h3>
                {usingSnapshot && snapshot && (
                  <Badge variant="secondary" className="text-[10px] bg-yellow-500/20 text-yellow-600">
                    <Clock className="w-2.5 h-2.5 ml-1" />
                    {formatSnapshotDate(snapshot.updated_at)}
                  </Badge>
                )}
              </div>
            </div>
          </CollapsibleTrigger>
          
          <div className="flex items-center gap-2">
            {Object.keys(statusBreakdown).length > 0 && (
              <div className="hidden sm:flex gap-1">
                {Object.entries(statusBreakdown).slice(0, 3).map(([status, count]) => (
                  <Badge key={status} variant="outline" className="text-[10px]">
                    <span className={cn("w-1.5 h-1.5 rounded-full ml-1", statusColors[status] || "bg-gray-500")} />
                    {count as number}
                  </Badge>
                ))}
              </div>
            )}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Summary Metrics - Always Visible */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryMetrics.map((metric) => (
            <MetricWithComparison key={metric.label} {...metric} />
          ))}
        </div>

        {/* Collapsible Detailed Content */}
        <CollapsibleContent className="mt-4 space-y-4">
          {/* Status Breakdown */}
          {Object.keys(statusBreakdown).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusBreakdown).map(([status, count]) => (
                <Badge key={status} variant="outline" className="text-xs">
                  <span className={cn("w-2 h-2 rounded-full ml-1", statusColors[status] || "bg-gray-500")} />
                  {statusLabels[status] || status}: {count as number}
                </Badge>
              ))}
            </div>
          )}

          {/* Daily Sales Chart */}
          {dailySales.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-3 text-sm">מכירות יומיות</h4>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySales}>
                    <defs>
                      <linearGradient id="colorRevenueWoo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#96588A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#96588A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={10}
                      tickFormatter={(value) => `₪${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "12px"
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#96588A" 
                      fill="url(#colorRevenueWoo)" 
                      strokeWidth={2}
                      name="הכנסות"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Products */}
          {topProducts.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-3 text-sm">מוצרים מובילים</h4>
              <div className="space-y-2">
                {topProducts.slice(0, 5).map((product: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[200px]">{product.name}</span>
                    <div className="flex items-center gap-4">
                      <span>{product.quantity} נמכרו</span>
                      <span className="font-medium">{formatCurrency(product.revenue, summary.currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <div className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-bold mb-3 text-sm">הזמנות אחרונות</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right text-xs">מספר</TableHead>
                      <TableHead className="text-right text-xs">סטטוס</TableHead>
                      <TableHead className="text-right text-xs">סכום</TableHead>
                      <TableHead className="text-right text-xs">תאריך</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.slice(0, 5).map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium text-xs">#{order.number}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="text-[10px]"
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full ml-1", statusColors[order.status] || "bg-gray-500")} />
                            {statusLabels[order.status] || order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{formatCurrency(order.total, summary.currency)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(order.date_created).toLocaleDateString('he-IL')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
