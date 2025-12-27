import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CampaignEditDialogProps {
  campaign: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const platformConfig = {
  google: "Google Ads",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

const statusConfig = {
  draft: "טיוטה",
  active: "פעיל",
  paused: "מושהה",
  ended: "הסתיים",
};

export function CampaignEditDialog({ campaign, open, onOpenChange }: CampaignEditDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    platform: "facebook",
    status: "draft",
    budget: "",
    spent: "",
    impressions: "",
    clicks: "",
    conversions: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  useEffect(() => {
    if (campaign) {
      setForm({
        name: campaign.name || "",
        platform: campaign.platform || "facebook",
        status: campaign.status || "draft",
        budget: campaign.budget?.toString() || "",
        spent: campaign.spent?.toString() || "",
        impressions: campaign.impressions?.toString() || "",
        clicks: campaign.clicks?.toString() || "",
        conversions: campaign.conversions?.toString() || "",
        start_date: campaign.start_date || "",
        end_date: campaign.end_date || "",
        description: campaign.description || "",
      });
    }
  }, [campaign]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("campaigns").update({
        name: form.name,
        platform: form.platform,
        status: form.status,
        budget: parseFloat(form.budget) || 0,
        spent: parseFloat(form.spent) || 0,
        impressions: parseInt(form.impressions) || 0,
        clicks: parseInt(form.clicks) || 0,
        conversions: parseInt(form.conversions) || 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description || null,
      }).eq("id", campaign.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("הקמפיין עודכן בהצלחה");
      onOpenChange(false);
    },
    onError: () => toast.error("שגיאה בעדכון הקמפיין"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכת קמפיין</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-2 block">שם הקמפיין</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">פלטפורמה</label>
            <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(platformConfig).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">סטטוס</label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">תקציב (₪)</label>
            <Input
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">הוצאה (₪)</label>
            <Input
              type="number"
              value={form.spent}
              onChange={(e) => setForm({ ...form, spent: e.target.value })}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">חשיפות</label>
            <Input
              type="number"
              value={form.impressions}
              onChange={(e) => setForm({ ...form, impressions: e.target.value })}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">קליקים</label>
            <Input
              type="number"
              value={form.clicks}
              onChange={(e) => setForm({ ...form, clicks: e.target.value })}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">המרות</label>
            <Input
              type="number"
              value={form.conversions}
              onChange={(e) => setForm({ ...form, conversions: e.target.value })}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">תאריך התחלה</label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">תאריך סיום</label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-2 block">תיאור</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="md:col-span-2">
            <Button 
              className="w-full" 
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "שמור שינויים"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
