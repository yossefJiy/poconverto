import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { ClientOnboardingWizard } from "@/components/client/ClientOnboardingWizard";
import { toast } from "sonner";
import { 
  Search, Plus, Building2, Users, BarChart3, Trash2, 
  RotateCcw, Eye, MoreHorizontal, Calendar, Activity, Archive
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useClient } from "@/hooks/useClient";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Client {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  is_active: boolean | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  modules_enabled: Record<string, boolean> | null;
}

interface ClientStats {
  client_id: string;
  tasks_count: number;
  campaigns_count: number;
  integrations_count: number;
  team_members_count: number;
}

export default function ClientManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [clientToRestore, setClientToRestore] = useState<Client | null>(null);
  const { setSelectedClient } = useClient();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch active clients
  const { data: activeClients, isLoading: loadingActive } = useQuery({
    queryKey: ["clients-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return data as Client[];
    },
  });

  // Fetch deleted clients
  const { data: deletedClients, isLoading: loadingDeleted } = useQuery({
    queryKey: ["clients-deleted"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      return data as Client[];
    },
  });

  // Fetch client stats
  const { data: clientStats } = useQuery({
    queryKey: ["client-stats"],
    queryFn: async () => {
      const stats: Record<string, ClientStats> = {};
      
      // Get tasks count per client
      const { data: taskCounts } = await supabase
        .from("tasks")
        .select("client_id")
        .not("client_id", "is", null);
      
      // Get campaigns count per client
      const { data: campaignCounts } = await supabase
        .from("campaigns")
        .select("client_id");
      
      // Get integrations count per client
      const { data: integrationCounts } = await supabase
        .from("integrations")
        .select("client_id");
      
      // Get team members count per client
      const { data: teamCounts } = await supabase
        .from("client_team")
        .select("client_id");

      // Aggregate counts
      const countByClient = (data: { client_id: string }[] | null, field: keyof ClientStats) => {
        data?.forEach((item) => {
          if (!stats[item.client_id]) {
            stats[item.client_id] = {
              client_id: item.client_id,
              tasks_count: 0,
              campaigns_count: 0,
              integrations_count: 0,
              team_members_count: 0,
            };
          }
          (stats[item.client_id][field] as number)++;
        });
      };

      countByClient(taskCounts, "tasks_count");
      countByClient(campaignCounts, "campaigns_count");
      countByClient(integrationCounts, "integrations_count");
      countByClient(teamCounts, "team_members_count");

      return stats;
    },
  });

  // Soft delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from("clients")
        .update({ deleted_at: new Date().toISOString(), is_active: false })
        .eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-active"] });
      queryClient.invalidateQueries({ queryKey: ["clients-deleted"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      toast.success("הלקוח הועבר לארכיון");
      setClientToDelete(null);
    },
    onError: (error) => {
      toast.error("שגיאה במחיקת הלקוח: " + error.message);
    },
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const { error } = await supabase
        .from("clients")
        .update({ deleted_at: null, is_active: true })
        .eq("id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients-active"] });
      queryClient.invalidateQueries({ queryKey: ["clients-deleted"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      toast.success("הלקוח שוחזר בהצלחה");
      setClientToRestore(null);
    },
    onError: (error) => {
      toast.error("שגיאה בשחזור הלקוח: " + error.message);
    },
  });

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    navigate("/client-profile");
  };

  const filteredActiveClients = activeClients?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDeletedClients = deletedClients?.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStats = {
    totalClients: activeClients?.length || 0,
    totalTasks: Object.values(clientStats || {}).reduce((sum, s) => sum + s.tasks_count, 0),
    totalCampaigns: Object.values(clientStats || {}).reduce((sum, s) => sum + s.campaigns_count, 0),
    totalIntegrations: Object.values(clientStats || {}).reduce((sum, s) => sum + s.integrations_count, 0),
  };

  return (
    <MainLayout>
      <PageHeader 
        title="ניהול לקוחות" 
        description="נהל את כל הלקוחות במערכת, צפה בנתונים ושחזר לקוחות מחוקים"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>לקוחות פעילים</CardDescription>
            <CardTitle className="text-3xl">{totalStats.totalClients}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {deletedClients?.length || 0} בארכיון
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>סה״כ משימות</CardDescription>
            <CardTitle className="text-3xl">{totalStats.totalTasks}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              בכל הלקוחות
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>קמפיינים</CardDescription>
            <CardTitle className="text-3xl">{totalStats.totalCampaigns}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              פעילים
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>אינטגרציות</CardDescription>
            <CardTitle className="text-3xl">{totalStats.totalIntegrations}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              מחוברות
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לקוחות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="h-4 w-4 ml-2" />
          לקוח חדש
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Building2 className="h-4 w-4" />
            לקוחות פעילים ({activeClients?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="archived" className="gap-2">
            <Archive className="h-4 w-4" />
            ארכיון ({deletedClients?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>לקוחות פעילים</CardTitle>
              <CardDescription>
                כל הלקוחות הפעילים במערכת
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingActive ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredActiveClients?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>לא נמצאו לקוחות</p>
                  <Button variant="link" onClick={() => setShowWizard(true)}>
                    צור לקוח חדש
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>שם</TableHead>
                      <TableHead>תעשייה</TableHead>
                      <TableHead>משימות</TableHead>
                      <TableHead>קמפיינים</TableHead>
                      <TableHead>אינטגרציות</TableHead>
                      <TableHead>נוצר</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActiveClients?.map((client) => {
                      const stats = clientStats?.[client.id];
                      return (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                {client.logo_url ? (
                                  <img 
                                    src={client.logo_url} 
                                    alt={client.name} 
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-lg font-bold text-primary">
                                    {client.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{client.name}</p>
                                {client.website && (
                                  <p className="text-xs text-muted-foreground" dir="ltr">
                                    {client.website}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.industry && (
                              <Badge variant="secondary">{client.industry}</Badge>
                            )}
                          </TableCell>
                          <TableCell>{stats?.tasks_count || 0}</TableCell>
                          <TableCell>{stats?.campaigns_count || 0}</TableCell>
                          <TableCell>{stats?.integrations_count || 0}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(client.created_at), "dd/MM/yy", { locale: he })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewClient(client)}>
                                  <Eye className="h-4 w-4 ml-2" />
                                  צפייה
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setClientToDelete(client)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 ml-2" />
                                  העבר לארכיון
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <CardHeader>
              <CardTitle>לקוחות בארכיון</CardTitle>
              <CardDescription>
                לקוחות שהועברו לארכיון. ניתן לשחזר אותם בכל עת.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingDeleted ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredDeletedClients?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>אין לקוחות בארכיון</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>שם</TableHead>
                      <TableHead>תעשייה</TableHead>
                      <TableHead>נמחק בתאריך</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeletedClients?.map((client) => (
                      <TableRow key={client.id} className="opacity-70">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-lg font-bold text-muted-foreground">
                                {client.name.charAt(0)}
                              </span>
                            </div>
                            <p className="font-medium">{client.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.industry && (
                            <Badge variant="outline">{client.industry}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.deleted_at && format(new Date(client.deleted_at), "dd/MM/yyyy HH:mm", { locale: he })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setClientToRestore(client)}
                          >
                            <RotateCcw className="h-4 w-4 ml-2" />
                            שחזר
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Onboarding Wizard */}
      <ClientOnboardingWizard open={showWizard} onOpenChange={setShowWizard} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>העברה לארכיון</AlertDialogTitle>
            <AlertDialogDescription>
              האם להעביר את הלקוח "{clientToDelete?.name}" לארכיון?
              ניתן לשחזר את הלקוח בכל עת.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clientToDelete && deleteMutation.mutate(clientToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              העבר לארכיון
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation */}
      <AlertDialog open={!!clientToRestore} onOpenChange={() => setClientToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>שחזור לקוח</AlertDialogTitle>
            <AlertDialogDescription>
              האם לשחזר את הלקוח "{clientToRestore?.name}"?
              הלקוח יחזור להיות פעיל במערכת.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clientToRestore && restoreMutation.mutate(clientToRestore.id)}
            >
              שחזר לקוח
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
