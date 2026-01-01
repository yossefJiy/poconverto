import { useState, useMemo } from "react";
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
import { GoogleAdsCampaigns } from "@/components/campaigns/GoogleAdsCampaigns";
import { Badge } from "@/components/ui/badge";

const platformConfig: Record<string, { color: string; name: string; icon?: string }> = {
  google: { color: "bg-[#4285F4]", name: "Google Ads" },
  google_ads: { color: "bg-[#4285F4]", name: "Google Ads" },
  facebook: { color: "bg-[#1877F2]", name: "Facebook Ads" },
  facebook_ads: { color: "bg-[#1877F2]", name: "Facebook Ads" },
  instagram: { color: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737]", name: "Instagram" },
  linkedin: { color: "bg-[#0A66C2]", name: "LinkedIn" },
  tiktok: { color: "bg-[#000000]", name: "TikTok" },
  internal: { color: "bg-primary", name: "פנימי" },
};

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string; isActive: boolean }> = {
  active: { icon: Play, color: "text-success", bg: "bg-success/10", label: "פעיל", isActive: true },
  ENABLED: { icon: Play, color: "text-success", bg: "bg-success/10", label: "פעיל", isActive: true },
  paused: { icon: Pause, color: "text-warning", bg: "bg-warning/10", label: "מושהה", isActive: false },
  PAUSED: { icon: Pause, color: "text-warning", bg: "bg-warning/10", label: "מושהה", isActive: false },
  ended: { icon: null, color: "text-muted-foreground", bg: "bg-muted", label: "הסתיים", isActive: false },
  REMOVED: { icon: null, color: "text-muted-foreground", bg: "bg-muted", label: "הוסר", isActive: false },
  draft: { icon: null, color: "text-muted-foreground", bg: "bg-muted", label: "טיוטה", isActive: false },
};

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
}

