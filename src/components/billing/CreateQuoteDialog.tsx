import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Loader2, FileSpreadsheet, GripVertical } from "lucide-react";
import { useBilling, ClientService, QuoteItem } from "@/hooks/useBilling";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format } from "date-fns";

interface CreateQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  leadId?: string;
}

export function CreateQuoteDialog({ open, onOpenChange, clientId, leadId }: CreateQuoteDialogProps) {
  const { services, createQuote } = useBilling(clientId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clientId || "");
  const [selectedLeadId, setSelectedLeadId] = useState(leadId || "");
  
  const [formData, setFormData] = useState({
    title: "הצעת מחיר",
    valid_until: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    discount_percent: 0,
    notes: "",
    terms: "הצעה זו בתוקף ל-30 יום מתאריך ההנפקה",
  });

  const [items, setItems] = useState<Partial<QuoteItem>[]>([
    { name: "", description: "", quantity: 1, unit_price: 0, discount_percent: 0, total: 0, is_optional: false, is_selected: true }
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

  const { data: leads = [] } = useQuery({
    queryKey: ["leads-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, company")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  const calculateItemTotal = (item: Partial<QuoteItem>) => {
    const subtotal = (item.quantity || 0) * (item.unit_price || 0);
    const discount = subtotal * ((item.discount_percent || 0) / 100);
    return subtotal - discount;
  };

  const updateItem = (index: number, updates: Partial<QuoteItem>) => {
    setItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], ...updates };
      newItems[index].total = calculateItemTotal(newItems[index]);
      return newItems;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { name: "", description: "", quantity: 1, unit_price: 0, discount_percent: 0, total: 0, is_optional: false, is_selected: true }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addServiceItem = (service: ClientService) => {
    setItems(prev => [...prev, {
      service_id: service.id,
      name: service.name,
      description: service.description || "",
      quantity: 1,
      unit_price: service.price,
      discount_percent: 0,
      total: service.price,
      is_optional: false,
      is_selected: true,
    }]);
  };

  const selectedItems = items.filter(item => item.is_selected !== false || !item.is_optional);
  const subtotal = selectedItems.reduce((sum, item) => sum + (item.total || 0), 0);
  const discountAmount = subtotal * ((formData.discount_percent || 0) / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxRate = 17;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;

  const handleSubmit = async () => {
    if ((!selectedClientId && !selectedLeadId) || items.length === 0) return;

    setIsSubmitting(true);
    try {
      createQuote({
        client_id: selectedClientId || null,
        lead_id: selectedLeadId || null,
        title: formData.title,
        valid_until: formData.valid_until || null,
        subtotal,
        discount_percent: formData.discount_percent,
        discount_amount: discountAmount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: total,
        notes: formData.notes || null,
        terms: formData.terms || null,
        items: items.filter(item => item.name),
      });
      
      onOpenChange(false);
      setItems([{ name: "", description: "", quantity: 1, unit_price: 0, discount_percent: 0, total: 0, is_optional: false, is_selected: true }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            יצירת הצעת מחיר
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pl-4">
          <div className="space-y-6 py-4">
            {/* Title & Validity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>כותרת *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="הצעת מחיר לשירותי..."
                />
              </div>
              <div className="space-y-2">
                <Label>בתוקף עד</Label>
                <Input
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                />
              </div>
            </div>

            {/* Client or Lead */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>לקוח קיים</Label>
                <Select value={selectedClientId} onValueChange={(v) => { setSelectedClientId(v); setSelectedLeadId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר לקוח" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ללא</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>או ליד</Label>
                <Select value={selectedLeadId} onValueChange={(v) => { setSelectedLeadId(v); setSelectedClientId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר ליד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ללא</SelectItem>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} {lead.company && `(${lead.company})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Card key={index} className={cn(item.is_optional && !item.is_selected && "opacity-60")}>
                  <CardContent className="p-3">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Label className="text-xs">שם הפריט</Label>
                        <Input
                          value={item.name || ""}
                          onChange={(e) => updateItem(index, { name: e.target.value })}
                          placeholder="שם השירות"
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
                      <div className="col-span-1 flex items-center gap-1">
                        <div className="flex flex-col items-center gap-1">
                          <Label className="text-[10px]">אופ׳</Label>
                          <Switch
                            checked={item.is_optional || false}
                            onCheckedChange={(checked) => updateItem(index, { is_optional: checked })}
                          />
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
                    {item.is_optional && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        פריט אופציונלי - הלקוח יוכל לבחור
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>הנחה כללית (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.discount_percent}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Totals */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>סכום ביניים</span>
                <span>₪{subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>הנחה ({formData.discount_percent}%)</span>
                  <span>-₪{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>מע״מ ({taxRate}%)</span>
                <span>₪{taxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>סה״כ</span>
                <span>₪{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>הערות</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="הערות להצעה..."
                rows={2}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || (!selectedClientId && !selectedLeadId)}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                יוצר...
              </>
            ) : "צור הצעת מחיר"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
