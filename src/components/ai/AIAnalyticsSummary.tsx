import { useState } from "react";
import { 
  Brain, 
  Loader2, 
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIAnalyticsSummaryProps {
  platformData: {
    shopify?: { totalRevenue: number; totalOrders: number };
    googleAds?: { totalCost: number; totalConversions: number; totalClicks: number; totalImpressions: number };
    facebookAds?: { cost: number; conversions: number; clicks: number; impressions: number };
  };
  clientName?: string;
  dateRange?: { start: string; end: string };
}

export function AIAnalyticsSummary({ platformData, clientName, dateRange }: AIAnalyticsSummaryProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const context = {
        client_name: clientName,
        date_range: dateRange,
        metrics: {
          shopify: platformData.shopify,
          google_ads: platformData.googleAds,
          facebook_ads: platformData.facebookAds,
        }
      };

      const { data, error } = await supabase.functions.invoke('ai-task-analyzer', {
        body: { 
          type: 'analyze_data',
          prompt: 'נתח את הביצועים של הקמפיינים והחנות ותן תובנות והמלצות לשיפור',
          context
        }
      });

      if (error) throw error;
      setInsights(data.text || data.response);
    } catch (err) {
      console.error('Error generating insights:', err);
      toast.error('שגיאה בניתוח הנתונים');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate basic metrics
  const totalSpend = (platformData.googleAds?.totalCost || 0) + (platformData.facebookAds?.cost || 0);
  const totalRevenue = platformData.shopify?.totalRevenue || 0;
  const roas = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : 'N/A';

  return (
    <div className="glass rounded-xl overflow-hidden card-shadow">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold flex items-center gap-2">
              ניתוח AI
              <Sparkles className="w-4 h-4 text-primary" />
            </h3>
            <p className="text-sm text-muted-foreground">תובנות והמלצות אוטומטיות</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!insights && (
            <Button 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                generateInsights();
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מנתח...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 ml-2" />
                  נתח עכשיו
                </>
              )}
            </Button>
          )}
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0 border-t border-border">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-primary">₪{totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">הכנסות</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-destructive">₪{totalSpend.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">הוצאות פרסום</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className={cn(
                "text-2xl font-bold",
                parseFloat(roas as string) >= 3 ? "text-success" : 
                parseFloat(roas as string) >= 2 ? "text-warning" : "text-destructive"
              )}>
                {roas}x
              </p>
              <p className="text-xs text-muted-foreground">ROAS</p>
            </div>
          </div>

          {/* AI Insights */}
          {insights ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-warning" />
                  תובנות AI
                </h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={generateInsights}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'רענן'}
                </Button>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap text-sm leading-relaxed">
                {insights}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>לחץ על "נתח עכשיו" לקבלת תובנות AI</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
