import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Play, 
  Pause, 
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  Calendar,
  Plus,
  MoreVertical,
  Loader2,
  Megaphone,
  Edit2,
  Trash2,
  Target,
  Filter,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CampaignEditDialog } from "@/components/campaigns/CampaignEditDialog";
import { CampaignAssets } from "@/components/campaigns/CampaignAssets";
import { Badge } from "@/components/ui/badge";

const platformConfig: Record<string, { color: string; name: string; logo: string; canCreate: boolean }> = {
  google_ads: { 
    color: "bg-[#4285F4]", 
    name: "Google Ads", 
    logo: "https://www.gstatic.com/images/branding/product/2x/ads_48dp.png",
    canCreate: false,
  },
  facebook_ads: { 
    color: "bg-[#1877F2]", 
    name: "Facebook Ads", 
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/1200px-Facebook_Logo_%282019%29.png",
    canCreate: false,
  },
  internal: { 
    color: "bg-primary", 
    name: "פנימי", 
    logo: "",
    canCreate: true,
  },
};

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string; isActive: boolean }> = {
  active: { icon: Play, color: "text-success", bg: "bg-success/10", label: "פעיל", isActive: true },
  ENABLED: { icon: Play, color: "text-success", bg: "bg-success/10", label: "פעיל", isActive: true },
  ACTIVE: { icon: Play, color: "text-success", bg: "bg-success/10", label: "פעיל", isActive: true },
  paused: { icon: Pause, color: "text-warning", bg: "bg-warning/10", label: "מושהה", isActive: false },
  PAUSED: { icon: Pause, color: "text-warning", bg: "bg-warning/10", label: "מושהה", isActive: false },
  ended: { icon: null, color: "text-muted-foreground", bg: "bg-muted", label: "הסתיים", isActive: false },
  REMOVED: { icon: null, color: "text-muted-foreground", bg: "bg-muted", label: "הוסר", isActive: false },
  draft: { icon: null, color: "text-muted-foreground", bg: "bg-muted", label: "טיוטה", isActive: false },
};

interface CampaignAdSet {
  id: string;
  name: string;
  status?: string;
  targeting?: string;
  budget?: number;
  impressions?: number;
  clicks?: number;
}

interface CampaignAd {
  id: string;
  name: string;
  status?: string;
  creative_type?: string;
  impressions?: number;
  clicks?: number;
}

interface CampaignAsset {
  id: string;
  name: string;
  type: string;
  url?: string;
}

interface UnifiedCampaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget?: number;
  spent?: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  ctr?: number;
  cpc?: number;
  start_date?: string;
  end_date?: string;
  source: 'internal' | 'google_ads' | 'facebook_ads';
  description?: string;
  adSets?: CampaignAdSet[];
  ads?: CampaignAd[];
  assets?: CampaignAsset[];
  audiences?: string[];
}

interface ClientAdsUrls {
  google_ads_manager_url?: string | null;
  facebook_ads_manager_url?: string | null;
}

