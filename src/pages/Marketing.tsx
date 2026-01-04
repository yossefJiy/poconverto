import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Target, 
  MessageSquare,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Globe,
  Share2,
  Megaphone,
  UserPlus,
  PieChart,
  Crosshair,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type MarketingType = 'persona' | 'competitor' | 'goal' | 'brand_message' | 'website_analysis' | 'social_channel' | 'campaign_info' | 'lead_segment' | 'pixel_tracking';

interface MarketingItem {
  id: string;
  client_id: string;
  type: MarketingType;
  name: string;
  data: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const marketingCategories: { type: MarketingType; label: string; icon: React.ReactNode }[] = [
  { type: 'persona', label: 'פרסונה', icon: <Users className="w-4 h-4" /> },
  { type: 'brand_message', label: 'מסר מותג', icon: <MessageSquare className="w-4 h-4" /> },
  { type: 'goal', label: 'יעד', icon: <Target className="w-4 h-4" /> },
  { type: 'competitor', label: 'מתחרה', icon: <Building2 className="w-4 h-4" /> },
  { type: 'website_analysis', label: 'ניתוח אתר', icon: <Globe className="w-4 h-4" /> },
  { type: 'social_channel', label: 'ערוץ סושיאל', icon: <Share2 className="w-4 h-4" /> },
  { type: 'campaign_info', label: 'מידע קמפיין', icon: <Megaphone className="w-4 h-4" /> },
  { type: 'lead_segment', label: 'פילוח לידים', icon: <UserPlus className="w-4 h-4" /> },
  { type: 'pixel_tracking', label: 'פיקסל/מעקב', icon: <Crosshair className="w-4 h-4" /> },
];

export default function Marketing() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<MarketingType>('persona');
  const [selectedItem, setSelectedItem] = useState<MarketingItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; item: MarketingItem | null }>({ open: false, item: null });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['personas', 'goals']));
  
  // Form state
  const [formName, setFormName] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: marketingData = [], isLoading } = useQuery({
    queryKey: ["marketing-data", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("marketing_data")
        .select("*")
        .eq("client_id", selectedClient.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MarketingItem[];
    },
    enabled: !!selectedClient,
  });

  const getItemsByType = (type: MarketingType) => marketingData.filter(item => item.type === type);

  const saveMutation = useMutation({
    mutationFn: async ({ id, type, name, data }: { id?: string; type: MarketingType; name: string; data: Record<string, any> }) => {
      if (id) {
        const { error } = await supabase
          .from("marketing_data")
          .update({ name, data, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("marketing_data")
          .insert({ client_id: selectedClient!.id, type, name, data });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-data"] });
      toast.success("נשמר בהצלחה");
      closeDialog();
    },
    onError: () => toast.error("שגיאה בשמירה"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketing_data").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing-data"] });
      toast.success("נמחק בהצלחה");
      setDeleteDialog({ open: false, item: null });
    },
    onError: () => toast.error("שגיאה במחיקה"),
  });

  const openDialog = (type: MarketingType, item?: MarketingItem) => {
    setDialogType(type);
    setSelectedItem(item || null);
    setFormName(item?.name || "");
    setFormData(item?.data || {});
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
    setFormName("");
    setFormData({});
  };

  const handleSave = () => {
    if (!formName.trim()) {
      toast.error("נא להזין שם");
      return;
    }
    saveMutation.mutate({
      id: selectedItem?.id,
      type: dialogType,
      name: formName,
      data: formData,
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-4 md:p-8">
          <PageHeader title="שיווק" description="בחר לקוח מהתפריט" />
          <div className="glass rounded-xl p-8 md:p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">בחר לקוח</h3>
          </div>
        </div>
      </MainLayout>
    );
  }

  const renderDialogContent = () => {
    switch (dialogType) {
      case 'persona':
        return (
          <>
            <div className="space-y-2">
              <Label>שם הפרסונה</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="לדוגמה: שרה המנהלת" />
            </div>
            <div className="space-y-2">
              <Label>תפקיד</Label>
              <Input value={formData.occupation || ""} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>טווח גילאים</Label>
              <Input value={formData.age_range || ""} onChange={(e) => setFormData({ ...formData, age_range: e.target.value })} placeholder="25-35" />
            </div>
            <div className="space-y-2">
              <Label>תחומי עניין</Label>
              <Textarea value={formData.interests || ""} onChange={(e) => setFormData({ ...formData, interests: e.target.value })} placeholder="תחביבים, תחומי עניין..." />
            </div>
            <div className="space-y-2">
              <Label>כאבים ואתגרים</Label>
              <Textarea value={formData.pain_points || ""} onChange={(e) => setFormData({ ...formData, pain_points: e.target.value })} placeholder="בעיות שהפרסונה מתמודדת איתן..." />
            </div>
          </>
        );
      case 'brand_message':
        return (
          <>
            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="לדוגמה: ערך מותג" />
            </div>
            <div className="space-y-2">
              <Label>המסר</Label>
              <Textarea value={formData.message || ""} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>קהל יעד</Label>
              <Input value={formData.target_audience || ""} onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })} />
            </div>
          </>
        );
      case 'goal':
        return (
          <>
            <div className="space-y-2">
              <Label>שם היעד</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="לדוגמה: גידול במכירות" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ערך נוכחי</Label>
                <Input type="number" value={formData.current_value || ""} onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>יעד</Label>
                <Input type="number" value={formData.target_value || ""} onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>יחידה</Label>
              <Input value={formData.unit || ""} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="%, ₪, יח'..." />
            </div>
            <div className="space-y-2">
              <Label>תאריך יעד</Label>
              <Input type="date" value={formData.deadline || ""} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
            </div>
          </>
        );
      case 'competitor':
        return (
          <>
            <div className="space-y-2">
              <Label>שם המתחרה</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>אתר</Label>
              <Input value={formData.website || ""} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>חוזקות</Label>
              <Textarea value={formData.strengths || ""} onChange={(e) => setFormData({ ...formData, strengths: e.target.value })} placeholder="נקודות חוזק..." />
            </div>
            <div className="space-y-2">
              <Label>חולשות</Label>
              <Textarea value={formData.weaknesses || ""} onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })} placeholder="נקודות חולשה..." />
            </div>
          </>
        );
      case 'website_analysis':
        return (
          <>
            <div className="space-y-2">
              <Label>שם הניתוח</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="ניתוח דף הבית" />
            </div>
            <div className="space-y-2">
              <Label>כתובת URL</Label>
              <Input value={formData.url || ""} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>ציון מהירות (1-100)</Label>
              <Input type="number" value={formData.speed_score || ""} onChange={(e) => setFormData({ ...formData, speed_score: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>הערות וממצאים</Label>
              <Textarea value={formData.findings || ""} onChange={(e) => setFormData({ ...formData, findings: e.target.value })} rows={4} />
            </div>
            <div className="space-y-2">
              <Label>המלצות</Label>
              <Textarea value={formData.recommendations || ""} onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })} rows={3} />
            </div>
          </>
        );
      case 'social_channel':
        return (
          <>
            <div className="space-y-2">
              <Label>שם הערוץ</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="אינסטגרם ראשי" />
            </div>
            <div className="space-y-2">
              <Label>פלטפורמה</Label>
              <Input value={formData.platform || ""} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} placeholder="Instagram, Facebook, TikTok..." />
            </div>
            <div className="space-y-2">
              <Label>קישור לעמוד</Label>
              <Input value={formData.url || ""} onChange={(e) => setFormData({ ...formData, url: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>עוקבים</Label>
                <Input type="number" value={formData.followers || ""} onChange={(e) => setFormData({ ...formData, followers: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>אחוז אינגייג'מנט</Label>
                <Input type="number" step="0.1" value={formData.engagement_rate || ""} onChange={(e) => setFormData({ ...formData, engagement_rate: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea value={formData.notes || ""} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
          </>
        );
      case 'campaign_info':
        return (
          <>
            <div className="space-y-2">
              <Label>שם הקמפיין</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>פלטפורמה</Label>
              <Input value={formData.platform || ""} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} placeholder="Google Ads, Facebook Ads..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>תקציב חודשי</Label>
                <Input type="number" value={formData.monthly_budget || ""} onChange={(e) => setFormData({ ...formData, monthly_budget: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>ROAS יעד</Label>
                <Input type="number" step="0.1" value={formData.target_roas || ""} onChange={(e) => setFormData({ ...formData, target_roas: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>קהלי יעד</Label>
              <Textarea value={formData.audiences || ""} onChange={(e) => setFormData({ ...formData, audiences: e.target.value })} placeholder="קהלים שונים מופרדים בפסיק..." />
            </div>
            <div className="space-y-2">
              <Label>הערות אסטרטגיה</Label>
              <Textarea value={formData.strategy_notes || ""} onChange={(e) => setFormData({ ...formData, strategy_notes: e.target.value })} />
            </div>
          </>
        );
      case 'lead_segment':
        return (
          <>
            <div className="space-y-2">
              <Label>שם הפילוח</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="לידים חמים" />
            </div>
            <div className="space-y-2">
              <Label>מקור הלידים</Label>
              <Input value={formData.source || ""} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="אתר, פייסבוק, גוגל..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>כמות לידים</Label>
                <Input type="number" value={formData.lead_count || ""} onChange={(e) => setFormData({ ...formData, lead_count: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>אחוז המרה</Label>
                <Input type="number" step="0.1" value={formData.conversion_rate || ""} onChange={(e) => setFormData({ ...formData, conversion_rate: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>מאפיינים</Label>
              <Textarea value={formData.characteristics || ""} onChange={(e) => setFormData({ ...formData, characteristics: e.target.value })} placeholder="תכונות מזהות של הפילוח..." />
            </div>
          </>
        );
      case 'pixel_tracking':
        return (
          <>
            <div className="space-y-2">
              <Label>שם הפיקסל/מעקב</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Facebook Pixel" />
            </div>
            <div className="space-y-2">
              <Label>סוג</Label>
              <Input value={formData.type || ""} onChange={(e) => setFormData({ ...formData, type: e.target.value })} placeholder="Facebook, Google Analytics, TikTok..." />
            </div>
            <div className="space-y-2">
              <Label>מזהה פיקסל</Label>
              <Input value={formData.pixel_id || ""} onChange={(e) => setFormData({ ...formData, pixel_id: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>סטטוס</Label>
              <Input value={formData.status || ""} onChange={(e) => setFormData({ ...formData, status: e.target.value })} placeholder="פעיל, לא מחובר..." />
            </div>
            <div className="space-y-2">
              <Label>אירועים מוגדרים</Label>
              <Textarea value={formData.events || ""} onChange={(e) => setFormData({ ...formData, events: e.target.value })} placeholder="Purchase, AddToCart, ViewContent..." />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    const action = selectedItem ? "עריכת" : "הוספת";
    const category = marketingCategories.find(c => c.type === dialogType);
    return `${action} ${category?.label || ''}`;
  };

  const personas = getItemsByType('persona');
  const brandMessages = getItemsByType('brand_message');
  const goals = getItemsByType('goal');
  const competitors = getItemsByType('competitor');
  const websiteAnalyses = getItemsByType('website_analysis');
  const socialChannels = getItemsByType('social_channel');
  const campaignInfos = getItemsByType('campaign_info');
  const leadSegments = getItemsByType('lead_segment');
  const pixelTrackings = getItemsByType('pixel_tracking');

  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <PageHeader 
          title={`שיווק - ${selectedClient.name}`}
          description="ניתוח שיווקי מקיף: פרסונות, יעדים, מתחרים, ערוצים ומעקב"
          actions={
            <div className="flex gap-2 flex-wrap">
              {marketingCategories.map(cat => (
                <Button key={cat.type} variant="outline" size="sm" onClick={() => openDialog(cat.type)}>
                  <Plus className="w-4 h-4 ml-1" />{cat.label}
                </Button>
              ))}
            </div>
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            {/* Personas Section */}
            <Collapsible open={expandedSections.has('personas')} onOpenChange={() => toggleSection('personas')}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">פרסונות</h2>
                    <Badge variant="secondary">{personas.length}</Badge>
                  </div>
                  {expandedSections.has('personas') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personas.map((persona) => (
                    <div key={persona.id} className="glass rounded-xl overflow-hidden card-shadow group">
                      <div className="h-2 bg-gradient-to-l from-primary to-primary/60" />
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold">{persona.name}</h3>
                          <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog('persona', persona)}><Edit2 className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteDialog({ open: true, item: persona })}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{persona.data.occupation}</p>
                        {persona.data.age_range && <p className="text-xs text-muted-foreground mt-1">גיל: {persona.data.age_range}</p>}
                      </div>
                    </div>
                  ))}
                  {personas.length === 0 && <p className="text-muted-foreground col-span-full text-center py-4">אין פרסונות עדיין</p>}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Goals Section */}
            <Collapsible open={expandedSections.has('goals')} onOpenChange={() => toggleSection('goals')}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">יעדים</h2>
                    <Badge variant="secondary">{goals.length}</Badge>
                  </div>
                  {expandedSections.has('goals') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="glass rounded-xl p-4 space-y-4">
                  {goals.map((goal) => {
                    const current = goal.data.current_value || 0;
                    const target = goal.data.target_value || 1;
                    const pct = (current / target) * 100;
                    return (
                      <div key={goal.id} className="group">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{goal.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{current}/{target}{goal.data.unit}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={() => openDialog('goal', goal)}><Edit2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full">
                          <div className={cn("h-full rounded-full transition-all", pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-destructive")} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {goals.length === 0 && <p className="text-muted-foreground text-center py-4">אין יעדים עדיין</p>}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Social Channels & Website */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Social Channels */}
              <Collapsible open={expandedSections.has('social')} onOpenChange={() => toggleSection('social')}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer glass rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-primary" />
                      <h2 className="font-bold">ערוצי סושיאל</h2>
                      <Badge variant="secondary">{socialChannels.length}</Badge>
                    </div>
                    {expandedSections.has('social') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="glass rounded-xl divide-y divide-border">
                    {socialChannels.map((ch) => (
                      <div key={ch.id} className="p-3 flex items-center justify-between group hover:bg-muted/30">
                        <div>
                          <div className="font-medium">{ch.name}</div>
                          <div className="text-xs text-muted-foreground">{ch.data.platform} • {ch.data.followers?.toLocaleString()} עוקבים</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {ch.data.url && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(ch.data.url, '_blank')}><ExternalLink className="w-3 h-3" /></Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 md:opacity-0 md:group-hover:opacity-100" onClick={() => openDialog('social_channel', ch)}><Edit2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ))}
                    {socialChannels.length === 0 && <p className="text-muted-foreground text-center py-4">אין ערוצים</p>}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Website Analysis */}
              <Collapsible open={expandedSections.has('website')} onOpenChange={() => toggleSection('website')}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer glass rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      <h2 className="font-bold">ניתוחי אתר</h2>
                      <Badge variant="secondary">{websiteAnalyses.length}</Badge>
                    </div>
                    {expandedSections.has('website') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="glass rounded-xl divide-y divide-border">
                    {websiteAnalyses.map((wa) => (
                      <div key={wa.id} className="p-3 flex items-center justify-between group hover:bg-muted/30">
                        <div>
                          <div className="font-medium">{wa.name}</div>
                          <div className="text-xs text-muted-foreground">ציון: {wa.data.speed_score || '-'}/100</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:opacity-0 md:group-hover:opacity-100" onClick={() => openDialog('website_analysis', wa)}><Edit2 className="w-3 h-3" /></Button>
                      </div>
                    ))}
                    {websiteAnalyses.length === 0 && <p className="text-muted-foreground text-center py-4">אין ניתוחים</p>}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Campaigns & Leads */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaigns */}
              <Collapsible open={expandedSections.has('campaigns')} onOpenChange={() => toggleSection('campaigns')}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer glass rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-primary" />
                      <h2 className="font-bold">מידע קמפיינים</h2>
                      <Badge variant="secondary">{campaignInfos.length}</Badge>
                    </div>
                    {expandedSections.has('campaigns') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="glass rounded-xl divide-y divide-border">
                    {campaignInfos.map((camp) => (
                      <div key={camp.id} className="p-3 flex items-center justify-between group hover:bg-muted/30">
                        <div>
                          <div className="font-medium">{camp.name}</div>
                          <div className="text-xs text-muted-foreground">{camp.data.platform} • ₪{camp.data.monthly_budget?.toLocaleString()}/חודש</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:opacity-0 md:group-hover:opacity-100" onClick={() => openDialog('campaign_info', camp)}><Edit2 className="w-3 h-3" /></Button>
                      </div>
                    ))}
                    {campaignInfos.length === 0 && <p className="text-muted-foreground text-center py-4">אין מידע קמפיינים</p>}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Lead Segments */}
              <Collapsible open={expandedSections.has('leads')} onOpenChange={() => toggleSection('leads')}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer glass rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-primary" />
                      <h2 className="font-bold">פילוחי לידים</h2>
                      <Badge variant="secondary">{leadSegments.length}</Badge>
                    </div>
                    {expandedSections.has('leads') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="glass rounded-xl divide-y divide-border">
                    {leadSegments.map((seg) => (
                      <div key={seg.id} className="p-3 flex items-center justify-between group hover:bg-muted/30">
                        <div>
                          <div className="font-medium">{seg.name}</div>
                          <div className="text-xs text-muted-foreground">{seg.data.source} • {seg.data.lead_count} לידים • {seg.data.conversion_rate}% המרה</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:opacity-0 md:group-hover:opacity-100" onClick={() => openDialog('lead_segment', seg)}><Edit2 className="w-3 h-3" /></Button>
                      </div>
                    ))}
                    {leadSegments.length === 0 && <p className="text-muted-foreground text-center py-4">אין פילוחים</p>}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Pixels & Competitors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pixels */}
              <Collapsible open={expandedSections.has('pixels')} onOpenChange={() => toggleSection('pixels')}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer glass rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Crosshair className="w-5 h-5 text-primary" />
                      <h2 className="font-bold">פיקסלים ומעקב</h2>
                      <Badge variant="secondary">{pixelTrackings.length}</Badge>
                    </div>
                    {expandedSections.has('pixels') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="glass rounded-xl divide-y divide-border">
                    {pixelTrackings.map((px) => (
                      <div key={px.id} className="p-3 flex items-center justify-between group hover:bg-muted/30">
                        <div>
                          <div className="font-medium">{px.name}</div>
                          <div className="text-xs text-muted-foreground">{px.data.type} • {px.data.status || 'לא ידוע'}</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:opacity-0 md:group-hover:opacity-100" onClick={() => openDialog('pixel_tracking', px)}><Edit2 className="w-3 h-3" /></Button>
                      </div>
                    ))}
                    {pixelTrackings.length === 0 && <p className="text-muted-foreground text-center py-4">אין פיקסלים</p>}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Competitors */}
              <Collapsible open={expandedSections.has('competitors')} onOpenChange={() => toggleSection('competitors')}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer glass rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <h2 className="font-bold">מתחרים</h2>
                      <Badge variant="secondary">{competitors.length}</Badge>
                    </div>
                    {expandedSections.has('competitors') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="grid grid-cols-1 gap-3">
                    {competitors.map((c) => (
                      <div key={c.id} className="glass rounded-xl p-4 group">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-bold">{c.name}</h3>
                          <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDialog('competitor', c)}><Edit2 className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteDialog({ open: true, item: c })}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </div>
                        {c.data.strengths && <p className="text-sm text-success">חוזקות: {c.data.strengths}</p>}
                        {c.data.weaknesses && <p className="text-sm text-destructive">חולשות: {c.data.weaknesses}</p>}
                      </div>
                    ))}
                    {competitors.length === 0 && <p className="text-muted-foreground text-center py-4">אין מתחרים</p>}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Brand Messages */}
            <Collapsible open={expandedSections.has('messages')} onOpenChange={() => toggleSection('messages')}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer glass rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h2 className="font-bold">מסרי מותג</h2>
                    <Badge variant="secondary">{brandMessages.length}</Badge>
                  </div>
                  {expandedSections.has('messages') ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="glass rounded-xl divide-y divide-border">
                  {brandMessages.map((msg) => (
                    <div key={msg.id} className="p-4 hover:bg-muted/30 group">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-primary">{msg.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={() => openDialog('brand_message', msg)}><Edit2 className="w-3 h-3" /></Button>
                      </div>
                      <p className="text-sm mt-1">{msg.data.message}</p>
                    </div>
                  ))}
                  {brandMessages.length === 0 && <p className="text-muted-foreground text-center py-4">אין מסרים</p>}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {renderDialogContent()}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={closeDialog}>ביטול</Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                שמור
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת פריט</AlertDialogTitle>
            <AlertDialogDescription>האם אתה בטוח שברצונך למחוק את "{deleteDialog.item?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog.item && deleteMutation.mutate(deleteDialog.item.id)} className="bg-destructive text-destructive-foreground">
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
