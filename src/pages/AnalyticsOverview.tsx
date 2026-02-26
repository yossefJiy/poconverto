import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useDailyAnalytics } from "@/hooks/useDailyAnalytics";
import { getDateRange, formatILS, formatNum, formatPercent, type DatePreset } from "@/lib/dateUtils";
import { usePermissions } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, TrendingUp, DollarSign, ShoppingCart, Target, ArrowRight, Plug, BarChart3, Store, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const platformLabels: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok_ads: "TikTok Ads",
};

export default function AnalyticsOverview() {
  const { selectedClient } = useClient();
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const range = getDateRange(datePreset);
  const { summary, marketing, site, isLoading, refetch } = useDailyAnalytics(range.from, range.to);

  const handleRefresh = async () => {
    if (!selectedClient) return;
    setIsRefreshing(true);
    try {
      await supabase.functions.invoke("sync-daily", {
        body: {
          client_id: selectedClient.id,
          date_from: range.from,
          date_to: range.to,
          platforms: ["meta_ads", "google_ads", "tiktok_ads", "shopify", "woocommerce"],
        },
      });
      await refetch();
      toast.success("הנתונים עודכנו בהצלחה");
    } catch {
      toast.error("שגיאה בסנכרון הנתונים");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader title="אנליטיקס" description="בחר לקוח כדי לצפות בנתונים" />
          <div className="glass rounded-xl p-12 text-center">
            <Plug className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח כדי להתחיל</h3>
            <p className="text-muted-foreground">בחר לקוח מהתפריט בסרגל הצד</p>
            <ArrowRight className="w-5 h-5 mx-auto mt-4 text-primary animate-pulse" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageHeader title="אנליטיקס" description={`סקירה יומית — ${selectedClient.name}`} />
          <div className="flex items-center gap-2">
            <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 ימים</SelectItem>
                <SelectItem value="14d">14 ימים</SelectItem>
                <SelectItem value="30d">30 ימים</SelectItem>
                <SelectItem value="mtd">החודש</SelectItem>
                <SelectItem value="ytd">השנה</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Revenue Section */}
            <SectionCard title="הכנסות" icon={<Wallet className="w-5 h-5" />} accentClass="text-emerald-400">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard label="הכנסות אונליין" value={formatILS(summary.onlineRevenue)} icon={<Store className="w-5 h-5" />} />
                <KPICard label="הכנסות אופליין" value={formatILS(summary.offlineRevenue)} icon={<ShoppingCart className="w-5 h-5" />} />
                <KPICard label="סה״כ הכנסות" value={formatILS(summary.totalRevenue)} icon={<DollarSign className="w-5 h-5" />} highlight />
              </div>
            </SectionCard>

            {/* Ad Spend Section */}
            <SectionCard title="הוצאות פרסום" icon={<BarChart3 className="w-5 h-5" />} accentClass="text-blue-400">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard label="סה״כ הוצאות" value={formatILS(summary.totalAdSpend)} icon={<DollarSign className="w-5 h-5" />} highlight />
                {Object.entries(summary.spendByPlatform).map(([platform, spend]) => (
                  <KPICard key={platform} label={platformLabels[platform] || platform} value={formatILS(spend)} />
                ))}
              </div>
              {Object.keys(summary.metaBreakdown).length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Meta — פירוט לפי פלטפורמה</p>
                  <div className="flex gap-3">
                    {Object.entries(summary.metaBreakdown).map(([key, spend]) => (
                      <Badge key={key} variant="secondary" className="text-sm py-1 px-3">
                        {key}: {formatILS(spend)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Efficiency Section */}
            <SectionCard title="יעילות" icon={<Target className="w-5 h-5" />} accentClass="text-violet-400">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard label="MER" value={summary.mer.toFixed(2) + "x"} icon={<TrendingUp className="w-5 h-5" />} highlight />
                <KPICard label="הזמנות" value={formatNum(summary.totalOrders)} icon={<ShoppingCart className="w-5 h-5" />} />
                <KPICard label="AOV" value={formatILS(summary.aov)} />
                <KPICard
                  label="CTR"
                  value={summary.totalImpressions > 0 ? formatPercent((summary.totalClicks / summary.totalImpressions) * 100) : "0%"}
                />
              </div>
            </SectionCard>

            {/* Navigation */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate("/analytics/campaigns")}>
                <BarChart3 className="w-4 h-4 ml-2" />
                ביצועי קמפיינים
              </Button>
              <Button variant="outline" onClick={() => navigate("/analytics/offline-revenue")}>
                <Wallet className="w-4 h-4 ml-2" />
                הכנסות אופליין
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function SectionCard({ title, icon, accentClass, children }: { title: string; icon: React.ReactNode; accentClass: string; children: React.ReactNode }) {
  return (
    <Card className="glass card-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className={cn("w-8 h-8 rounded-lg bg-muted flex items-center justify-center", accentClass)}>
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function KPICard({ label, value, icon, highlight }: { label: string; value: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn(
      "rounded-lg p-4 transition-all",
      highlight ? "bg-primary/10 border border-primary/30" : "bg-muted/50"
    )}>
      {icon && (
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mb-2">
          {icon}
        </div>
      )}
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