export default function Campaigns() {
  const navigate = useNavigate();
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    platform: "internal",
    budget: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  // Fetch client ads manager URLs
  const { data: clientAdsUrls } = useQuery<ClientAdsUrls>({
    queryKey: ["client-ads-urls", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return {};
      const { data, error } = await supabase
        .from("clients")
        .select("google_ads_manager_url, facebook_ads_manager_url")
        .eq("id", selectedClient.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  // Fetch internal campaigns
  const { data: internalCampaigns = [], isLoading: isLoadingInternal } = useQuery({
    queryKey: ["campaigns", selectedClient?.id],
    queryFn: async () => {
      let query = supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  // Fetch Google Ads campaigns
  const { data: googleAdsData, isLoading: isLoadingGoogleAds } = useQuery({
    queryKey: ["google-ads-campaigns", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return null;
      const { data, error } = await supabase.functions.invoke('google-ads', {
        body: { clientId: selectedClient.id }
      });
      if (error) return null;
      if (data?.error) return null;
      return data;
    },
    enabled: !!selectedClient,
  });

  // Fetch Facebook Ads campaigns
  const { data: facebookAdsData, isLoading: isLoadingFacebookAds } = useQuery({
    queryKey: ["facebook-ads-campaigns", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return null;
      const { data, error } = await supabase.functions.invoke('facebook-ads', {
        body: { clientId: selectedClient.id }
      });
      if (error) return null;
      if (data?.error) return null;
      return data;
    },
    enabled: !!selectedClient,
  });

  // Unify all campaigns
  const allCampaigns = useMemo((): UnifiedCampaign[] => {
    const campaigns: UnifiedCampaign[] = [];

    // Add internal campaigns
    internalCampaigns.forEach(c => {
      campaigns.push({
        id: c.id,
        name: c.name,
        platform: 'internal',
        status: c.status,
        budget: c.budget,
        spent: c.spent,
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.conversions,
        ctr: c.impressions ? (c.clicks || 0) / c.impressions * 100 : 0,
        cpc: c.clicks ? (c.spent || 0) / c.clicks : 0,
        start_date: c.start_date,
        end_date: c.end_date,
        description: c.description,
        source: 'internal',
      });
    });

    // Add Google Ads campaigns with ad groups
    if (googleAdsData?.campaigns) {
      const adGroups = googleAdsData.adGroups || [];
      
      googleAdsData.campaigns.forEach((c: any) => {
        // Find ad groups for this campaign
        const campaignAdGroups = adGroups.filter((ag: any) => ag.campaignId === c.id);
        
        campaigns.push({
          id: `ga_${c.id}`,
          name: c.name,
          platform: 'google_ads',
          status: c.status,
          budget: c.budget,
          spent: c.cost,
          impressions: c.impressions,
          clicks: c.clicks,
          conversions: c.conversions,
          ctr: c.ctr,
          cpc: c.avgCpc,
          source: 'google_ads',
          adSets: campaignAdGroups.map((ag: any) => ({
            id: ag.id,
            name: ag.name,
            status: ag.status,
            impressions: ag.impressions,
            clicks: ag.clicks,
          })),
          assets: googleAdsData.assets?.map((a: any) => ({
            id: a.id || a.resourceName,
            name: a.name || a.type,
            type: a.type,
          })) || [],
        });
      });
    }

    // Add Facebook Ads campaigns with ad sets and ads
    if (facebookAdsData?.campaigns) {
      const adSets = facebookAdsData.adSets || [];
      const ads = facebookAdsData.ads || [];
      
      facebookAdsData.campaigns.forEach((c: any) => {
        // Find ad sets and ads for this campaign
        const campaignAdSets = adSets.filter((as: any) => as.campaign_id === c.id);
        const campaignAds = ads.filter((ad: any) => 
          campaignAdSets.some((as: any) => as.id === ad.adset_id)
        );
        
        campaigns.push({
          id: `fb_${c.id}`,
          name: c.name,
          platform: 'facebook_ads',
          status: c.status === 'ACTIVE' ? 'ENABLED' : c.status,
          budget: c.budget,
          spent: c.spend,
          impressions: c.impressions,
          clicks: c.clicks,
          conversions: c.conversions,
          ctr: c.ctr,
          cpc: c.cpc,
          source: 'facebook_ads',
          adSets: campaignAdSets.map((as: any) => ({
            id: as.id,
            name: as.name,
            status: as.status,
            targeting: as.targeting_summary,
            impressions: as.impressions,
            clicks: as.clicks,
          })),
          ads: campaignAds.map((ad: any) => ({
            id: ad.id,
            name: ad.name,
            status: ad.status,
            creative_type: ad.creative_type,
          })),
          audiences: c.audiences || [],
        });
      });
    }

    return campaigns;
  }, [internalCampaigns, googleAdsData, facebookAdsData]);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = allCampaigns;
    
    if (showActiveOnly) {
      filtered = filtered.filter(c => {
        const statusInfo = statusConfig[c.status];
        return statusInfo?.isActive ?? false;
      });
    }
    
    if (platformFilter !== "all") {
      filtered = filtered.filter(c => c.platform === platformFilter);
    }
    
    return filtered;
  }, [allCampaigns, showActiveOnly, platformFilter]);

  const isLoading = isLoadingInternal || isLoadingGoogleAds || isLoadingFacebookAds;

  const createMutation = useMutation({
    mutationFn: async (campaign: typeof newCampaign) => {
      if (!selectedClient) throw new Error("בחר לקוח");
      const { error } = await supabase.from("campaigns").insert({
        client_id: selectedClient.id,
        name: campaign.name,
        platform: campaign.platform,
        budget: parseFloat(campaign.budget) || 0,
        start_date: campaign.start_date || null,
        end_date: campaign.end_date || null,
        description: campaign.description,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("הקמפיין נוצר בהצלחה");
      setShowDialog(false);
      setNewCampaign({ name: "", platform: "internal", budget: "", start_date: "", end_date: "", description: "" });
    },
    onError: () => toast.error("שגיאה ביצירת קמפיין"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("הסטטוס עודכן");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("הקמפיין נמחק");
      setDeleteId(null);
    },
  });

  const handleCampaignClick = (campaign: UnifiedCampaign) => {
    navigate(`/campaigns/${campaign.id}?source=${campaign.source}`);
  };

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, google_ads: 0, facebook_ads: 0, internal: 0 };
    allCampaigns.forEach(c => {
      counts.all++;
      counts[c.platform]++;
    });
    return counts;
  }, [allCampaigns]);

  return (
    <MainLayout>
      <div className="p-8">
        <PageHeader 
          title="קמפיינים"
          description="צפייה בכל הקמפיינים מכל הפלטפורמות"
          actions={
            <div className="flex items-center gap-2">
              {/* External Platform Links */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 ml-2" />
                    צור בפלטפורמה
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a 
                      href={clientAdsUrls?.google_ads_manager_url || "https://ads.google.com/aw/campaigns/new"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <img 
                        src="https://www.gstatic.com/images/branding/product/2x/ads_48dp.png" 
                        alt="Google Ads" 
                        className="w-4 h-4"
                      />
                      Google Ads
                      {clientAdsUrls?.google_ads_manager_url && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">ישיר</Badge>
                      )}
                      <ExternalLink className="w-3 h-3 mr-auto" />
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a 
                      href={clientAdsUrls?.facebook_ads_manager_url || "https://business.facebook.com/adsmanager/manage/campaigns"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <div className="w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">f</span>
                      </div>
                      Facebook Ads
                      {clientAdsUrls?.facebook_ads_manager_url && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">ישיר</Badge>
                      )}
                      <ExternalLink className="w-3 h-3 mr-auto" />
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Internal Campaign Dialog */}
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button className="glow" disabled={!selectedClient}>
                    <Plus className="w-4 h-4 ml-2" />
                    קמפיין פנימי
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>קמפיין פנימי חדש</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input
                      placeholder="שם הקמפיין"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    />
                    <Input
                      type="number"
                      placeholder="תקציב (₪)"
                      value={newCampaign.budget}
                      onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">תאריך התחלה</label>
                        <Input
                          type="date"
                          value={newCampaign.start_date}
                          onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">תאריך סיום</label>
                        <Input
                          type="date"
                          value={newCampaign.end_date}
                          onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <Textarea
                      placeholder="תיאור"
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                    />
                    <Button 
                      className="w-full" 
                      onClick={() => createMutation.mutate(newCampaign)}
                      disabled={!newCampaign.name || createMutation.isPending}
                    >
                      {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "צור קמפיין"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          }
        />

        {!selectedClient && (
          <div className="glass rounded-xl p-12 text-center mb-8">
            <Megaphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח</h3>
            <p className="text-muted-foreground">בחר לקוח מהתפריט הצדדי כדי לנהל קמפיינים</p>
          </div>
        )}

        {selectedClient && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-48 glass">
                    <Filter className="w-4 h-4 ml-2" />
                    <SelectValue placeholder="כל הפלטפורמות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הפלטפורמות ({platformCounts.all})</SelectItem>
                    <SelectItem value="google_ads">Google Ads ({platformCounts.google_ads})</SelectItem>
                    <SelectItem value="facebook_ads">Facebook Ads ({platformCounts.facebook_ads})</SelectItem>
                    <SelectItem value="internal">פנימי ({platformCounts.internal})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="active-filter"
                  checked={showActiveOnly}
                  onCheckedChange={setShowActiveOnly}
                />
                <Label htmlFor="active-filter" className="text-sm text-muted-foreground cursor-pointer">
                  פעילים בלבד
                </Label>
              </div>
            </div>

            {/* Campaign Stats */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10">
                {filteredCampaigns.length} קמפיינים
              </Badge>
              {showActiveOnly && (
                <Badge variant="secondary" className="bg-success/10 text-success">
                  <Play className="w-3 h-3 ml-1" />
                  פעילים בלבד
                </Badge>
              )}
            </div>

            {/* Campaigns Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="glass rounded-xl p-12 text-center">
                <Megaphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {showActiveOnly ? "אין קמפיינים פעילים" : "אין קמפיינים"}
                </h3>
                <p className="text-muted-foreground">
                  {showActiveOnly ? "כל הקמפיינים מושהים או הסתיימו" : "צור קמפיין חדש כדי להתחיל"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredCampaigns.map((campaign, index) => {
                  const status = statusConfig[campaign.status] || statusConfig.draft;
                  const platform = platformConfig[campaign.platform] || platformConfig.internal;
                  const budgetUsed = campaign.budget && campaign.budget > 0 ? ((campaign.spent || 0) / campaign.budget) * 100 : 0;
                  const StatusIcon = status.icon;

                  return (
                    <div 
                      key={campaign.id}
                      className="glass rounded-xl card-shadow opacity-0 animate-slide-up overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                      style={{ animationDelay: `${0.03 * index}s`, animationFillMode: "forwards" }}
                      onClick={() => handleCampaignClick(campaign)}
                    >
                      <div className="p-5">
                        <div className="flex items-center gap-4">
                          {/* Platform Logo */}
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", platform.color)}>
                            {platform.logo ? (
                              <img src={platform.logo} alt={platform.name} className="w-7 h-7 object-contain" />
                            ) : (
                              <Target className="w-6 h-6 text-white" />
                            )}
                          </div>
                          
                          {/* Campaign Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-bold text-lg truncate">{campaign.name}</h3>
                              <Badge variant="outline" className={cn(status.bg, status.color, "text-xs")}>
                                {StatusIcon && <StatusIcon className="w-3 h-3 ml-1" />}
                                {status.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{platform.name}</span>
                              {campaign.source !== 'internal' && (
                                <>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-xs py-0 h-5">API</Badge>
                                </>
                              )}
                              {(campaign.start_date || campaign.end_date) && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {campaign.start_date && campaign.end_date ? (
                                      <>
                                        {new Date(campaign.start_date).toLocaleDateString("he-IL")} - {new Date(campaign.end_date).toLocaleDateString("he-IL")}
                                      </>
                                    ) : campaign.start_date ? (
                                      <>מ-{new Date(campaign.start_date).toLocaleDateString("he-IL")}</>
                                    ) : (
                                      <>עד {new Date(campaign.end_date!).toLocaleDateString("he-IL")}</>
                                    )}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Metrics */}
                          <div className="hidden md:flex items-center gap-6 text-sm">
                            <div className="text-center min-w-[70px]">
                              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                                <DollarSign className="w-3 h-3" />
                                <span className="text-xs">הוצאה</span>
                              </div>
                              <p className="font-bold">₪{((campaign.spent || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div className="text-center min-w-[60px]">
                              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                                <Eye className="w-3 h-3" />
                                <span className="text-xs">חשיפות</span>
                              </div>
                              <p className="font-bold">{((campaign.impressions || 0) / 1000).toFixed(0)}K</p>
                            </div>
                            <div className="text-center min-w-[60px]">
                              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                                <MousePointer className="w-3 h-3" />
                                <span className="text-xs">קליקים</span>
                              </div>
                              <p className="font-bold">{(campaign.clicks || 0).toLocaleString()}</p>
                            </div>
                            <div className="text-center min-w-[50px]">
                              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                                <TrendingUp className="w-3 h-3" />
                                <span className="text-xs">CTR</span>
                              </div>
                              <p className="font-bold">{(campaign.ctr || 0).toFixed(2)}%</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {campaign.source === 'internal' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingCampaign(campaign)}>
                                    <Edit2 className="w-4 h-4 ml-2" />
                                    עריכה
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: "active" })}>
                                    <Play className="w-4 h-4 ml-2" />
                                    הפעל
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: "paused" })}>
                                    <Pause className="w-4 h-4 ml-2" />
                                    השהה
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => setDeleteId(campaign.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    מחק
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>

                        {/* Budget Progress for internal */}
                        {campaign.source === 'internal' && campaign.budget && campaign.budget > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">ניצול תקציב</span>
                              <span className="font-medium">{budgetUsed.toFixed(0)}% (₪{(campaign.spent || 0).toLocaleString()} / ₪{campaign.budget.toLocaleString()})</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all duration-500",
                                  budgetUsed > 90 ? "bg-destructive" : budgetUsed > 70 ? "bg-warning" : "bg-primary"
                                )}
                                style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Campaign Assets for external campaigns */}
                        {campaign.source !== 'internal' && (
                          <CampaignAssets
                            adSets={campaign.adSets}
                            ads={campaign.ads}
                            assets={campaign.assets}
                            audiences={campaign.audiences}
                            platform={campaign.source}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Edit Dialog */}
        {editingCampaign && (
          <CampaignEditDialog 
            campaign={editingCampaign}
            open={!!editingCampaign}
            onOpenChange={(open) => !open && setEditingCampaign(null)}
          />
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו תמחק את הקמפיין לצמיתות.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
