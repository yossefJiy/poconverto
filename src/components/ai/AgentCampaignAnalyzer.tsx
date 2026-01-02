import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { toast } from "sonner";
import { 
  Bot, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Zap,
  DollarSign,
  Target,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CampaignData {
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
}

interface ActionProposal {
  action_type: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  campaign_id?: string;
  campaign_name?: string;
  suggested_change?: string;
}

interface AgentCampaignAnalyzerProps {
  campaigns: CampaignData[];
  onActionCreated?: () => void;
}

export function AgentCampaignAnalyzer({ campaigns, onActionCreated }: AgentCampaignAnalyzerProps) {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [proposals, setProposals] = useState<ActionProposal[]>([]);

  // Fetch active agents
  const { data: agents = [] } = useQuery({
    queryKey: ["ai-agents-active", selectedClient?.id],
    queryFn: async () => {
      let query = supabase
        .from("ai_agents")
        .select("*")
        .eq("is_active", true);
      
      if (selectedClient) {
        query = query.or(`client_id.eq.${selectedClient.id},client_id.is.null`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Create action mutation
  const createActionMutation = useMutation({
    mutationFn: async (proposal: ActionProposal) => {
      const marketingAgent = agents.find(a => 
        a.agent_type === "marketing" || a.capabilities?.includes("analyze_campaigns")
      );

      const { error } = await supabase.from("ai_agent_actions").insert({
        agent_id: marketingAgent?.id || null,
        client_id: selectedClient?.id || null,
        action_type: proposal.action_type,
        status: "pending",
        action_data: {
          title: proposal.title,
          description: proposal.description,
          impact: proposal.impact,
          campaign_id: proposal.campaign_id,
          campaign_name: proposal.campaign_name,
          suggested_change: proposal.suggested_change,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-agent-actions"] });
      toast.success("הצעת הפעולה נוצרה בהצלחה");
      onActionCreated?.();
    },
    onError: () => toast.error("שגיאה ביצירת הצעת פעולה"),
  });

  // Analyze campaigns and generate proposals
  const analyzeCampaigns = async () => {
    if (!campaigns.length) {
      toast.info("אין קמפיינים לניתוח");
      return;
    }

    setIsAnalyzing(true);
    setProposals([]);

    try {
      const { data, error } = await supabase.functions.invoke("ai-task-analyzer", {
        body: {
          type: "analyze_campaigns",
          prompt: "נתח את הקמפיינים והצע פעולות שיווקיות לשיפור ביצועים",
          context: {
            campaigns: campaigns.map(c => ({
              id: c.id,
              name: c.name,
              platform: c.platform,
              status: c.status,
              budget: c.budget,
              spent: c.spent,
              impressions: c.impressions,
              clicks: c.clicks,
              conversions: c.conversions,
              ctr: c.ctr,
              cpc: c.cpc,
            })),
            clientName: selectedClient?.name,
          },
        },
      });

      if (error) throw error;

      const generatedProposals = data.parsed?.proposals || generateLocalProposals(campaigns);
      setProposals(generatedProposals);

      // Auto-create pending actions for high impact proposals
      for (const proposal of generatedProposals.filter((p: ActionProposal) => p.impact === "high")) {
        await createActionMutation.mutateAsync(proposal);
      }

    } catch (err) {
      console.error("Analysis error:", err);
      const status = (err as any)?.context?.status;
      if (status === 429) {
        toast.error('יותר מדי בקשות ל-AI — מציג ניתוח מקומי זמני');
      } else if (status === 402) {
        toast.error('נגמרו הקרדיטים של ה-AI — מציג ניתוח מקומי זמני');
      }
      // Fallback to local analysis
      const localProposals = generateLocalProposals(campaigns);
      setProposals(localProposals);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate proposals locally based on campaign data
  const generateLocalProposals = (campaignsData: CampaignData[]): ActionProposal[] => {
    const proposals: ActionProposal[] = [];

    for (const campaign of campaignsData) {
      // Low CTR check
      if (campaign.ctr && campaign.ctr < 1) {
        proposals.push({
          action_type: "optimize_creative",
          title: `שיפור קריאייטיב - ${campaign.name}`,
          description: `CTR נמוך (${campaign.ctr?.toFixed(2)}%). מומלץ לעדכן את הקריאייטיב או הטקסט`,
          impact: "high",
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          suggested_change: "עדכון תמונות, טקסטים או קריאה לפעולה",
        });
      }

      // High CPC check
      if (campaign.cpc && campaign.cpc > 10) {
        proposals.push({
          action_type: "reduce_cpc",
          title: `הפחתת עלות לקליק - ${campaign.name}`,
          description: `עלות לקליק גבוהה (₪${campaign.cpc?.toFixed(2)}). מומלץ לבחון את הטירגוט`,
          impact: "medium",
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          suggested_change: "צמצום או שינוי קהל יעד",
        });
      }

      // Budget utilization check
      if (campaign.budget && campaign.spent) {
        const utilization = (campaign.spent / campaign.budget) * 100;
        if (utilization < 50) {
          proposals.push({
            action_type: "increase_budget_usage",
            title: `ניצול תקציב נמוך - ${campaign.name}`,
            description: `רק ${utilization.toFixed(0)}% מהתקציב נוצל. מומלץ להגדיל את ההצעות`,
            impact: "medium",
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            suggested_change: "הגדלת הצעות או הרחבת קהל יעד",
          });
        } else if (utilization > 95) {
          proposals.push({
            action_type: "increase_budget",
            title: `תקציב מנוצל לגמרי - ${campaign.name}`,
            description: `התקציב מנוצל ב-${utilization.toFixed(0)}%. מומלץ להגדיל תקציב`,
            impact: "high",
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            suggested_change: "הגדלת תקציב יומי ב-20-30%",
          });
        }
      }

      // Low conversions with high clicks
      if (campaign.clicks && campaign.clicks > 100 && (!campaign.conversions || campaign.conversions < 5)) {
        proposals.push({
          action_type: "improve_landing_page",
          title: `שיפור דף נחיתה - ${campaign.name}`,
          description: `יחס המרה נמוך. ${campaign.clicks} קליקים ורק ${campaign.conversions || 0} המרות`,
          impact: "high",
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          suggested_change: "בדיקה ושיפור דף הנחיתה, טפסים, ומהירות טעינה",
        });
      }
    }

    return proposals;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-destructive bg-destructive/10";
      case "medium": return "text-warning bg-warning/10";
      case "low": return "text-info bg-info/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case "high": return "דחיפות גבוהה";
      case "medium": return "דחיפות בינונית";
      case "low": return "דחיפות נמוכה";
      default: return impact;
    }
  };

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold">ניתוח AI אוטומטי</h3>
            <p className="text-sm text-muted-foreground">
              {agents.length} סוכנים פעילים | {campaigns.length} קמפיינים
            </p>
          </div>
        </div>
        <Button 
          onClick={analyzeCampaigns} 
          disabled={isAnalyzing || !campaigns.length}
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 ml-2" />
          )}
          {isAnalyzing ? "מנתח..." : "נתח קמפיינים"}
        </Button>
      </div>

      {proposals.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground">
            הצעות פעולה ({proposals.length})
          </h4>
          {proposals.map((proposal, index) => (
            <div 
              key={index} 
              className="flex items-start justify-between p-4 bg-muted/50 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg", getImpactColor(proposal.impact))}>
                  {proposal.impact === "high" ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : proposal.action_type.includes("budget") ? (
                    <DollarSign className="w-4 h-4" />
                  ) : (
                    <Target className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{proposal.title}</p>
                    <Badge variant="outline" className={cn("text-xs", getImpactColor(proposal.impact))}>
                      {getImpactLabel(proposal.impact)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{proposal.description}</p>
                  {proposal.suggested_change && (
                    <p className="text-sm text-primary mt-1">
                      💡 {proposal.suggested_change}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => createActionMutation.mutate(proposal)}
                disabled={createActionMutation.isPending}
              >
                <Zap className="w-3 h-3 ml-1" />
                צור פעולה
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
