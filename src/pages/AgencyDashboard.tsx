import { MainLayout } from "@/components/layout/MainLayout";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import { PageHeader } from "@/components/layout/PageHeader";
import { ClientsSummaryGrid } from "@/components/agency/ClientsSummaryGrid";
import { QuickTaskCreator } from "@/components/agency/QuickTaskCreator";
import { AgencyNotificationsHub } from "@/components/agency/AgencyNotificationsHub";
import { PriorityBalanceBar } from "@/components/agency/PriorityBalanceBar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, 
  CheckSquare, 
  Clock, 
  TrendingUp,
  Users,
  AlertTriangle,
  DollarSign,
  Target,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function AgencyDashboard() {
  const [showQuickTask, setShowQuickTask] = useState(false);

  // Fetch all clients
  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["agency-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all open tasks
  const { data: allTasks = [] } = useQuery({
    queryKey: ["agency-all-tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, status, client_id, due_date, priority, duration_minutes, priority_category")
        .neq("status", "completed");
      return data || [];
    },
  });

  // Fetch today's completed tasks
  const { data: completedToday = [] } = useQuery({
    queryKey: ["agency-completed-today"],
    queryFn: async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("tasks")
        .select("id, duration_minutes, client_id")
        .eq("status", "completed")
        .gte("updated_at", todayStart.toISOString());
      return data || [];
    },
  });

  // Fetch priority allocation
  const { data: priorityAllocation } = useQuery({
    queryKey: ["global-priority-allocation"],
    queryFn: async () => {
      const { data } = await supabase
        .from("priority_allocation")
        .select("*")
        .eq("scope_type", "global")
        .eq("is_active", true)
        .single();
      return data;
    },
  });

  // Fetch pending task requests
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["pending-task-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("task_requests")
        .select("id")
        .eq("status", "pending");
      return data || [];
    },
  });

  // Calculate stats
  const totalOpenTasks = allTasks.length;
  const urgentTasks = allTasks.filter((t: any) => t.priority === "urgent" || t.priority === "high").length;
  const todayTasks = allTasks.filter((t: any) => t.due_date === new Date().toISOString().split("T")[0]).length;
  const totalMinutesToday = completedToday.reduce((sum: number, t: any) => sum + (t.duration_minutes || 60), 0);
  const hoursCompletedToday = (totalMinutesToday / 60).toFixed(1);
  const activeClients = clients.filter((c: any) => !c.is_master_account).length;

  // Calculate priority balance
  const stabilityTasks = allTasks.filter((t: any) => 
    t.priority_category === "revenue" || t.priority_category === "maintenance"
  ).length;
  const innovationTasks = allTasks.filter((t: any) => 
    t.priority_category === "growth" || t.priority_category === "innovation"
  ).length;
  const categorizedTasks = stabilityTasks + innovationTasks;
  const actualStabilityPercent = categorizedTasks > 0 
    ? Math.round((stabilityTasks / categorizedTasks) * 100) 
    : 70;

  if (clientsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DomainErrorBoundary domain="agency">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <PageHeader 
              title="דשבורד סוכנות"
              description="סקירה כללית של כל הלקוחות והפעילות"
            />
            <div className="flex gap-3">
              <Button onClick={() => setShowQuickTask(true)}>
                <CheckSquare className="w-4 h-4 ml-2" />
                משימה חדשה
              </Button>
            </div>
          </div>

          {/* Priority Balance Bar */}
          <PriorityBalanceBar 
            targetStability={priorityAllocation?.stability_percent || 70}
            actualStability={actualStabilityPercent}
            className="mb-6"
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeClients}</p>
                    <p className="text-sm text-muted-foreground">לקוחות פעילים</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <CheckSquare className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalOpenTasks}</p>
                    <p className="text-sm text-muted-foreground">משימות פתוחות</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{urgentTasks}</p>
                    <p className="text-sm text-muted-foreground">משימות דחופות</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{todayTasks}</p>
                    <p className="text-sm text-muted-foreground">משימות היום</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{hoursCompletedToday}</p>
                    <p className="text-sm text-muted-foreground">שעות היום</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingRequests.length}</p>
                    <p className="text-sm text-muted-foreground">בקשות ממתינות</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Clients Grid - Takes 2 columns */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    לקוחות
                  </CardTitle>
                  <Link to="/client-management">
                    <Button variant="ghost" size="sm">צפה בכל</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <ClientsSummaryGrid clients={clients} tasks={allTasks} />
                </CardContent>
              </Card>
            </div>

            {/* Notifications Hub */}
            <div>
              <AgencyNotificationsHub 
                pendingRequests={pendingRequests.length}
                urgentTasks={urgentTasks}
              />
            </div>
          </div>

          {/* Quick Task Dialog */}
          <QuickTaskCreator 
            open={showQuickTask} 
            onOpenChange={setShowQuickTask}
            clients={clients}
          />
        </div>
      </DomainErrorBoundary>
    </MainLayout>
  );
}