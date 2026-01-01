import { useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight,
  Target, 
  DollarSign, 
  MousePointerClick, 
  Eye, 
  TrendingUp,
  RefreshCw,
  Loader2,
  Edit2,
  ExternalLink,
  Play,
  Pause,
  Calendar,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { CampaignEditDialog } from "@/components/campaigns/CampaignEditDialog";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

function formatCurrency(num: number): string {
  return "₪" + formatNumber(num);
}

const platformConfig: Record<string, { color: string; name: string; logo: string; externalUrl?: string }> = {
  google_ads: { 
    color: "bg-[#4285F4]", 
    name: "Google Ads", 
    logo: "https://www.gstatic.com/images/branding/product/2x/ads_48dp.png",
    externalUrl: "https://ads.google.com"
  },
  facebook_ads: { 
    color: "bg-[#1877F2]", 
    name: "Facebook Ads", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1200px-Facebook_Logo_%282019%29.png",
    externalUrl: "https://business.facebook.com/adsmanager"
  },
  internal: { 
    color: "bg-primary", 
    name: "קמפיין פנימי", 
    logo: "" 
  },
};

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  active: { color: "text-success", bg: "bg-success/10", label: "פעיל" },
  ENABLED: { color: "text-success", bg: "bg-success/10", label: "פעיל" },
  ACTIVE: { color: "text-success", bg: "bg-success/10", label: "פעיל" },
  paused: { color: "text-warning", bg: "bg-warning/10", label: "מושהה" },
  PAUSED: { color: "text-warning", bg: "bg-warning/10", label: "מושהה" },
  ended: { color: "text-muted-foreground", bg: "bg-muted", label: "הסתיים" },
  REMOVED: { color: "text-muted-foreground", bg: "bg-muted", label: "הוסר" },
  draft: { color: "text-muted-foreground", bg: "bg-muted", label: "טיוטה" },
};

