import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { useAuth } from "@/hooks/useAuth";

import { 
  Building2, 
  Plus, 
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
  Save,
  Crown,
  User,
  Star,
  Building,
  Settings,
  Link2,
  DollarSign,
  Palette,
  Bell,
  Shield,
  Check,
  X,
  Phone,
  Mail,
  UserCircle,
  Linkedin,
  Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CreateClientDialog } from "@/components/client/CreateClientDialog";
// ClientModulesSettings removed
import { ClientLogoUploader } from "@/components/client/ClientLogoUploader";
import { Link } from "react-router-dom";

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

interface ClientFormData {
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
  google_ads_manager_url: string;
  facebook_ads_manager_url: string;
  account_type: "basic" | "premium";
  is_agency_brand: boolean;
  is_favorite: boolean;
}

// Inline editable field component
function EditableField({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  icon,
  dir = "rtl",
  disabled = false,
}: { 
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "url";
  icon?: React.ReactNode;
  dir?: "rtl" | "ltr";
  disabled?: boolean;
}) {
  return (
    <div className="group">
      <label className="text-sm font-medium text-muted-foreground mb-1.5 block flex items-center gap-2">
        {icon}
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        disabled={disabled}
        className="transition-all border-transparent bg-muted/30 focus:bg-background focus:border-primary"
      />
    </div>
  );
}

