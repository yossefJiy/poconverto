import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Loader2, FileText } from "lucide-react";
import { useBilling, ClientService, InvoiceItem } from "@/hooks/useBilling";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
}

export function CreateInvoiceDialog({ open, onOpenChange, clientId }: CreateInvoiceDialogProps) {
  const { services, createInvoice } = useBilling(clientId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clientId || "");
  
  const [formData, setFormData] = useState({
    type: "invoice" as const,
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    notes: "",
    terms: "תנאי תשלום: שוטף + 30",
  });

  const [items, setItems] = useState<Partial<InvoiceItem>[]>([
    { description: "", quantity: 1, unit_price: 0, discount_percent: 0, total: 0 }
  ]);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const calculateItemTotal = (item: Partial<InvoiceItem>) => {
    const subtotal = (item.quantity || 0) * (item.unit_price || 0);
    const discount = subtotal * ((item.discount_percent || 0) / 100);
    return subtotal - discount;
  };

  const updateItem = (index: number, updates: Partial<InvoiceItem>) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], ...updates };
      newItems[index].total = calculateItemTotal(newItems[index]);
      return newItems;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { description: "", quantity: 1, unit_price: 0, discount_percent: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addServiceItem = (service: ClientService) => {
    setItems(prev => [...prev, {
      service_id: service.id,
      description: service.name,
      quantity: 1,
      unit_price: service.price,
      discount_percent: 0,
      total: service.price,
    }]);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const taxRate = 17;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async () => {
    if (!selectedClientId || items.length === 0) return;

    setIsSubmitting(true);
    try {
      createInvoice({
        client_id: selectedClientId,
        type: formData.type,
        issue_date: formData.issue_date,
        due_date: formData.due_date || null,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: total,
        notes: formData.notes || null,
        terms: formData.terms || null,
        items: items.filter(item => item.description),
      });
      
      onOpenChange(false);
      setItems([{ description: "", quantity: 1, unit_price: 0, discount_percent: 0, total: 0 }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            יצירת חשבונית חדשה
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pl-4">
          <div className="space-y-6 py-4">
            {/* Client & Type */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>לקוח *</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>סוג</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">חשבונית</SelectItem>
                    <SelectItem value="proforma">חשבונית עסקה</SelectItem>
                    <SelectItem value="receipt">קבלה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>תאריך</Label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Services Quick Add */}
            {services.length > 0 && (
              <div className="space-y-2">
                <Label>הוספה מהירה משירותים</Label>
                <div className="flex flex-wrap gap-2">
                  {services.slice(0, 5).map((service) => (
                    <Button
                      key={service.id}
                      variant="outline"
                      size="sm"
                      onClick={() => addServiceItem(service)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {service.name} (₪{service.price})
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>פריטים</Label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  הוסף פריט
                </Button>
              </div>

              {items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label className="text-xs">תיאור</Label>
                        <Input
                          value={item.description || ""}
                          onChange={(e) => updateItem(index, { description: e.target.value })}
                          placeholder="תיאור הפריט"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">כמות</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity || 1}
                          onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">מחיר</Label>
                        <Input
                          type="number"
                          value={item.unit_price || 0}
                          onChange={(e) => updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">סה״כ</Label>
                        <div className="h-9 px-3 py-2 bg-muted rounded-md text-sm font-medium">
                          ₪{(item.total || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive"
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>סכום ביניים</span>
                <span>₪{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>מע״מ ({taxRate}%)</span>
                <span>₪{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>סה״כ לתשלום</span>
                <span>₪{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="הערות לחשבונית..."
                rows={2}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedClientId}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                יוצר...
              </>
            ) : "צור חשבונית"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