export default function CampaignDetail() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") as 'internal' | 'google_ads' | 'facebook_ads' | null;
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [editingCampaign, setEditingCampaign] = useState<any>(null);

  // Fetch campaign based on source
  const { data: campaign, isLoading, refetch } = useQuery({
    queryKey: ["campaign-detail", campaignId, source, selectedClient?.id],
    queryFn: async () => {
      if (!campaignId || !selectedClient) return null;

      if (source === 'internal') {
        // Fetch from internal campaigns table
        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("id", campaignId)
          .maybeSingle();
        
        if (error) throw error;
        return data ? { ...data, source: 'internal' } : null;
      } else if (source === 'google_ads') {
        // Fetch from Google Ads API
        const { data, error } = await supabase.functions.invoke('google-ads', {
          body: { clientId: selectedClient.id }
        });
        if (error) throw error;
        
        const realId = campaignId.replace('ga_', '');
        const found = data?.campaigns?.find((c: any) => c.id === realId);
        return found ? { ...found, platform: 'google_ads', source: 'google_ads' } : null;
      } else if (source === 'facebook_ads') {
        // Fetch from Facebook Ads API
        const { data, error } = await supabase.functions.invoke('facebook-ads', {
          body: { clientId: selectedClient.id }
        });
        if (error) throw error;
        
        const realId = campaignId.replace('fb_', '');
        const found = data?.campaigns?.find((c: any) => c.id === realId);
        return found ? { ...found, platform: 'facebook_ads', source: 'facebook_ads' } : null;
      }
      
      return null;
    },
    enabled: !!campaignId && !!selectedClient && !!source,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (source !== 'internal' || !campaign?.id) {
        throw new Error("ניתן לעדכן רק קמפיינים פנימיים");
      }
      const { error } = await supabase.from("campaigns").update({ status }).eq("id", campaign.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-detail"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  const platform = platformConfig[campaign?.platform || 'internal'] || platformConfig.internal;
  const status = statusConfig[campaign?.status || 'draft'] || statusConfig.draft;

  // Mock daily data for internal campaigns
  const dailyData = useMemo(() => {
    if (!campaign) return [];
    // Generate some mock data for visualization
    const days = 14;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      return {
        date: date.toLocaleDateString("he-IL", { month: 'short', day: 'numeric' }),
        impressions: Math.floor((campaign.impressions || 1000) / days * (0.7 + Math.random() * 0.6)),
        clicks: Math.floor((campaign.clicks || 50) / days * (0.7 + Math.random() * 0.6)),
        cost: ((campaign.spent || 100) / days * (0.7 + Math.random() * 0.6)),
      };
    });
  }, [campaign]);

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <p>בחר לקוח כדי לצפות בנתונים</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/campaigns')}>
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            {isLoading ? (
              <div className="h-12 w-64 bg-muted animate-pulse rounded" />
            ) : (
              <PageHeader 
                title={campaign?.name || "קמפיין"}
                description={`${platform.name} • ${selectedClient.name}`}
              />
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            
            {source === 'internal' && campaign && (
              <Button variant="outline" onClick={() => setEditingCampaign(campaign)}>
                <Edit2 className="w-4 h-4 ml-2" />
                עריכה
              </Button>
            )}
            
            {platform.externalUrl && (
              <Button variant="outline" asChild>
                <a href={platform.externalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 ml-2" />
                  פתח ב-{platform.name}
                </a>
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !campaign ? (
          <div className="glass rounded-xl p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">הקמפיין לא נמצא</h3>
            <p className="text-muted-foreground mb-4">ייתכן שהקמפיין נמחק או שאין לך הרשאה לצפות בו</p>
            <Button onClick={() => navigate('/campaigns')}>חזרה לקמפיינים</Button>
          </div>
        ) : (
          <>
            {/* Campaign Info Card */}
            <div className="glass rounded-xl p-6 card-shadow">
              <div className="flex items-start gap-6">
                {/* Platform Logo */}
                <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0", platform.color)}>
                  {platform.logo ? (
                    <img src={platform.logo} alt={platform.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <Target className="w-8 h-8 text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold">{campaign.name}</h2>
                    <Badge variant="outline" className={cn(status.bg, status.color)}>
                      {status.label}
                    </Badge>
                    {source !== 'internal' && (
                      <Badge variant="secondary" className="text-xs">
                        API
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{platform.name}</span>
                    {campaign.start_date && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(campaign.start_date).toLocaleDateString("he-IL")}
                          {campaign.end_date && ` - ${new Date(campaign.end_date).toLocaleDateString("he-IL")}`}
                        </span>
                      </>
                    )}
                  </div>

                  {campaign.description && (
                    <p className="mt-3 text-muted-foreground">{campaign.description}</p>
                  )}
                </div>

                {/* Quick Actions for internal campaigns */}
                {source === 'internal' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate("active")}
                      disabled={campaign.status === 'active' || updateStatusMutation.isPending}
                    >
                      <Play className="w-4 h-4 ml-1" />
                      הפעל
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatusMutation.mutate("paused")}
                      disabled={campaign.status === 'paused' || updateStatusMutation.isPending}
                    >
                      <Pause className="w-4 h-4 ml-1" />
                      השהה
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { 
                  label: "תקציב", 
                  value: formatCurrency(campaign.budget || 0), 
                  icon: <DollarSign className="w-5 h-5" />, 
                  color: "bg-blue-500/20 text-blue-500" 
                },
                { 
                  label: "הוצאה", 
                  value: formatCurrency(campaign.spent || campaign.cost || 0), 
                  icon: <DollarSign className="w-5 h-5" />, 
                  color: "bg-orange-500/20 text-orange-500" 
                },
                { 
                  label: "חשיפות", 
                  value: formatNumber(campaign.impressions || 0), 
                  icon: <Eye className="w-5 h-5" />, 
                  color: "bg-indigo-500/20 text-indigo-500" 
                },
                { 
                  label: "קליקים", 
                  value: formatNumber(campaign.clicks || 0), 
                  icon: <MousePointerClick className="w-5 h-5" />, 
                  color: "bg-green-500/20 text-green-500" 
                },
                { 
                  label: "המרות", 
                  value: formatNumber(campaign.conversions || 0), 
                  icon: <Target className="w-5 h-5" />, 
                  color: "bg-purple-500/20 text-purple-500" 
                },
                { 
                  label: "CTR", 
                  value: `${(campaign.ctr || (campaign.impressions ? (campaign.clicks / campaign.impressions) * 100 : 0)).toFixed(2)}%`, 
                  icon: <TrendingUp className="w-5 h-5" />, 
                  color: "bg-cyan-500/20 text-cyan-500" 
                },
                { 
                  label: "CPC", 
                  value: formatCurrency(campaign.cpc || campaign.avgCpc || (campaign.clicks ? (campaign.spent || campaign.cost || 0) / campaign.clicks : 0)), 
                  icon: <DollarSign className="w-5 h-5" />, 
                  color: "bg-pink-500/20 text-pink-500" 
                },
              ].map((metric) => (
                <div key={metric.label} className="glass rounded-xl p-4 card-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", metric.color)}>
                      {metric.icon}
                    </div>
                  </div>
                  <p className="text-xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </div>
              ))}
            </div>

            {/* Budget Usage */}
            {campaign.budget && campaign.budget > 0 && (
              <div className="glass rounded-xl p-6 card-shadow">
                <h3 className="font-bold text-lg mb-4">ניצול תקציב</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {formatCurrency(campaign.spent || campaign.cost || 0)} מתוך {formatCurrency(campaign.budget)}
                    </span>
                    <span className="font-bold">
                      {(((campaign.spent || campaign.cost || 0) / campaign.budget) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        ((campaign.spent || campaign.cost || 0) / campaign.budget) > 0.9 ? "bg-destructive" : 
                        ((campaign.spent || campaign.cost || 0) / campaign.budget) > 0.7 ? "bg-warning" : "bg-primary"
                      )}
                      style={{ width: `${Math.min(((campaign.spent || campaign.cost || 0) / campaign.budget) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Performance Chart */}
            <div className="glass rounded-xl p-6 card-shadow">
              <h3 className="font-bold text-lg mb-4">ביצועים לאורך זמן</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="impressions" stroke="#3b82f6" fill="url(#colorImpressions)" name="חשיפות" />
                    <Area type="monotone" dataKey="clicks" stroke="#22c55e" fill="url(#colorClicks)" name="קליקים" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* External Platform Note */}
            {source !== 'internal' && (
              <div className="glass rounded-xl p-6 card-shadow border-r-4 border-warning">
                <div className="flex items-start gap-4">
                  <ExternalLink className="w-6 h-6 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1">קמפיין מ-{platform.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      קמפיין זה מנוהל ב-{platform.name}. כדי לערוך אותו או לשנות את ההגדרות שלו, יש לגשת ישירות לפלטפורמה.
                    </p>
                    {platform.externalUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={platform.externalUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 ml-2" />
                          ערוך ב-{platform.name}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Edit Dialog */}
        {editingCampaign && (
          <CampaignEditDialog 
            campaign={editingCampaign}
            open={!!editingCampaign}
            onOpenChange={(open) => !open && setEditingCampaign(null)}
          />
        )}
      </div>
    </MainLayout>
  );
}
