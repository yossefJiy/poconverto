import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useClient } from "@/hooks/useClient";

interface CreateClientDialogProps {
  trigger?: React.ReactNode;
}

export function CreateClientDialog({ trigger }: CreateClientDialogProps) {
  const queryClient = useQueryClient();
  const { setSelectedClient } = useClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    website: "",
    description: "",
    logo_url: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("clients").insert({
        name: form.name,
        industry: form.industry || null,
        website: form.website || null,
        description: form.description || null,
        logo_url: form.logo_url || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients-list"] });
      toast.success("הלקוח נוצר בהצלחה");
      setOpen(false);
      setForm({ name: "", industry: "", website: "", description: "", logo_url: "" });
      setSelectedClient(data);
    },
    onError: () => toast.error("שגיאה ביצירת לקוח"),
  });

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("שם הלקוח הוא שדה חובה");
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
            <Plus className="w-4 h-4" />
            לקוח חדש
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>יצירת לקוח חדש</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">שם הלקוח *</label>
            <Input
              placeholder="שם הלקוח"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">תחום</label>
            <Input
              placeholder="לדוגמה: טכנולוגיה, נדל״ן, אופנה..."
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">אתר אינטרנט</label>
            <Input
              placeholder="https://example.com"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">לוגו (URL)</label>
            <Input
              placeholder="https://example.com/logo.png"
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              dir="ltr"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">תיאור</label>
            <Textarea
              placeholder="תיאור קצר על הלקוח..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "צור לקוח"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
