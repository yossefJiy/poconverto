import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useClient } from "@/hooks/useClient";
import { useBilling } from "@/hooks/useBilling";
import { InvoiceCard, QuoteCard, CreateInvoiceDialog, CreateQuoteDialog } from "@/components/billing";
import { 
  Loader2, 
  Plus, 
  FileText, 
  FileSpreadsheet,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export default function BillingManagement() {
  const { selectedClient } = useClient();
  const { invoices, quotes, stats, isLoading } = useBilling(selectedClient?.id);
  
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [createQuoteOpen, setCreateQuoteOpen] = useState(false);

  if (isLoading) {
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
        <PageHeader
          title="חיובים וחשבוניות"
          description="ניהול חשבוניות והצעות מחיר"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setCreateQuoteOpen(true)}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                הצעת מחיר
              </Button>
              <Button onClick={() => setCreateInvoiceOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                חשבונית חדשה
              </Button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">שולם</p>
                  <p className="text-xl font-bold text-success">₪{stats.totalPaid.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ממתין לתשלום</p>
                  <p className="text-xl font-bold">₪{stats.totalPending.toLocaleString()}</p>
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
                  <p className="text-sm text-muted-foreground">באיחור</p>
                  <p className="text-xl font-bold text-destructive">₪{stats.totalOverdue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">הצעות שאושרו</p>
                  <p className="text-xl font-bold">{stats.quotesAccepted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices">
          <TabsList>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              חשבוניות
              <Badge variant="secondary" className="mr-1">{invoices.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              הצעות מחיר
              <Badge variant="secondary" className="mr-1">{quotes.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-6">
            {invoices.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">אין חשבוניות עדיין</p>
                  <Button onClick={() => setCreateInvoiceOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    צור חשבונית ראשונה
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {invoices.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      onView={() => {}}
                      onSend={() => {}}
                      onMarkPaid={() => {}}
                      onDownload={() => {}}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="quotes" className="mt-6">
            {quotes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">אין הצעות מחיר עדיין</p>
                  <Button onClick={() => setCreateQuoteOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    צור הצעת מחיר ראשונה
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quotes.map((quote) => (
                    <QuoteCard
                      key={quote.id}
                      quote={quote}
                      onView={() => {}}
                      onSend={() => {}}
                      onCopyLink={() => {}}
                      onDuplicate={() => {}}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateInvoiceDialog
        open={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
        clientId={selectedClient?.id}
      />

      <CreateQuoteDialog
        open={createQuoteOpen}
        onOpenChange={setCreateQuoteOpen}
        clientId={selectedClient?.id}
      />
    </MainLayout>
  );
}
