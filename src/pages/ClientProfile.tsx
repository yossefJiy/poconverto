import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { useClientModules, ClientModules } from "@/hooks/useClientModules";
import { useAuth } from "@/hooks/useAuth";
import { 
  Building2, 
  Plus, 
  Edit2, 
  Globe,
  Loader2,
  Users,
  Megaphone,
  Target,
  Instagram,
  Facebook,
  ExternalLink,
  Briefcase,
  TrendingUp,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateClientDialog } from "@/components/client/CreateClientDialog";

import { ClientModulesSettings } from "@/components/client/ClientModulesSettings";
import { Link } from "react-router-dom";

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

interface ClientForm {
  name: string;
  industry: string;
  website: string;
  description: string;
  logo_url: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  linkedin_url: string;
  twitter_url: string;
  avg_profit_margin: number;
  jiy_commission_percent: number;
}

const emptyForm: ClientForm = {
  name: "",
  industry: "",
  website: "",
  description: "",
  logo_url: "",
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
  linkedin_url: "",
  twitter_url: "",
  avg_profit_margin: 0,
  jiy_commission_percent: 0,
};

export default function ClientProfile() {
  const queryClient = useQueryClient();
  const { selectedClient, setSelectedClient, clients, isLoading: clientsLoading } = useClient();
  const { modules, isAdmin } = useClientModules();
  const { role } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [form, setForm] = useState<ClientForm>(emptyForm);

  // Fetch full client data with social media
  const { data: clientData, isLoading: clientLoading } = useQuery({
    queryKey: ["client-full", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", selectedClient.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  // Fetch client stats
  const { data: stats = { campaigns: 0, tasks: 0, activeCampaigns: 0, marketingData: 0 } } = useQuery({
    queryKey: ["client-profile-stats", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return { campaigns: 0, tasks: 0, activeCampaigns: 0, marketingData: 0 };
      
      const [campaignsRes, tasksRes, marketingRes] = await Promise.all([
        supabase.from("campaigns").select("status").eq("client_id", selectedClient.id),
        supabase.from("tasks").select("status").eq("client_id", selectedClient.id),
        supabase.from("marketing_data").select("id").eq("client_id", selectedClient.id),
      ]);

      const campaigns = campaignsRes.data || [];
      const tasks = tasksRes.data || [];
      const marketingData = marketingRes.data || [];

      return {
        campaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === "active").length,
        tasks: tasks.length,
        pendingTasks: tasks.filter(t => t.status === "pending").length,
        marketingData: marketingData.length,
      };
    },
    enabled: !!selectedClient,
  });

  // Fetch integrations
  const { data: integrations = [] } = useQuery({
    queryKey: ["client-integrations", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return [];
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .eq("client_id", selectedClient.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  // Fetch sync schedule
  const { data: syncSchedule } = useQuery({
    queryKey: ["sync-schedule", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return null;
      const { data, error } = await supabase
        .from("sync_schedules")
        .select("sync_frequency")
        .eq("client_id", selectedClient.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClientForm }) => {
      const { error } = await supabase.from("clients").update({
        name: data.name,
        industry: data.industry || null,
        website: data.website || null,
        description: data.description || null,
        logo_url: data.logo_url || null,
        instagram_url: data.instagram_url || null,
        facebook_url: data.facebook_url || null,
        tiktok_url: data.tiktok_url || null,
        linkedin_url: data.linkedin_url || null,
        twitter_url: data.twitter_url || null,
        avg_profit_margin: data.avg_profit_margin || 0,
        jiy_commission_percent: data.jiy_commission_percent || 0,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-full"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      toast.success("הלקוח עודכן בהצלחה");
      setShowEditDialog(false);
    },
    onError: () => toast.error("שגיאה בעדכון לקוח"),
  });

  const openEditDialog = () => {
    if (clientData) {
      setForm({
        name: clientData.name,
        industry: clientData.industry || "",
        website: clientData.website || "",
        description: clientData.description || "",
        logo_url: clientData.logo_url || "",
        instagram_url: (clientData as any).instagram_url || "",
        facebook_url: (clientData as any).facebook_url || "",
        tiktok_url: (clientData as any).tiktok_url || "",
        linkedin_url: (clientData as any).linkedin_url || "",
        twitter_url: (clientData as any).twitter_url || "",
        avg_profit_margin: (clientData as any).avg_profit_margin || 0,
        jiy_commission_percent: (clientData as any).jiy_commission_percent || 0,
      });
      setShowEditDialog(true);
    }
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("שם הלקוח הוא שדה חובה");
      return;
    }
    if (selectedClient) {
      updateMutation.mutate({ id: selectedClient.id, data: form });
    }
  };

  const connectedIntegrations = integrations.filter(i => i.is_connected);

  if (clientsLoading) {
    return (
      <MainLayout>
        <div className="p-8 flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // No client selected - show client selector
  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader 
            title="לקוחות"
            description="בחר לקוח או צור לקוח חדש"
            actions={
              <Button className="glow" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 ml-2" />
                לקוח חדש
              </Button>
            }
          />

          {clients.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">אין לקוחות עדיין</h3>
              <p className="text-muted-foreground mb-4">הוסף את הלקוח הראשון שלך כדי להתחיל</p>
              <CreateClientDialog 
                open={showCreateDialog} 
                onOpenChange={setShowCreateDialog}
                trigger={
                  <Button>
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף לקוח
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client, index) => (
                <div 
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className="glass rounded-xl card-shadow opacity-0 animate-slide-up overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  style={{ animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: "forwards" }}
                >
                  <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {client.logo_url ? (
                        <img 
                          src={client.logo_url} 
                          alt={client.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                          {client.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg">{client.name}</h3>
                        {client.industry && (
                          <p className="text-sm text-muted-foreground">{client.industry}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-primary group-hover:underline">לחץ לצפייה בפרופיל →</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  // Client profile view
  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {clientData?.logo_url ? (
              <img 
                src={clientData.logo_url} 
                alt={clientData.name}
                className="w-20 h-20 rounded-xl object-cover shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg">
                {clientData?.name?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{clientData?.name} - הגדרות</h1>
              {clientData?.industry && (
                <Badge variant="secondary" className="mt-1">
                  <Briefcase className="w-3 h-3 ml-1" />
                  {clientData.industry}
                </Badge>
              )}
              {clientData?.description && (
                <p className="text-muted-foreground mt-2 max-w-xl">{clientData.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedClient(null)}>
              החלף לקוח
            </Button>
            <Button onClick={openEditDialog}>
              <Edit2 className="w-4 h-4 ml-2" />
              ערוך פרטים
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">קמפיינים פעילים</p>
                  <p className="text-3xl font-bold">{stats.activeCampaigns}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Megaphone className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">סה"כ קמפיינים</p>
                  <p className="text-3xl font-bold">{stats.campaigns}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">משימות</p>
                  <p className="text-3xl font-bold">{stats.tasks}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">נתוני שיווק</p>
                  <p className="text-3xl font-bold">{stats.marketingData}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Links & Social Media */}
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                קישורים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clientData?.website && (
                <a 
                  href={clientData.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <Globe className="w-5 h-5 text-primary" />
                  <span className="flex-1 truncate">{clientData.website.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              
              {(clientData as any)?.instagram_url && (
                <a 
                  href={(clientData as any).instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors"
                >
                  <Instagram className="w-5 h-5 text-pink-500" />
                  <span className="flex-1">Instagram</span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              
              {(clientData as any)?.facebook_url && (
                <a 
                  href={(clientData as any).facebook_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-colors"
                >
                  <Facebook className="w-5 h-5 text-[#1877F2]" />
                  <span className="flex-1">Facebook</span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              
              {(clientData as any)?.tiktok_url && (
                <a 
                  href={(clientData as any).tiktok_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors"
                >
                  <TikTokIcon className="w-5 h-5" />
                  <span className="flex-1">TikTok</span>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              )}
              
              {!clientData?.website && !(clientData as any)?.instagram_url && !(clientData as any)?.facebook_url && !(clientData as any)?.tiktok_url && (
                <p className="text-muted-foreground text-center py-4">אין קישורים עדיין</p>
              )}
            </CardContent>
          </Card>

          {/* Integrations Status */}
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  אינטגרציות
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/integrations">הגדר</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {connectedIntegrations.length > 0 ? (
                connectedIntegrations.map(integration => (
                  <div key={integration.id} className="flex items-center justify-between p-3 rounded-lg bg-success/10">
                    <span className="font-medium capitalize">{integration.platform.replace(/_/g, " ")}</span>
                    <Badge variant="outline" className="bg-success/20 text-success border-success/30">מחובר</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">אין אינטגרציות מחוברות</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/integrations">חבר עכשיו</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                פעולות מהירות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/analytics">
                  <TrendingUp className="w-4 h-4 ml-2" />
                  צפה באנליטיקס
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/campaigns">
                  <Megaphone className="w-4 h-4 ml-2" />
                  ניהול קמפיינים
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/marketing">
                  <Users className="w-4 h-4 ml-2" />
                  שיווק ופרסונות
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/tasks">
                  <Target className="w-4 h-4 ml-2" />
                  ניהול משימות
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>


        {/* Modules Settings - Admin only */}
        {isAdmin && (
          <ClientModulesSettings
            clientId={selectedClient.id}
            modules={modules}
            syncFrequency={syncSchedule?.sync_frequency || "daily"}
          />
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>עריכת פרטי לקוח</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">שם הלקוח *</label>
              <Input
                placeholder="שם הלקוח"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">תחום</label>
              <Input
                placeholder="לדוגמה: טכנולוגיה, נדל״ן, אופנה..."
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">אתר אינטרנט</label>
              <Input
                placeholder="https://example.com"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">לוגו (URL)</label>
              <Input
                placeholder="https://example.com/logo.png"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                dir="ltr"
              />
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">רשתות חברתיות</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Instagram className="w-5 h-5 text-pink-500" />
                  <Input
                    placeholder="https://instagram.com/..."
                    value={form.instagram_url}
                    onChange={(e) => setForm({ ...form, instagram_url: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="w-5 h-5 text-[#1877F2]" />
                  <Input
                    placeholder="https://facebook.com/..."
                    value={form.facebook_url}
                    onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <TikTokIcon className="w-5 h-5" />
                  <Input
                    placeholder="https://tiktok.com/@..."
                    value={form.tiktok_url}
                    onChange={(e) => setForm({ ...form, tiktok_url: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
            
            {/* Profitability Settings */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">הגדרות רווחיות</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">אחוז רווחיות ממוצע (%)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.avg_profit_margin || ""}
                    onChange={(e) => setForm({ ...form, avg_profit_margin: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    step={0.1}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">אחוז עמלה JIY (%)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.jiy_commission_percent || ""}
                    onChange={(e) => setForm({ ...form, jiy_commission_percent: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={100}
                    step={0.1}
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">תיאור</label>
              <Textarea
                placeholder="תיאור קצר על הלקוח..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  שמור שינויים
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
