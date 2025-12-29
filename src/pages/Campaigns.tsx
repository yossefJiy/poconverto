import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const platformConfig: Record<string, { color: string; name: string }> = {
  google: { color: "bg-[#4285F4]", name: "Google Ads" },
  facebook: { color: "bg-[#1877F2]", name: "Facebook" },
  instagram: { color: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737]", name: "Instagram" },
  linkedin: { color: "bg-[#0A66C2]", name: "LinkedIn" },
  tiktok: { color: "bg-[#000000]", name: "TikTok" },
};

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  active: { icon: Play, color: "text-success", bg: "bg-success/10", label: "פעיל" },
  paused: { icon: Pause, color: "text-warning", bg: "bg-warning/10", label: "מושהה" },
  ended: { icon: null, color: "text-muted-foreground", bg: "bg-muted", label: "הסתיים" },
  draft: { icon: null, color: "text-muted-foreground", bg: "bg-muted", label: "טיוטה" },
};

export default function Campaigns() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    platform: "facebook",
    budget: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  const { data: campaigns = [], isLoading } = useQuery({
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
  });

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
          <Tabs defaultValue="google-ads" className="space-y-6">
            <TabsList className="glass">
              <TabsTrigger value="google-ads" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Google Ads
              </TabsTrigger>
              <TabsTrigger value="internal" className="flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                קמפיינים פנימיים
              </TabsTrigger>
            </TabsList>

            <TabsContent value="google-ads">
              <GoogleAdsCampaigns />
            </TabsContent>

            <TabsContent value="internal">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                  <Megaphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">אין קמפיינים עדיין</h3>
                  <p className="text-muted-foreground">צור קמפיין חדש כדי להתחיל</p>
                </div>
              ) : (
                <div className="space-y-4">
            {campaigns.map((campaign, index) => {
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
