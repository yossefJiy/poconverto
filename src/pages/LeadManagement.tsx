import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useClient } from "@/hooks/useClient";
import { useLeads, Lead } from "@/hooks/useLeads";
import { LeadPipeline, LeadCard, LeadAnalytics, ConversationInbox, CreateLeadDialog } from "@/components/leads";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, Plus, Search, LayoutGrid, List, BarChart3 } from "lucide-react";

export default function LeadManagement() {
  const { selectedClient } = useClient();
  const { leads, isLoading } = useLeads(selectedClient?.id);
  
  const [view, setView] = useState<"pipeline" | "grid" | "list">("pipeline");
  const [activeTab, setActiveTab] = useState("leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);

  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.company?.toLowerCase().includes(query) ||
      lead.phone?.includes(query)
    );
  });

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
          title="ניהול לידים"
          description={`${leads.length} לידים ${selectedClient ? `עבור ${selectedClient.name}` : ""}`}
          actions={
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              ליד חדש
            </Button>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList>
              <TabsTrigger value="leads">לידים</TabsTrigger>
              <TabsTrigger value="analytics">אנליטיקס</TabsTrigger>
            </TabsList>

            {activeTab === "leads" && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="חיפוש לידים..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9 w-[200px]"
                  />
                </div>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <Button
                    variant={view === "pipeline" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setView("pipeline")}
                    className="rounded-none"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={view === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setView("grid")}
                    className="rounded-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <TabsContent value="leads" className="mt-6">
            {view === "pipeline" ? (
              <LeadPipeline
                clientId={selectedClient?.id}
                onLeadClick={(lead) => setSelectedLead(lead)}
                onLeadEdit={(lead) => { setEditLead(lead); setCreateDialogOpen(true); }}
              />
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => setSelectedLead(lead)}
                      onEdit={() => { setEditLead(lead); setCreateDialogOpen(true); }}
                    />
                  ))}
                  {filteredLeads.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      {searchQuery ? "לא נמצאו לידים התואמים לחיפוש" : "אין לידים עדיין"}
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <LeadAnalytics leads={leads} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <CreateLeadDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setEditLead(null);
        }}
        clientId={selectedClient?.id}
        editLead={editLead}
      />

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>{selectedLead?.name}</SheetTitle>
          </SheetHeader>
          {selectedLead && (
            <div className="mt-6">
              <Tabs defaultValue="conversation">
                <TabsList className="w-full">
                  <TabsTrigger value="conversation" className="flex-1">שיחות</TabsTrigger>
                  <TabsTrigger value="details" className="flex-1">פרטים</TabsTrigger>
                  <TabsTrigger value="activity" className="flex-1">פעילות</TabsTrigger>
                </TabsList>
                <TabsContent value="conversation" className="mt-4">
                  <ConversationInbox
                    leadId={selectedLead.id}
                    leadName={selectedLead.name}
                  />
                </TabsContent>
                <TabsContent value="details" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">אימייל</p>
                        <p className="font-medium">{selectedLead.email || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">טלפון</p>
                        <p className="font-medium" dir="ltr">{selectedLead.phone || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">חברה</p>
                        <p className="font-medium">{selectedLead.company || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">מקור</p>
                        <p className="font-medium">{selectedLead.source || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">שווי עסקה</p>
                        <p className="font-medium">
                          {selectedLead.conversion_value 
                            ? `₪${selectedLead.conversion_value.toLocaleString()}` 
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ציון ליד</p>
                        <p className="font-medium">{selectedLead.lead_score}/100</p>
                      </div>
                    </div>
                    {selectedLead.message && (
                      <div>
                        <p className="text-sm text-muted-foreground">הודעה</p>
                        <p className="mt-1">{selectedLead.message}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="activity" className="mt-4">
                  <p className="text-muted-foreground text-center py-8">
                    היסטוריית פעילות תוצג כאן
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}
