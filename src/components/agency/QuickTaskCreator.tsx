import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, DollarSign, TrendingUp, Lightbulb, Wrench } from "lucide-react";

interface Client {
  id: string;
  name: string;
  is_master_account?: boolean;
}

interface QuickTaskCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
}

const priorityCategories = [
  { value: "revenue", label: "הכנסה", icon: DollarSign, color: "text-success" },
  { value: "growth", label: "צמיחה", icon: TrendingUp, color: "text-info" },
  { value: "innovation", label: "חדשנות", icon: Lightbulb, color: "text-warning" },
  { value: "maintenance", label: "תחזוקה", icon: Wrench, color: "text-muted-foreground" },
];

export function QuickTaskCreator({ open, onOpenChange, clients }: QuickTaskCreatorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [priorityCategory, setPriorityCategory] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").insert({
        title,
        description,
        client_id: clientId || null,
        priority,
        priority_category: priorityCategory || null,
        due_date: dueDate,
        status: "pending",
        created_by: user?.email,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("המשימה נוצרה בהצלחה");
      queryClient.invalidateQueries({ queryKey: ["agency-all-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("שגיאה ביצירת המשימה");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setClientId("");
    setPriority("medium");
    setPriorityCategory("");
    setDueDate(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("נא להזין כותרת למשימה");
      return;
    }
    createMutation.mutate();
  };

  const regularClients = clients.filter(c => !c.is_master_account);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>משימה חדשה מהירה</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">כותרת *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="מה צריך לעשות?"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">לקוח</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר לקוח (אופציונלי)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ללא לקוח (פנימי)</SelectItem>
                {regularClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">עדיפות</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">נמוכה</SelectItem>
                  <SelectItem value="medium">בינונית</SelectItem>
                  <SelectItem value="high">גבוהה</SelectItem>
                  <SelectItem value="urgent">דחופה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">תאריך יעד</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>קטגוריית עדיפות (70/30)</Label>
            <div className="grid grid-cols-4 gap-2">
              {priorityCategories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setPriorityCategory(priorityCategory === cat.value ? "" : cat.value)}
                  className={`
                    p-3 rounded-lg border text-center transition-all
                    ${priorityCategory === cat.value 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:bg-accent"}
                  `}
                >
                  <cat.icon className={`w-5 h-5 mx-auto mb-1 ${cat.color}`} />
                  <span className="text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="פרטים נוספים..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              צור משימה
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}