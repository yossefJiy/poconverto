import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useClientCredits, creditsToHours, creditsToCost, CREDITS_PER_HOUR } from "@/hooks/useClientCredits";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Coins,
  Users,
  Plus,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  Loader2,
  Building2
} from "lucide-react";

export default function CreditManagement() {
  const { allCredits, allTaskRequests, isLoadingAllCredits, addCredits, toggleCreditVisibility, approveTaskRequest } = useClientCredits();
  const [addCreditsDialog, setAddCreditsDialog] = useState<{ open: boolean; clientId: string; clientName: string } | null>(null);
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; requestId: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const pendingRequests = allTaskRequests.filter(r => r.status === "pending");
  const totalCreditsUsed = allCredits.reduce((sum, c) => sum + (c.used_credits || 0), 0);
  const totalCreditsAvailable = allCredits.reduce((sum, c) => sum + (c.total_credits || 0), 0);

  const handleAddCredits = () => {
    if (!addCreditsDialog || !creditsToAdd) return;
    
    const credits = parseInt(creditsToAdd);
    if (isNaN(credits) || credits <= 0) {
      toast.error("יש להזין מספר קרדיטים תקין");
      return;
    }

    addCredits({
      clientId: addCreditsDialog.clientId,
      credits,
      description: addDescription || undefined,
    });
    
    setAddCreditsDialog(null);
    setCreditsToAdd("");
    setAddDescription("");
  };

  const handleApprove = (requestId: string) => {
    approveTaskRequest({ requestId, approved: true });
  };

  const handleReject = () => {
    if (!rejectDialog) return;
    approveTaskRequest({ 
      requestId: rejectDialog.requestId, 
      approved: false, 
      rejectionReason: rejectionReason || undefined 
    });
    setRejectDialog(null);
    setRejectionReason("");
  };

  if (isLoadingAllCredits) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">ניהול קרדיטים</h1>
            <p className="text-muted-foreground">ניהול קרדיטים ובקשות משימות מלקוחות</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{allCredits.length}</p>
                  <p className="text-sm text-muted-foreground">לקוחות פעילים</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCreditsAvailable.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">סה״כ קרדיטים</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCreditsUsed.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">קרדיטים נוצלו</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-destructive/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-sm text-muted-foreground">בקשות ממתינות</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients">לקוחות וקרדיטים</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              בקשות משימות
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="mr-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>לקוחות וקרדיטים</CardTitle>
                <CardDescription>ניהול קרדיטים לכל לקוח</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {allCredits.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>אין לקוחות עם קרדיטים פעילים</p>
                      </div>
                    ) : (
                      allCredits.map((credit: any) => {
                        const remaining = credit.total_credits - credit.used_credits;
                        const percentage = (credit.used_credits / credit.total_credits) * 100;
                        const isLow = percentage >= 80;

                        return (
                          <div key={credit.id} className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                {credit.clients?.logo_url ? (
                                  <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center overflow-hidden shadow-sm">
                                    <img src={credit.clients.logo_url} alt="" className="w-full h-full object-contain p-0.5" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-primary" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-medium">{credit.clients?.name || "לקוח"}</h4>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(credit.period_start), "dd/MM")} - {format(new Date(credit.period_end), "dd/MM/yyyy", { locale: he })}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Dialog open={addCreditsDialog?.clientId === credit.client_id} onOpenChange={(open) => !open && setAddCreditsDialog(null)}>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setAddCreditsDialog({ 
                                        open: true, 
                                        clientId: credit.client_id, 
                                        clientName: credit.clients?.name || "לקוח" 
                                      })}
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      הוסף
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>הוספת קרדיטים ל-{addCreditsDialog?.clientName}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                      <div className="space-y-2">
                                        <Label>כמות קרדיטים</Label>
                                        <Input
                                          type="number"
                                          value={creditsToAdd}
                                          onChange={(e) => setCreditsToAdd(e.target.value)}
                                          placeholder="1200"
                                        />
                                        {creditsToAdd && (
                                          <p className="text-xs text-muted-foreground">
                                            = {creditsToHours(parseInt(creditsToAdd) || 0).toFixed(1)} שעות 
                                            = ₪{creditsToCost(parseInt(creditsToAdd) || 0).toLocaleString()}
                                          </p>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <Label>הערה (אופציונלי)</Label>
                                        <Textarea
                                          value={addDescription}
                                          onChange={(e) => setAddDescription(e.target.value)}
                                          placeholder="סיבת ההוספה..."
                                        />
                                      </div>
                                      <Button onClick={handleAddCredits} className="w-full">
                                        הוסף קרדיטים
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {credit.show_credits_to_client ? "גלוי ללקוח" : "מוסתר"}
                                  </span>
                                  <Switch
                                    checked={credit.show_credits_to_client}
                                    onCheckedChange={(show) => toggleCreditVisibility({ creditId: credit.id, show })}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className={cn(isLow && "text-warning font-medium")}>
                                  {remaining.toLocaleString()} / {credit.total_credits.toLocaleString()} קרדיטים
                                </span>
                                <span className={cn("font-medium", isLow ? "text-warning" : "text-muted-foreground")}>
                                  {percentage.toFixed(0)}% נוצל
                                </span>
                              </div>
                              <Progress value={percentage} className={cn(isLow && "[&>div]:bg-warning")} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>בקשות משימות מלקוחות</CardTitle>
                <CardDescription>אשר או דחה בקשות משימות</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {allTaskRequests.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>אין בקשות משימות</p>
                      </div>
                    ) : (
                      allTaskRequests.map((request: any) => {
                        const statusConfig = {
                          pending: { label: "ממתין", icon: Clock, color: "text-warning", bg: "bg-warning/20" },
                          approved: { label: "אושר", icon: CheckCircle, color: "text-success", bg: "bg-success/20" },
                          rejected: { label: "נדחה", icon: XCircle, color: "text-destructive", bg: "bg-destructive/20" },
                          completed: { label: "הושלם", icon: CheckCircle, color: "text-primary", bg: "bg-primary/20" },
                        };
                        const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
                        const StatusIcon = status.icon;

                        return (
                          <div key={request.id} className="p-4 rounded-lg border border-border">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{request.title}</h4>
                                  <Badge className={cn("text-xs", status.bg, status.color)}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {status.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />
                                    {request.clients?.name || "לקוח"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Coins className="w-3 h-3" />
                                    {request.estimated_credits} קרדיטים
                                  </span>
                                  <span>
                                    {format(new Date(request.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                                  </span>
                                </div>
                              </div>

                              {request.status === "pending" && (
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-success hover:text-success"
                                    onClick={() => handleApprove(request.id)}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    אשר
                                  </Button>
                                  <Dialog open={rejectDialog?.requestId === request.id} onOpenChange={(open) => !open && setRejectDialog(null)}>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => setRejectDialog({ open: true, requestId: request.id })}
                                      >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        דחה
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>דחיית בקשה</DialogTitle>
                                      </DialogHeader>
                                      <div className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                          <Label>סיבת הדחייה (אופציונלי)</Label>
                                          <Textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="הסבר ללקוח למה הבקשה נדחתה..."
                                          />
                                        </div>
                                        <Button onClick={handleReject} variant="destructive" className="w-full">
                                          דחה בקשה
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              )}
                            </div>

                            {request.rejection_reason && (
                              <div className="mt-3 p-3 rounded-lg bg-destructive/10 text-sm">
                                <span className="font-medium text-destructive">סיבת דחייה: </span>
                                {request.rejection_reason}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
