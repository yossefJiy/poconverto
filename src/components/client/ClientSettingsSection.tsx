import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Settings, 
  ShoppingCart, 
  Users, 
  Plug, 
  Loader2,
  Save,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

interface ClientSettingsSectionProps {
  clientId: string;
  clientName: string;
  isEcommerce: boolean;
  isLeadGen: boolean;
  integrations: Array<{ platform: string; is_connected: boolean }>;
}

export function ClientSettingsSection({
  clientId,
  clientName,
  isEcommerce,
  isLeadGen,
  integrations,
}: ClientSettingsSectionProps) {
  const queryClient = useQueryClient();
  const [ecommerce, setEcommerce] = useState(isEcommerce);
  const [leadGen, setLeadGen] = useState(isLeadGen);
  const [hasChanges, setHasChanges] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("clients")
        .update({ is_ecommerce: ecommerce, is_lead_gen: leadGen })
        .eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-full"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      toast.success("ההגדרות נשמרו בהצלחה");
      setHasChanges(false);
    },
    onError: () => toast.error("שגיאה בשמירת הגדרות"),
  });

  const handleToggle = (type: "ecommerce" | "leadgen", value: boolean) => {
    if (type === "ecommerce") {
      setEcommerce(value);
    } else {
      setLeadGen(value);
    }
    setHasChanges(true);
  };

  const shopifyConnected = integrations.some(i => i.platform === 'shopify' && i.is_connected);
  const gaConnected = integrations.some(i => i.platform === 'google_analytics' && i.is_connected);

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            הגדרות לקוח
          </span>
          {hasChanges && (
            <Button 
              size="sm" 
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              שמור שינויים
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Business Mode Toggles */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">מודל עסקי</h4>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <Label htmlFor="ecommerce" className="font-medium cursor-pointer">
                  איקומרס (E-Commerce)
                </Label>
                <p className="text-sm text-muted-foreground">
                  הפעל עמוד חנות, מלאי, הזמנות ואנליטיקס מכירות
                </p>
              </div>
            </div>
            <Switch
              id="ecommerce"
              checked={ecommerce}
              onCheckedChange={(v) => handleToggle("ecommerce", v)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <Label htmlFor="leadgen" className="font-medium cursor-pointer">
                  לידים (Lead Generation)
                </Label>
                <p className="text-sm text-muted-foreground">
                  הפעל מעקב לידים, טפסים ואנליטיקס המרות
                </p>
              </div>
            </div>
            <Switch
              id="leadgen"
              checked={leadGen}
              onCheckedChange={(v) => handleToggle("leadgen", v)}
            />
          </div>
        </div>

        {/* Integration Status */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">חיבורים נדרשים</h4>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/integrations">
                נהל חיבורים
                <ExternalLink className="w-3 h-3 mr-1" />
              </Link>
            </Button>
          </div>

          <div className="space-y-2">
            {ecommerce && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛍️</span>
                  <span>Shopify</span>
                </div>
                <Badge variant={shopifyConnected ? "default" : "secondary"}>
                  {shopifyConnected ? "מחובר" : "לא מחובר"}
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <span>Google Analytics</span>
              </div>
              <Badge variant={gaConnected ? "default" : "secondary"}>
                {gaConnected ? "מחובר" : "לא מחובר"}
              </Badge>
            </div>
          </div>

          {!shopifyConnected && ecommerce && (
            <Button asChild variant="outline" className="w-full">
              <Link to="/integrations">
                <Plug className="w-4 h-4 ml-2" />
                חבר Shopify לקבלת נתוני מכירות
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
