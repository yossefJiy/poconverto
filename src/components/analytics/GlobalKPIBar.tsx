import { useMemo } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Target,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformData {
  shopify?: {
    totalRevenue?: number;
    totalOrders?: number;
  };
  googleAds?: {
    totalCost?: number;
    totalConversions?: number;
  };
  facebookAds?: {
    cost?: number;
    conversions?: number;
  };
  woocommerce?: {
    totalRevenue?: number;
    totalOrders?: number;
  };
}

interface GlobalKPIBarProps {
  platformData: PlatformData;
  isLoading?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

function formatCurrency(num: number): string {
  return "₪" + formatNumber(num);
}

export function GlobalKPIBar({ platformData, isLoading }: GlobalKPIBarProps) {
  const metrics = useMemo(() => {
    const shopifyRevenue = platformData.shopify?.totalRevenue || 0;
    const wooRevenue = platformData.woocommerce?.totalRevenue || 0;
    const totalRevenue = shopifyRevenue + wooRevenue;

    const googleAdsCost = platformData.googleAds?.totalCost || 0;
    const facebookAdsCost = platformData.facebookAds?.cost || 0;
    const totalAdSpend = googleAdsCost + facebookAdsCost;

    const shopifyOrders = platformData.shopify?.totalOrders || 0;
    const wooOrders = platformData.woocommerce?.totalOrders || 0;
    const totalOrders = shopifyOrders + wooOrders;

    const googleConversions = platformData.googleAds?.totalConversions || 0;
    const facebookConversions = platformData.facebookAds?.conversions || 0;
    const totalConversions = googleConversions + facebookConversions;

    // Calculate ROI: (Revenue - Ad Spend) / Ad Spend * 100
    const roi = totalAdSpend > 0 ? ((totalRevenue - totalAdSpend) / totalAdSpend) * 100 : 0;

    return {
      totalRevenue,
      totalAdSpend,
      totalOrders,
      totalConversions,
      roi,
    };
  }, [platformData]);

  const kpis = [
    {
      label: "סה״כ הכנסות",
      value: formatCurrency(metrics.totalRevenue),
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-green-500/20 text-green-500",
      description: "Shopify + WooCommerce",
    },
    {
      label: "הוצאות פרסום",
      value: formatCurrency(metrics.totalAdSpend),
      icon: <Target className="w-5 h-5" />,
      color: "bg-orange-500/20 text-orange-500",
      description: "Google Ads + Facebook",
    },
    {
      label: "ROI",
      value: `${metrics.roi.toFixed(1)}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: metrics.roi >= 0 ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500",
      description: "החזר על השקעה",
    },
    {
      label: "סה״כ הזמנות",
      value: formatNumber(metrics.totalOrders),
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "bg-purple-500/20 text-purple-500",
      description: "מכל הפלטפורמות",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass rounded-xl p-4 animate-pulse">
            <div className="h-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div 
          key={kpi.label} 
          className="glass rounded-xl p-4 card-shadow transition-all hover:scale-[1.02]"
        >
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", kpi.color)}>
              {kpi.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold truncate">{kpi.value}</p>
              <p className="text-sm font-medium text-foreground">{kpi.label}</p>
              <p className="text-xs text-muted-foreground truncate">{kpi.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
