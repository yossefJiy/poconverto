import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { cn } from "@/lib/utils";
import { Store, Target, BarChart3, ShoppingCart } from "lucide-react";

interface Platform {
  key: string;
  name: string;
  path: string;
  icon: React.ReactNode;
  bgColor: string;
}

const platforms: Platform[] = [
  { key: "google_analytics", name: "Google Analytics", path: "/analytics/google-analytics", icon: <BarChart3 className="w-4 h-4" />, bgColor: "bg-[#E37400]" },
  { key: "shopify", name: "Shopify", path: "/analytics/shopify", icon: <Store className="w-4 h-4" />, bgColor: "bg-[#96BF48]" },
  { key: "google_ads", name: "Google Ads", path: "/analytics/google-ads", icon: <Target className="w-4 h-4" />, bgColor: "bg-[#4285F4]" },
  { key: "facebook_ads", name: "Facebook Ads", path: "/analytics/facebook-ads", icon: <span className="text-xs font-bold">f</span>, bgColor: "bg-[#1877F2]" },
  { key: "woocommerce", name: "WooCommerce", path: "/analytics/woocommerce", icon: <ShoppingCart className="w-4 h-4" />, bgColor: "bg-[#96588A]" },
];

export function AnalyticsPlatformNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedClient } = useClient();

  // Fetch connected integrations for this client
  const { data: integrations = [] } = useQuery({
    queryKey: ["client-integrations-nav", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data } = await supabase
        .from("integrations")
        .select("platform, is_connected")
        .eq("client_id", selectedClient.id)
        .eq("is_connected", true);
      return data || [];
    },
    enabled: !!selectedClient?.id,
    staleTime: 5 * 60 * 1000,
  });

  const connectedPlatforms = integrations.map(i => i.platform);
  const availablePlatforms = platforms.filter(p => connectedPlatforms.includes(p.key));

  if (availablePlatforms.length <= 1) return null;

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
      {availablePlatforms.map((platform) => {
        const isActive = location.pathname === platform.path;
        return (
          <button
            key={platform.key}
            onClick={() => navigate(platform.path)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              isActive
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <div className={cn("w-5 h-5 rounded flex items-center justify-center text-white", platform.bgColor)}>
              {platform.icon}
            </div>
            <span className="hidden sm:inline">{platform.name}</span>
          </button>
        );
      })}
    </div>
  );
}
