import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import {
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Eye,
  MousePointer,
  DollarSign,
  TrendingUp,
  Target,
  Loader2,
  AlertCircle,
  Layers,
  BarChart3,
  Percent,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Campaign {
  id: string;
  name: string;
  status: string;
  channelType: string;
  budget: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  avgCpc: number;
}

interface AdGroup {
  id: string;
  name: string;
  status: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

interface GoogleAdsData {
  campaigns: Campaign[];
  adGroups: AdGroup[];
  daily: any[];
  keywords: any[];
  account: any;
  dateRange: { startDate: string; endDate: string };
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  ENABLED: { icon: Play, color: "text-success", bg: "bg-success/10", label: "פעיל" },
  PAUSED: { icon: Pause, color: "text-warning", bg: "bg-warning/10", label: "מושהה" },
  REMOVED: { icon: null, color: "text-muted-foreground", bg: "bg-muted", label: "הוסר" },
};

const channelTypeLabels: Record<string, string> = {
  SEARCH: "חיפוש",
  DISPLAY: "תצוגה",
  SHOPPING: "קניות",
  VIDEO: "וידאו",
  MULTI_CHANNEL: "מרובה ערוצים",
  PERFORMANCE_MAX: "Performance Max",
  DEMAND_GEN: "Demand Gen",
};

export function GoogleAdsCampaigns() {
  const { selectedClient } = useClient();
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());

  const { data, isLoading, error, refetch, isRefetching } = useQuery<GoogleAdsData>({
    queryKey: ["google-ads-campaigns", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) throw new Error("No client selected");
      
      const { data, error } = await supabase.functions.invoke('google-ads', {
        body: { clientId: selectedClient.id }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    enabled: !!selectedClient,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(campaignId)) {
        next.delete(campaignId);
      } else {
        next.add(campaignId);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (data?.campaigns) {
      setExpandedCampaigns(new Set(data.campaigns.map(c => c.id)));
    }
  };

  const collapseAll = () => {
    setExpandedCampaigns(new Set());
  };

  // Calculate totals for contribution percentages
  const totalCost = data?.campaigns?.reduce((sum, c) => sum + c.cost, 0) || 1;
  const totalConversions = data?.campaigns?.reduce((sum, c) => sum + c.conversions, 0) || 1;
  const totalClicks = data?.campaigns?.reduce((sum, c) => sum + c.clicks, 0) || 1;

  // Get ad groups for a specific campaign
  const getAdGroupsForCampaign = (campaignName: string): AdGroup[] => {
    return data?.adGroups?.filter(ag => ag.campaignName === campaignName) || [];
  };

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">טוען קמפיינים מ-Google Ads...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-xl p-8 border border-destructive/30">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="w-6 h-6" />
          <div>
            <h4 className="font-semibold">שגיאה בטעינת נתונים</h4>
            <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.campaigns?.length) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">אין קמפיינים</h3>
        <p className="text-muted-foreground">לא נמצאו קמפיינים פעילים ב-Google Ads</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#4285F4] flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold">קמפיינים מ-Google Ads</h3>
            <p className="text-xs text-muted-foreground">
              {data.campaigns.length} קמפיינים • {data.dateRange.startDate} עד {data.dateRange.endDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={expandAll}>
            פתח הכל
          </Button>
          <Button variant="ghost" size="sm" onClick={collapseAll}>
            סגור הכל
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("w-4 h-4 ml-1", isRefetching && "animate-spin")} />
            רענן
          </Button>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-3">
        {data.campaigns.map((campaign, index) => {
          const isExpanded = expandedCampaigns.has(campaign.id);
          const status = statusConfig[campaign.status] || statusConfig.PAUSED;
          const StatusIcon = status.icon;
          const adGroups = getAdGroupsForCampaign(campaign.name);
          
          // Calculate contribution percentages
          const costContribution = (campaign.cost / totalCost) * 100;
          const conversionContribution = (campaign.conversions / totalConversions) * 100;
          const clickContribution = (campaign.clicks / totalClicks) * 100;

          // Calculate ad group totals for this campaign
          const campaignAdGroupCost = adGroups.reduce((sum, ag) => sum + ag.cost, 0) || 1;
          const campaignAdGroupConversions = adGroups.reduce((sum, ag) => sum + ag.conversions, 0) || 1;

          return (
            <Collapsible
              key={campaign.id}
              open={isExpanded}
              onOpenChange={() => toggleCampaign(campaign.id)}
            >
              <div 
                className="glass rounded-xl card-shadow overflow-hidden opacity-0 animate-slide-up"
                style={{ animationDelay: `${0.05 * index}s`, animationFillMode: "forwards" }}
              >
                {/* Campaign Header */}
                <CollapsibleTrigger asChild>
                  <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Expand Icon */}
                      <div className="text-muted-foreground">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>

                      {/* Campaign Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold truncate">{campaign.name}</h4>
                          <Badge variant="outline" className={cn(status.bg, status.color, "text-xs")}>
                            {StatusIcon && <StatusIcon className="w-3 h-3 ml-1" />}
                            {status.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {channelTypeLabels[campaign.channelType] || campaign.channelType}
                          </Badge>
                          {adGroups.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Layers className="w-3 h-3 ml-1" />
                              {adGroups.length} נכסים
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Campaign Metrics */}
                      <div className="flex items-center gap-6 text-sm">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="text-center">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <DollarSign className="w-3 h-3" />
                                  <span className="text-xs">הוצאה</span>
                                </div>
                                <p className="font-bold">₪{campaign.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{costContribution.toFixed(1)}% מהתקציב הכולל</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="w-3 h-3" />
                            <span className="text-xs">חשיפות</span>
                          </div>
                          <p className="font-bold">{(campaign.impressions / 1000).toFixed(0)}K</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MousePointer className="w-3 h-3" />
                            <span className="text-xs">קליקים</span>
                          </div>
                          <p className="font-bold">{campaign.clicks.toLocaleString()}</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-xs">המרות</span>
                          </div>
                          <p className="font-bold">{campaign.conversions.toFixed(1)}</p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Percent className="w-3 h-3" />
                            <span className="text-xs">CTR</span>
                          </div>
                          <p className="font-bold">{campaign.ctr.toFixed(2)}%</p>
                        </div>

                        <div className="text-center min-w-[80px]">
                          <div className="text-xs text-muted-foreground mb-1">תרומה</div>
                          <div className="flex items-center gap-1">
                            <Progress value={conversionContribution} className="h-2 w-16" />
                            <span className="text-xs font-medium">{conversionContribution.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Ad Groups (Expanded Content) */}
                <CollapsibleContent>
                  <div className="border-t border-border/50 bg-muted/20">
                    {adGroups.length > 0 ? (
                      <div className="p-4 space-y-2">
                        <h5 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                          <Layers className="w-4 h-4" />
                          נכסים (Ad Groups)
                        </h5>
                        {adGroups.map((adGroup, agIndex) => {
                          const agStatus = statusConfig[adGroup.status] || statusConfig.PAUSED;
                          const AgStatusIcon = agStatus.icon;
                          const agCostContribution = (adGroup.cost / campaignAdGroupCost) * 100;
                          const agConversionContribution = (adGroup.conversions / campaignAdGroupConversions) * 100;
                          const agCtr = adGroup.impressions > 0 ? (adGroup.clicks / adGroup.impressions) * 100 : 0;
                          const agCpc = adGroup.clicks > 0 ? adGroup.cost / adGroup.clicks : 0;

                          return (
                            <div 
                              key={adGroup.id}
                              className="bg-background/50 rounded-lg p-3 border border-border/30 hover:border-primary/30 transition-colors opacity-0 animate-fade-in"
                              style={{ animationDelay: `${0.05 * agIndex}s`, animationFillMode: "forwards" }}
                            >
                              <div className="flex items-center gap-4">
                                {/* Ad Group Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">{adGroup.name}</span>
                                    <Badge variant="outline" className={cn(agStatus.bg, agStatus.color, "text-xs")}>
                                      {AgStatusIcon && <AgStatusIcon className="w-2 h-2 ml-1" />}
                                      {agStatus.label}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Ad Group Metrics */}
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="text-center">
                                    <span className="text-xs text-muted-foreground">הוצאה</span>
                                    <p className="font-medium">₪{adGroup.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-xs text-muted-foreground">קליקים</span>
                                    <p className="font-medium">{adGroup.clicks.toLocaleString()}</p>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-xs text-muted-foreground">המרות</span>
                                    <p className="font-medium">{adGroup.conversions.toFixed(1)}</p>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-xs text-muted-foreground">CTR</span>
                                    <p className="font-medium">{agCtr.toFixed(2)}%</p>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-xs text-muted-foreground">CPC</span>
                                    <p className="font-medium">₪{agCpc.toFixed(2)}</p>
                                  </div>
                                  <div className="text-center min-w-[100px]">
                                    <span className="text-xs text-muted-foreground">תרומה להמרות</span>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Progress 
                                        value={agConversionContribution} 
                                        className="h-1.5 w-12" 
                                      />
                                      <span className="text-xs font-medium">
                                        {agConversionContribution.toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">אין נכסים (Ad Groups) לקמפיין זה</p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>

      {/* Summary */}
      <div className="glass rounded-xl p-4 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              ₪{totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-muted-foreground">סה"כ הוצאה</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {(data.campaigns.reduce((sum, c) => sum + c.impressions, 0) / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-muted-foreground">סה"כ חשיפות</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {totalClicks.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">סה"כ קליקים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {totalConversions.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">סה"כ המרות</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              ₪{(totalCost / totalConversions).toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">עלות להמרה</div>
          </div>
        </div>
      </div>
    </div>
  );
}