export default function ClientProfile() {
  const queryClient = useQueryClient();
  const { selectedClient, setSelectedClient, clients, isLoading: clientsLoading } = useClient();
  const { role } = useAuth();
  const isAdmin = role === 'super_admin' || role === 'admin';
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [form, setForm] = useState<ClientFormData>({
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
    google_ads_manager_url: "",
    facebook_ads_manager_url: "",
    account_type: "basic",
    is_agency_brand: false,
    is_favorite: false,
  });

  // Fetch full client data
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

  // Update form when client data loads
  useEffect(() => {
    if (clientData) {
      setForm({
        name: clientData.name || "",
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
        google_ads_manager_url: clientData.google_ads_manager_url || "",
        facebook_ads_manager_url: clientData.facebook_ads_manager_url || "",
        account_type: (clientData as any).account_type || "basic",
        is_agency_brand: (clientData as any).is_agency_brand || false,
        is_favorite: (clientData as any).is_favorite || false,
      });
      setHasChanges(false);
    }
  }, [clientData]);

  // Fetch client stats
  const { data: stats = { campaigns: 0, tasks: 0, activeCampaigns: 0, marketingData: 0, teamMembers: 0, contacts: 0 } } = useQuery({
    queryKey: ["client-profile-stats", selectedClient?.id],
    queryFn: async () => {
      if (!selectedClient) return { campaigns: 0, tasks: 0, activeCampaigns: 0, marketingData: 0, teamMembers: 0, contacts: 0 };
      
      const [campaignsRes, tasksRes, marketingRes, teamRes, contactsRes] = await Promise.all([
        supabase.from("campaigns").select("status").eq("client_id", selectedClient.id),
        supabase.from("tasks").select("status").eq("client_id", selectedClient.id),
        supabase.from("marketing_data").select("id").eq("client_id", selectedClient.id),
        supabase.from("client_team").select("id").eq("client_id", selectedClient.id),
        supabase.from("client_contacts").select("id").eq("client_id", selectedClient.id),
      ]);

      const campaigns = campaignsRes.data || [];
      const tasks = tasksRes.data || [];

      return {
        campaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === "active").length,
        tasks: tasks.length,
        pendingTasks: tasks.filter(t => t.status === "pending").length,
        marketingData: marketingRes.data?.length || 0,
        teamMembers: teamRes.data?.length || 0,
        contacts: contactsRes.data?.length || 0,
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

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient) throw new Error("No client selected");
      const { error } = await supabase.from("clients").update({
        name: form.name,
        industry: form.industry || null,
        website: form.website || null,
        description: form.description || null,
        logo_url: form.logo_url || null,
        instagram_url: form.instagram_url || null,
        facebook_url: form.facebook_url || null,
        tiktok_url: form.tiktok_url || null,
        linkedin_url: form.linkedin_url || null,
        twitter_url: form.twitter_url || null,
        avg_profit_margin: form.avg_profit_margin || 0,
        jiy_commission_percent: form.jiy_commission_percent || 0,
        google_ads_manager_url: form.google_ads_manager_url || null,
        facebook_ads_manager_url: form.facebook_ads_manager_url || null,
        account_type: form.account_type,
        is_agency_brand: form.is_agency_brand,
        is_favorite: form.is_favorite,
      }).eq("id", selectedClient.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-full"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      toast.success("השינויים נשמרו בהצלחה");
      setHasChanges(false);
    },
    onError: () => toast.error("שגיאה בשמירת השינויים"),
  });

  const updateField = (field: keyof ClientFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("שם הלקוח הוא שדה חובה");
      return;
    }
    updateMutation.mutate();
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
                    <p className="text-sm text-primary group-hover:underline">לחץ לצפייה בהגדרות →</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    );
  }

  // Client settings view
  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header with save button */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {clientData?.logo_url ? (
              <div className="w-16 h-16 rounded-xl bg-white border-2 border-border flex items-center justify-center overflow-hidden shadow-lg">
                <img 
                  src={clientData.logo_url} 
                  alt={clientData.name}
                  className="w-full h-full object-contain p-1"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg">
                {clientData?.name?.charAt(0) || "?"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{clientData?.name}</h1>
                {form.is_favorite && <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />}
                {form.is_agency_brand && <Building className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={(clientData as any)?.account_type === "premium" ? "default" : "secondary"}>
                  {(clientData as any)?.account_type === "premium" ? "פרמיום" : "בסיסי"}
                </Badge>
                {clientData?.industry && (
                  <Badge variant="outline">{clientData.industry}</Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedClient(null)}>
              החלף לקוח
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              className={cn(hasChanges && "animate-pulse")}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  שמור שינויים
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Unsaved changes indicator */}
        {hasChanges && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg px-4 py-2 flex items-center gap-2 text-warning">
            <Bell className="w-4 h-4" />
            <span className="text-sm">יש שינויים שלא נשמרו</span>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="glass border-0">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">קמפיינים</p>
                  <p className="text-2xl font-bold">{stats.activeCampaigns}/{stats.campaigns}</p>
                </div>
                <Megaphone className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-0">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">משימות</p>
                  <p className="text-2xl font-bold">{stats.tasks}</p>
                </div>
                <Target className="w-5 h-5 text-accent" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-0">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">אנשי קשר</p>
                  <p className="text-2xl font-bold">{stats.contacts}</p>
                </div>
                <UserCircle className="w-5 h-5 text-warning" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-0">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">צוות</p>
                  <p className="text-2xl font-bold">{stats.teamMembers}</p>
                </div>
                <Users className="w-5 h-5 text-success" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass border-0">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">אינטגרציות</p>
                  <p className="text-2xl font-bold">{connectedIntegrations.length}</p>
                </div>
                <Link2 className="w-5 h-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different settings sections */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="general" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">פרטים כלליים</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">קישורים</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="gap-2">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">פרסום</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">כספים</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">מתקדם</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    פרטי לקוח
                  </CardTitle>
                  <CardDescription>מידע בסיסי על הלקוח</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EditableField
                    label="שם הלקוח *"
                    value={form.name}
                    onChange={(v) => updateField("name", v)}
                    placeholder="שם הלקוח"
                    icon={<Building2 className="w-4 h-4" />}
                  />
                  <EditableField
                    label="תחום"
                    value={form.industry}
                    onChange={(v) => updateField("industry", v)}
                    placeholder="לדוגמה: טכנולוגיה, נדל״ן, אופנה..."
                    icon={<Briefcase className="w-4 h-4" />}
                  />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">תיאור</label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="תיאור קצר על הלקוח..."
                      className="transition-all border-transparent bg-muted/30 focus:bg-background focus:border-primary"
                      rows={3}
                    />
                  </div>
                  
                  {/* Logo Uploader */}
                  {selectedClient && (
                    <ClientLogoUploader
                      clientId={selectedClient.id}
                      currentLogoUrl={form.logo_url || null}
                      onUploadComplete={(url) => updateField("logo_url", url)}
                      onRemove={() => updateField("logo_url", "")}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Account Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    הגדרות חשבון
                  </CardTitle>
                  <CardDescription>סוג החשבון והגדרות מיוחדות</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">סוג חשבון</label>
                    <Select 
                      value={form.account_type} 
                      onValueChange={(v: "basic" | "premium") => updateField("account_type", v)}
                    >
                      <SelectTrigger className="border-transparent bg-muted/30 focus:bg-background focus:border-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            בסיסי
                          </div>
                        </SelectItem>
                        <SelectItem value="premium">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-500" />
                            פרמיום
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Toggle switches */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex items-center gap-3">
                        <Star className={cn("w-5 h-5", form.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                        <div>
                          <p className="font-medium">לקוח מועדף</p>
                          <p className="text-xs text-muted-foreground">יוצג בראש רשימת הלקוחות</p>
                        </div>
                      </div>
                      <Switch
                        checked={form.is_favorite}
                        onCheckedChange={(checked) => updateField("is_favorite", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-3">
                        <Building className={cn("w-5 h-5", form.is_agency_brand ? "text-primary" : "text-muted-foreground")} />
                        <div>
                          <p className="font-medium">מותג של הסוכנות</p>
                          <p className="text-xs text-muted-foreground">יוצג מתחת לחשבון הסוכנות</p>
                        </div>
                      </div>
                      <Switch
                        checked={form.is_agency_brand}
                        onCheckedChange={(checked) => updateField("is_agency_brand", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Social & Links Tab */}
          <TabsContent value="social" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Website */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    אתר אינטרנט
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableField
                    label="כתובת אתר"
                    value={form.website}
                    onChange={(v) => updateField("website", v)}
                    placeholder="https://example.com"
                    dir="ltr"
                    icon={<Globe className="w-4 h-4" />}
                  />
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    רשתות חברתיות
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EditableField
                    label="Instagram"
                    value={form.instagram_url}
                    onChange={(v) => updateField("instagram_url", v)}
                    placeholder="https://instagram.com/..."
                    dir="ltr"
                    icon={<Instagram className="w-4 h-4 text-pink-500" />}
                  />
                  <EditableField
                    label="Facebook"
                    value={form.facebook_url}
                    onChange={(v) => updateField("facebook_url", v)}
                    placeholder="https://facebook.com/..."
                    dir="ltr"
                    icon={<Facebook className="w-4 h-4 text-[#1877F2]" />}
                  />
                  <EditableField
                    label="TikTok"
                    value={form.tiktok_url}
                    onChange={(v) => updateField("tiktok_url", v)}
                    placeholder="https://tiktok.com/@..."
                    dir="ltr"
                    icon={<TikTokIcon className="w-4 h-4" />}
                  />
                  <EditableField
                    label="LinkedIn"
                    value={form.linkedin_url}
                    onChange={(v) => updateField("linkedin_url", v)}
                    placeholder="https://linkedin.com/company/..."
                    dir="ltr"
                    icon={<Linkedin className="w-4 h-4 text-[#0A66C2]" />}
                  />
                  <EditableField
                    label="Twitter / X"
                    value={form.twitter_url}
                    onChange={(v) => updateField("twitter_url", v)}
                    placeholder="https://twitter.com/..."
                    dir="ltr"
                    icon={<Twitter className="w-4 h-4" />}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-primary" />
                  קישורים למנהלי מודעות
                </CardTitle>
                <CardDescription>קישורים ישירים לחשבונות הפרסום של הלקוח</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block flex items-center gap-2">
                    <img 
                      src="https://www.gstatic.com/images/branding/product/2x/ads_48dp.png" 
                      alt="Google Ads" 
                      className="w-4 h-4"
                    />
                    Google Ads Manager
                  </label>
                  <Input
                    value={form.google_ads_manager_url}
                    onChange={(e) => updateField("google_ads_manager_url", e.target.value)}
                    placeholder="https://ads.google.com/aw/overview?ocid=..."
                    dir="ltr"
                    className="transition-all border-transparent bg-muted/30 focus:bg-background focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">f</span>
                    </div>
                    Facebook / Meta Ads Manager
                  </label>
                  <Input
                    value={form.facebook_ads_manager_url}
                    onChange={(e) => updateField("facebook_ads_manager_url", e.target.value)}
                    placeholder="https://business.facebook.com/adsmanager/..."
                    dir="ltr"
                    className="transition-all border-transparent bg-muted/30 focus:bg-background focus:border-primary"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Connected Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-primary" />
                    אינטגרציות מחוברות
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/analytics?integrations=open">נהל חיבורים</Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {connectedIntegrations.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {connectedIntegrations.map(integration => (
                      <div key={integration.id} className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                        <Check className="w-4 h-4 text-success" />
                        <span className="font-medium capitalize text-sm">{integration.platform.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-3">אין אינטגרציות מחוברות</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/analytics?integrations=open">חבר עכשיו</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  הגדרות רווחיות
                </CardTitle>
                <CardDescription>הגדרות כספיות ועמלות</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">אחוז רווחיות ממוצע (%)</label>
                    <Input
                      type="number"
                      value={form.avg_profit_margin || ""}
                      onChange={(e) => updateField("avg_profit_margin", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min={0}
                      max={100}
                      step={0.1}
                      className="transition-all border-transparent bg-muted/30 focus:bg-background focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">אחוז עמלה JIY (%)</label>
                    <Input
                      type="number"
                      value={form.jiy_commission_percent || ""}
                      onChange={(e) => updateField("jiy_commission_percent", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      min={0}
                      max={100}
                      step={0.1}
                      className="transition-all border-transparent bg-muted/30 focus:bg-background focus:border-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            {/* Placeholder for future module settings */}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  פעולות מהירות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link to="/analytics">
                      <TrendingUp className="w-4 h-4 ml-2" />
                      אנליטיקס
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link to="/campaigns">
                      <Megaphone className="w-4 h-4 ml-2" />
                      קמפיינים
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link to="/tasks">
                      <Target className="w-4 h-4 ml-2" />
                      משימות
                    </Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link to="/marketing">
                      <Users className="w-4 h-4 ml-2" />
                      שיווק
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}