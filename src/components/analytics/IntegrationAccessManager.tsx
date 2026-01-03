import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Shield, 
  Trash2, 
  Settings,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { FacebookAssetSelector } from "./FacebookAssetSelector";

interface Integration {
  id: string;
  platform: string;
  is_connected: boolean;
  settings: any;
  last_sync_at: string | null;
  created_at: string;
}

interface IntegrationAccessManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: Integration | null;
  clientId: string;
  onDisconnect?: () => void;
}

const platformLabels: Record<string, string> = {
  google_ads: "Google Ads",
  facebook_ads: "Facebook Ads",
  google_analytics: "Google Analytics",
  shopify: "Shopify",
  woocommerce: "WooCommerce",
};

const accessLevelLabels: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  admin: { label: "מנהל מלא", color: "bg-success text-success-foreground", icon: Shield },
  editor: { label: "עורך", color: "bg-primary text-primary-foreground", icon: Edit },
  viewer: { label: "צופה בלבד", color: "bg-muted text-muted-foreground", icon: Eye },
};

export function IntegrationAccessManager({ 
  open, 
  onOpenChange, 
  integration, 
  clientId,
  onDisconnect 
}: IntegrationAccessManagerProps) {
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFacebookAssetSelector, setShowFacebookAssetSelector] = useState(false);

  // Fetch team members who have access to this client
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["client-team", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_team")
        .select(`
          id,
          role,
          is_lead,
          team:team_member_id (
            id,
            name,
            email
          )
        `)
        .eq("client_id", clientId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId && open,
   });

  const connectFacebookAssetsMutation = useMutation({
    mutationFn: async ({ assets, accessToken, assetsData }: { assets: any; accessToken: string; assetsData?: any }) => {
      const { data, error } = await supabase.functions.invoke("connect-integration", {
        body: {
          action: "connect_assets",
          platform: "facebook_ads",
          client_id: clientId,
          credentials: { access_token: accessToken },
          selected_assets: assets,
          assets_data: assetsData,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.message || "שגיאה בחיבור נכסים");
      return data;
    },
    onSuccess: async (data: any) => {
      await queryClient.invalidateQueries({ queryKey: ["integrations", clientId] });
      await queryClient.invalidateQueries({ queryKey: ["facebook-ads"], exact: false });
      toast.success(data?.message || "הנכסים עודכנו בהצלחה");
      setShowFacebookAssetSelector(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || "שגיאה בחיבור הנכסים");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!integration) return;
      
      const { error } = await supabase
        .from("integrations")
        .update({ 
          is_connected: false,
          encrypted_credentials: null,
        })
        .eq("id", integration.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations", clientId] });
      toast.success("החיבור נותק בהצלחה");
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onDisconnect?.();
    },
    onError: () => {
      toast.error("שגיאה בניתוק החיבור");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!integration) return;
      
      const { error } = await supabase
        .from("integrations")
        .delete()
        .eq("id", integration.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations", clientId] });
      toast.success("האינטגרציה נמחקה בהצלחה");
      setShowDeleteConfirm(false);
      onOpenChange(false);
      onDisconnect?.();
    },
    onError: () => {
      toast.error("שגיאה במחיקת האינטגרציה");
    },
  });

  if (!integration) return null;

  const settings = integration.settings || {};
  const accountName = settings.account_name || settings.shop_name || "חשבון לא ידוע";
  const platformLabel = platformLabels[integration.platform] || integration.platform;
  
  // Calculate token expiry warning
  const tokenExpiresAt = settings.token_expires_at ? new Date(settings.token_expires_at) : null;
  const daysUntilExpiry = tokenExpiresAt 
    ? Math.ceil((tokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              ניהול אינטגרציה - {platformLabel}
            </DialogTitle>
            <DialogDescription>
              {accountName}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 p-1">
              {/* Connection Status */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  סטטוס חיבור
                </h3>
                
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    {integration.is_connected ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <X className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-medium">
                      {integration.is_connected ? "מחובר" : "מנותק"}
                    </span>
                  </div>
                  
                  {integration.last_sync_at && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      סנכרון אחרון: {new Date(integration.last_sync_at).toLocaleDateString("he-IL")}
                    </span>
                  )}
                </div>

                {/* Token Expiry Warning */}
                {tokenExpiresAt && (
                  <div className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border",
                    isExpired ? "bg-destructive/10 border-destructive/50" : 
                    isExpiringSoon ? "bg-warning/10 border-warning/50" : 
                    "bg-muted/50"
                  )}>
                    {isExpired || isExpiringSoon ? (
                      <AlertTriangle className={cn(
                        "h-5 w-5",
                        isExpired ? "text-destructive" : "text-warning"
                      )} />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {isExpired ? "הטוקן פג תוקף!" : 
                         isExpiringSoon ? `הטוקן יפוג בעוד ${daysUntilExpiry} ימים` :
                         `תוקף הטוקן עד ${tokenExpiresAt.toLocaleDateString("he-IL")}`}
                      </p>
                      {(isExpired || isExpiringSoon) && (
                        <p className="text-xs text-muted-foreground">
                          יש להתחבר מחדש לחידוש הטוקן
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Facebook: rediscover/connect more assets */}
                {integration.platform === "facebook_ads" && (
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowFacebookAssetSelector(true)}
                      disabled={connectFacebookAssetsMutation.isPending}
                    >
                      <RefreshCw className="h-4 w-4 ml-2" />
                      משוך נכסים מחדש / הוסף חשבון מודעות
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      הפעולה תבקש Access Token חדש ותאפשר לבחור עוד חשבונות מודעות, עמודים, אינסטגרם, פיקסלים וקטלוגים.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Connected Assets */}
              {(settings.pages?.length > 0 || settings.instagram_accounts?.length > 0 || 
                settings.pixels?.length > 0 || settings.catalogs?.length > 0) && (
                <>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">נכסים מחוברים</h3>
                    
                    <div className="space-y-2">
                      {settings.pages?.map((page: any) => (
                        <div key={page.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">f</div>
                            <span className="text-sm">{page.name || page.id}</span>
                          </div>
                          {page.fan_count && (
                            <Badge variant="outline" className="text-xs">
                              {page.fan_count.toLocaleString()} עוקבים
                            </Badge>
                          )}
                        </div>
                      ))}
                      
                      {settings.instagram_accounts?.map((ig: any) => (
                        <div key={ig.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white text-xs">IG</div>
                            <span className="text-sm">@{ig.username || ig.id}</span>
                          </div>
                          {ig.followers_count && (
                            <Badge variant="outline" className="text-xs">
                              {ig.followers_count.toLocaleString()} עוקבים
                            </Badge>
                          )}
                        </div>
                      ))}
                      
                      {settings.pixels?.map((pixel: any) => (
                        <div key={pixel.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center text-white text-xs">PX</div>
                            <span className="text-sm">{pixel.name || pixel.id}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">פיקסל</Badge>
                        </div>
                      ))}
                      
                      {settings.catalogs?.map((catalog: any) => (
                        <div key={catalog.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-white text-xs">🛒</div>
                            <span className="text-sm">{catalog.name || catalog.id}</span>
                          </div>
                          {catalog.product_count && (
                            <Badge variant="outline" className="text-xs">
                              {catalog.product_count} מוצרים
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />
                </>
              )}

              {/* Team Access */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  גישת צוות
                </h3>
                
                <p className="text-xs text-muted-foreground">
                  חברי הצוות המשויכים ללקוח זה יכולים לגשת לנתוני האינטגרציה
                </p>

                {teamMembers.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    לא נמצאו חברי צוות משויכים ללקוח זה
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teamMembers.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded border bg-card">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">
                              {member.team?.name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.team?.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role || "חבר צוות"}</p>
                          </div>
                        </div>
                        {member.is_lead && (
                          <Badge variant="secondary" className="text-xs">
                            מוביל
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Danger Zone */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  אזור מסוכן
                </h3>
                
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-warning text-warning hover:bg-warning/10"
                    onClick={() => disconnectMutation.mutate()}
                    disabled={disconnectMutation.isPending || !integration.is_connected}
                  >
                    <X className="h-4 w-4 ml-2" />
                    נתק חיבור (שמור נתונים)
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    מחק אינטגרציה לצמיתות
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Facebook Asset Selector */}
      <Dialog open={showFacebookAssetSelector} onOpenChange={setShowFacebookAssetSelector}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>בחירת נכסי Meta</DialogTitle>
            <DialogDescription>
              בחר את כל חשבונות המודעות והנכסים שברצונך לחבר ללקוח.
            </DialogDescription>
          </DialogHeader>

          <FacebookAssetSelector
            onAssetsSelected={(assets, accessToken, assetsData) =>
              connectFacebookAssetsMutation.mutate({ assets, accessToken, assetsData })
            }
            onCancel={() => setShowFacebookAssetSelector(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את האינטגרציה לצמיתות כולל כל ההגדרות והנתונים המקושרים. 
              לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "מוחק..." : "מחק לצמיתות"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
