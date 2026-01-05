import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
}

export function CreateABTestDialog({ open, onOpenChange, clientId }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [variantA, setVariantA] = useState("");
  const [variantB, setVariantB] = useState("");
  const queryClient = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns-select", clientId],
    queryFn: async () => {
      const query = supabase
        .from("campaigns")
        .select("id, name")
        .order("name");
      
      if (clientId) {
        query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open,
  });

  const createTest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ab_tests").insert({
        client_id: clientId,
        campaign_id: campaignId || null,
        name,
        description,
        variant_a: { description: variantA },
        variant_b: { description: variantB },
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ab-tests"] });
      toast.success("ניסוי A/B נוצר בהצלחה");
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("שגיאה ביצירת הניסוי");
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setCampaignId("");
    setVariantA("");
    setVariantB("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !variantA || !variantB) {
      toast.error("נא למלא את כל השדות הנדרשים");
      return;
    }
    createTest.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>צור ניסוי A/B חדש</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>שם הניסוי *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: בדיקת כותרת מודעה"
            />
          </div>

          <div>
            <Label>תיאור</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תאר את מטרת הניסוי"
              rows={2}
            />
          </div>

          <div>
            <Label>קמפיין</Label>
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר קמפיין (אופציונלי)" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>וריאנט A *</Label>
            <Textarea
              value={variantA}
              onChange={(e) => setVariantA(e.target.value)}
              placeholder="תאר את הגרסה הראשונה"
              rows={2}
            />
          </div>

          <div>
            <Label>וריאנט B *</Label>
            <Textarea
              value={variantB}
              onChange={(e) => setVariantB(e.target.value)}
              placeholder="תאר את הגרסה השנייה"
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              ביטול
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createTest.isPending}
            >
              {createTest.isPending ? "יוצר..." : "צור ניסוי"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