export default function Campaigns() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    platform: "facebook",
    budget: "",
    start_date: "",
    end_date: "",
    description: "",
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
        platform: c.platform || 'internal',
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
        source: 'internal',
      });
    });

    // Add Google Ads campaigns
    if (googleAdsData?.campaigns) {
      googleAdsData.campaigns.forEach((c: any) => {
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
        });
      });
    }

    // Add Facebook Ads campaigns
    if (facebookAdsData?.campaigns) {
      facebookAdsData.campaigns.forEach((c: any) => {
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
        });
      });
    }

    return campaigns;
  }, [internalCampaigns, googleAdsData, facebookAdsData]);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    if (!showActiveOnly) return allCampaigns;
    return allCampaigns.filter(c => {
      const statusInfo = statusConfig[c.status];
      return statusInfo?.isActive ?? false;
    });
  }, [allCampaigns, showActiveOnly]);

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
      setNewCampaign({ name: "", platform: "facebook", budget: "", start_date: "", end_date: "", description: "" });
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

  return (
    <MainLayout>
      <div className="p-8">
        <PageHeader 
          title={selectedClient ? `קמפיינים - ${selectedClient.name}` : "ניהול קמפיינים"}
          description="נתונים בזמן אמת ומעקב ביצועים"
          actions={
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button className="glow" disabled={!selectedClient}>
                  <Plus className="w-4 h-4 ml-2" />
                  קמפיין חדש
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>קמפיין חדש</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="שם הקמפיין"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  />
                  <Select
                    value={newCampaign.platform}
                    onValueChange={(v) => setNewCampaign({ ...newCampaign, platform: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="פלטפורמה" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(platformConfig).map(([key, { name }]) => (
                        <SelectItem key={key} value={key}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          <Tabs defaultValue="all" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="glass">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  כל הקמפיינים
                </TabsTrigger>
                <TabsTrigger value="google-ads" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Google Ads
                </TabsTrigger>
                <TabsTrigger value="internal" className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4" />
                  קמפיינים פנימיים
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Switch
                  id="active-filter"
                  checked={showActiveOnly}
                  onCheckedChange={setShowActiveOnly}
                />
                <Label htmlFor="active-filter" className="text-sm text-muted-foreground cursor-pointer">
                  הצג פעילים בלבד
                </Label>
              </div>
            </div>

            <TabsContent value="all">
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
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
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
                  
                  {filteredCampaigns.map((campaign, index) => {
                    const status = statusConfig[campaign.status] || statusConfig.draft;
                    const platform = platformConfig[campaign.platform] || { color: "bg-muted", name: campaign.platform };
                    const budgetUsed = campaign.budget && campaign.budget > 0 ? ((campaign.spent || 0) / campaign.budget) * 100 : 0;
                    const StatusIcon = status.icon;

                    return (
                      <div 
                        key={campaign.id}
                        className="glass rounded-xl card-shadow opacity-0 animate-slide-up overflow-hidden"
                        style={{ animationDelay: `${0.05 * index}s`, animationFillMode: "forwards" }}
                      >
                        <div className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Platform Badge */}
                            <div className={cn("w-10 h-10 rounded-lg flex-shrink-0", platform.color)} />
                            
                            {/* Campaign Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold truncate">{campaign.name}</h3>
                                <Badge variant="outline" className={cn(status.bg, status.color, "text-xs")}>
                                  {StatusIcon && <StatusIcon className="w-3 h-3 ml-1" />}
                                  {status.label}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {platform.name}
                                </Badge>
                                {campaign.source !== 'internal' && (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">
                                    API
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Metrics */}
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-center">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <DollarSign className="w-3 h-3" />
                                  <span className="text-xs">הוצאה</span>
                                </div>
                                <p className="font-bold">₪{(campaign.spent || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Eye className="w-3 h-3" />
                                  <span className="text-xs">חשיפות</span>
                                </div>
                                <p className="font-bold">{((campaign.impressions || 0) / 1000).toFixed(0)}K</p>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <MousePointer className="w-3 h-3" />
                                  <span className="text-xs">קליקים</span>
                                </div>
                                <p className="font-bold">{(campaign.clicks || 0).toLocaleString()}</p>
                              </div>
                              <div className="text-center">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <TrendingUp className="w-3 h-3" />
                                  <span className="text-xs">המרות</span>
                                </div>
                                <p className="font-bold">{(campaign.conversions || 0).toFixed(1)}</p>
                              </div>
                              <div className="text-center">
                                <span className="text-xs text-muted-foreground">CTR</span>
                                <p className="font-bold">{(campaign.ctr || 0).toFixed(2)}%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="google-ads">
              <GoogleAdsCampaigns />
            </TabsContent>

            <TabsContent value="internal">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : internalCampaigns.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                  <Megaphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">אין קמפיינים עדיין</h3>
                  <p className="text-muted-foreground">צור קמפיין חדש כדי להתחיל</p>
                </div>
              ) : (
                <div className="space-y-4">
            {internalCampaigns.map((campaign, index) => {
              const status = statusConfig[campaign.status] || statusConfig.draft;
              const platform = platformConfig[campaign.platform] || { color: "bg-muted", name: campaign.platform };
              const budgetUsed = campaign.budget > 0 ? ((campaign.spent || 0) / campaign.budget) * 100 : 0;
              const StatusIcon = status.icon;

              return (
                <div 
                  key={campaign.id}
                  className="glass rounded-xl card-shadow opacity-0 animate-slide-up overflow-hidden"
                  style={{ animationDelay: `${0.1 + index * 0.1}s`, animationFillMode: "forwards" }}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex-shrink-0", platform.color)} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold truncate">{campaign.name}</h3>
                          <span className={cn(
                            "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
                            status.bg, status.color
                          )}>
                            {StatusIcon && <StatusIcon className="w-3 h-3" />}
                            {status.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-xs">הוצאה</span>
                            </div>
                            <p className="font-bold">₪{(campaign.spent || 0).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">מתוך ₪{(campaign.budget || 0).toLocaleString()}</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <Eye className="w-4 h-4" />
                              <span className="text-xs">חשיפות</span>
                            </div>
                            <p className="font-bold">{((campaign.impressions || 0) / 1000).toFixed(0)}K</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <MousePointer className="w-4 h-4" />
                              <span className="text-xs">קליקים</span>
                            </div>
                            <p className="font-bold">{(campaign.clicks || 0).toLocaleString()}</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs">המרות</span>
                            </div>
                            <p className="font-bold">{campaign.conversions || 0}</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3">
                            <span className="text-xs text-muted-foreground">CTR</span>
                            <p className="font-bold">
                              {campaign.impressions ? ((campaign.clicks || 0) / campaign.impressions * 100).toFixed(2) : 0}%
                            </p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3">
                            <span className="text-xs text-muted-foreground">CPC</span>
                            <p className="font-bold">
                              ₪{campaign.clicks ? ((campaign.spent || 0) / campaign.clicks).toFixed(2) : 0}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">ניצול תקציב</span>
                            <span className="font-medium">{budgetUsed.toFixed(0)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                budgetUsed > 90 ? "bg-destructive" : budgetUsed > 70 ? "bg-warning" : "bg-primary"
                              )}
                              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                            />
                          </div>
                        </div>

                        {campaign.description && (
                          <div className="bg-muted/20 rounded-lg p-4 border-r-4 border-primary">
                            <p className="text-sm text-muted-foreground">{campaign.description}</p>
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingCampaign(campaign)}>
                            <Edit2 className="w-4 h-4 ml-2" />
                            ערוך
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: "active" })}>
                            <Play className="w-4 h-4 ml-2" />
                            הפעל
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: campaign.id, status: "paused" })}>
                            <Pause className="w-4 h-4 ml-2" />
                            השהה
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteId(campaign.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            מחק
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
              )}
            </TabsContent>
          </Tabs>
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
