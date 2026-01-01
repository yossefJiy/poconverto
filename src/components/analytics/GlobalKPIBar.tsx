import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ShoppingCart, 
  Target,
  Percent,
  MousePointer,
  Eye,
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
    totalClicks?: number;
    totalImpressions?: number;
  };
  facebookAds?: {
    cost?: number;
    conversions?: number;
    clicks?: number;
    impressions?: number;
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
  const navigate = useNavigate();
  
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

    const googleClicks = platformData.googleAds?.totalClicks || 0;
    const facebookClicks = platformData.facebookAds?.clicks || 0;
    const totalClicks = googleClicks + facebookClicks;

    // Calculate ROI: (Revenue - Ad Spend) / Ad Spend * 100
    const roi = totalAdSpend > 0 ? ((totalRevenue - totalAdSpend) / totalAdSpend) * 100 : 0;

    // Calculate ROAS
    const roas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

    // Calculate CPA (Cost Per Acquisition)
    const cpa = totalConversions > 0 ? totalAdSpend / totalConversions : 0;

    return {
      totalRevenue,
      totalAdSpend,
      totalOrders,
      totalConversions,
      totalClicks,
      roi,
      roas,
      cpa,
    };
  }, [platformData]);

  const kpis = [
    {
      label: "הכנסות",
      value: formatCurrency(metrics.totalRevenue),
      icon: <DollarSign className="w-4 h-4" />,
      color: "bg-green-500",
      textColor: "text-green-500",
      bgColor: "bg-green-500/10",
      change: 12.5, // Mock - would come from comparison
    },
    {
      label: "הוצאות פרסום",
      value: formatCurrency(metrics.totalAdSpend),
      icon: <Target className="w-4 h-4" />,
      color: "bg-orange-500",
      textColor: "text-orange-500",
      bgColor: "bg-orange-500/10",
      change: -5.2,
    },
    {
      label: "ROI",
      value: `${metrics.roi.toFixed(0)}%`,
      icon: <Percent className="w-4 h-4" />,
      color: metrics.roi >= 0 ? "bg-emerald-500" : "bg-red-500",
      textColor: metrics.roi >= 0 ? "text-emerald-500" : "text-red-500",
      bgColor: metrics.roi >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
      change: metrics.roi >= 0 ? 8.3 : -8.3,
    },
    {
      label: "ROAS",
      value: `${metrics.roas.toFixed(1)}x`,
      icon: <TrendingUp className="w-4 h-4" />,
      color: "bg-blue-500",
      textColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
      change: 15.0,
    },
    {
      label: "הזמנות",
      value: formatNumber(metrics.totalOrders),
      icon: <ShoppingCart className="w-4 h-4" />,
      color: "bg-purple-500",
      textColor: "text-purple-500",
      bgColor: "bg-purple-500/10",
      change: 22.1,
    },
    {
      label: "קליקים",
      value: formatNumber(metrics.totalClicks),
      icon: <MousePointer className="w-4 h-4" />,
      color: "bg-cyan-500",
      textColor: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      change: 18.7,
    },
  ];

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4 card-shadow">
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 bg-muted/30 rounded-lg animate-pulse min-w-[140px]">
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div>
                <div className="h-4 bg-muted rounded w-16 mb-1" />
                <div className="h-3 bg-muted rounded w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 card-shadow">
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {kpis.map((kpi) => (
          <div 
            key={kpi.label} 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.02] cursor-pointer min-w-[150px]",
              kpi.bgColor
            )}
          >
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-white", kpi.color)}>
              {kpi.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">{kpi.value}</p>
                {kpi.change !== undefined && (
                  <span className={cn(
                    "text-[10px] font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
                    kpi.change >= 0 ? "bg-green-500/20 text-green-600" : "bg-red-500/20 text-red-600"
                  )}>
                    {kpi.change >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {Math.abs(kpi.change).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
