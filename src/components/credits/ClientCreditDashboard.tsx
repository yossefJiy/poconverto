import { useState } from "react";
import { useClientCredits, creditsToHours, creditsToCost } from "@/hooks/useClientCredits";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditMeter } from "./CreditMeter";
import { CreditHistory } from "./CreditHistory";
import { LimitWarnings } from "./LimitWarnings";
import { CreditCalculator } from "./CreditCalculator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Coins,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Plus
} from "lucide-react";

interface ClientCreditDashboardProps {
  clientId: string;
  clientName?: string;
  showCalculator?: boolean;
  onRequestTask?: () => void;
}

export function ClientCreditDashboard({ 
  clientId, 
  clientName,
  showCalculator = true,
  onRequestTask 
}: ClientCreditDashboardProps) {
  const { 
    credits, 
    transactions, 
    taskRequests, 
    remainingCredits, 
    usagePercentage, 
    isLowCredits,
    isLoading,
    submitTaskRequest
  } = useClientCredits(clientId);

  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!credits) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Coins className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">אין קרדיטים פעילים עבור לקוח זה</p>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = taskRequests.filter(r => r.status === "pending");
  const thisMonthTransactions = transactions.filter(t => {
    const date = new Date(t.created_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const creditsUsedThisMonth = thisMonthTransactions
    .filter(t => t.credits_amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.credits_amount), 0);

  return (
    <div className="space-y-6">
      {/* Limit Warnings */}
      <LimitWarnings
        clientId={clientId}
        usedCredits={credits.used_credits}
        totalCredits={credits.total_credits}
        onRequestMore={onRequestTask}
      />

      {/* Main Credit Meter */}
      <CreditMeter
        totalCredits={credits.total_credits}
        usedCredits={credits.used_credits}
        showDetails={true}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">תקופה נוכחית</span>
            </div>
            <p className="text-sm font-medium">
              {format(new Date(credits.period_start), "dd/MM", { locale: he })} - {format(new Date(credits.period_end), "dd/MM", { locale: he })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs">נוצל החודש</span>
            </div>
            <p className="text-sm font-medium">{creditsUsedThisMonth.toLocaleString()} קרדיטים</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">שעות נותרו</span>
            </div>
            <p className="text-sm font-medium">{creditsToHours(remainingCredits).toFixed(1)} שעות</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs">בקשות ממתינות</span>
            </div>
            <p className="text-sm font-medium">{pendingRequests.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">סקירה</TabsTrigger>
          <TabsTrigger value="history">היסטוריה</TabsTrigger>
          <TabsTrigger value="requests">בקשות</TabsTrigger>
          {showCalculator && <TabsTrigger value="calculator">מחשבון</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">פעילות אחרונה</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        {tx.credits_amount > 0 ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                        <span className="text-sm">{tx.description || tx.transaction_type}</span>
                      </div>
                      <span className={cn(
                        "font-medium",
                        tx.credits_amount > 0 ? "text-success" : "text-destructive"
                      )}>
                        {tx.credits_amount > 0 ? "+" : ""}{tx.credits_amount}
                      </span>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">אין פעילות</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Pending Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">בקשות ממתינות</CardTitle>
                {onRequestTask && (
                  <Button size="sm" variant="outline" onClick={onRequestTask}>
                    <Plus className="w-4 h-4 mr-1" />
                    בקשה חדשה
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="py-2 border-b border-border last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{req.title}</span>
                        <Badge variant="outline" className="bg-warning/20 text-warning">
                          {req.estimated_credits} קרדיטים
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(req.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                      </p>
                    </div>
                  ))}
                  {pendingRequests.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">אין בקשות ממתינות</p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <CreditHistory transactions={transactions} maxHeight="400px" />
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>כל הבקשות</CardTitle>
              <CardDescription>היסטוריית בקשות משימות</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {taskRequests.map((req) => {
                    const statusConfig = {
                      pending: { label: "ממתין", icon: Clock, color: "text-warning", bg: "bg-warning/20" },
                      approved: { label: "אושר", icon: CheckCircle, color: "text-success", bg: "bg-success/20" },
                      rejected: { label: "נדחה", icon: XCircle, color: "text-destructive", bg: "bg-destructive/20" },
                    };
                    const status = statusConfig[req.status as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = status.icon;

                    return (
                      <div key={req.id} className="p-3 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{req.title}</span>
                          <Badge className={cn("text-xs", status.bg, status.color)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        {req.description && (
                          <p className="text-sm text-muted-foreground mb-2">{req.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{format(new Date(req.created_at), "dd/MM/yyyy HH:mm", { locale: he })}</span>
                          <span>{req.estimated_credits} קרדיטים</span>
                        </div>
                        {req.rejection_reason && (
                          <p className="text-xs text-destructive mt-2">סיבת דחייה: {req.rejection_reason}</p>
                        )}
                      </div>
                    );
                  })}
                  {taskRequests.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">אין בקשות</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {showCalculator && (
          <TabsContent value="calculator" className="mt-4">
            <CreditCalculator />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
