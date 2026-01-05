import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useClient } from "@/hooks/useClient";
import { useApprovals, ApprovalItem } from "@/hooks/useApprovals";
import { ApprovalCard, ApprovalDetailDialog } from "@/components/approvals";
import { 
  Loader2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Inbox
} from "lucide-react";

export default function ApprovalsDashboard() {
  const { selectedClient } = useClient();
  const { pendingItems, allItems, stats, isLoading, makeDecision } = useApprovals(selectedClient?.id);
  
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const handleApprove = (item: ApprovalItem) => {
    makeDecision({ itemId: item.id, decision: "approved" });
  };

  const handleReject = (item: ApprovalItem) => {
    makeDecision({ itemId: item.id, decision: "rejected" });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="מערכת אישורים"
          description="ניהול ואישור בקשות"
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ממתינים</p>
                  <p className="text-xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">בבדיקה</p>
                  <p className="text-xl font-bold">{stats.inReview}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">אושרו</p>
                  <p className="text-xl font-bold text-success">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">נדחו</p>
                  <p className="text-xl font-bold">{stats.rejected}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">דחופים</p>
                  <p className="text-xl font-bold text-destructive">{stats.urgent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              ממתינים
              {pendingItems.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">כל הבקשות</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success opacity-50" />
                  <p className="text-muted-foreground">אין בקשות ממתינות לאישור</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingItems.map((item) => (
                    <ApprovalCard
                      key={item.id}
                      item={item}
                      onView={() => setSelectedItem(item)}
                      onApprove={() => handleApprove(item)}
                      onReject={() => handleReject(item)}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allItems.map((item) => (
                  <ApprovalCard
                    key={item.id}
                    item={item}
                    onView={() => setSelectedItem(item)}
                    onApprove={() => handleApprove(item)}
                    onReject={() => handleReject(item)}
                  />
                ))}
                {allItems.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    אין בקשות
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <ApprovalDetailDialog
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      />
    </MainLayout>
  );
}
