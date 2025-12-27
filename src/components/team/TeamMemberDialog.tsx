import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const departmentOptions = [
  "קריאייטיב",
  "תוכן",
  "אסטרטגיה",
  "קופירייטינג",
  "קמפיינים",
  "מנהל מוצר",
  "מנהל פרוייקטים",
  "סטודיו",
  "גרפיקה",
  "סרטונים",
  "כלי AI",
  "מיתוג",
  "אפיון אתרים",
  "חוויית משתמש",
  "עיצוב אתרים",
  "תכנות",
  "ניהול אתרים",
];

export function TeamMemberDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    departments: [] as string[],
  });
  const [selectedDept, setSelectedDept] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("team_members").insert({
        name: form.name,
        email: form.email || null,
        departments: form.departments,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("חבר הצוות נוסף בהצלחה");
      setOpen(false);
      setForm({ name: "", email: "", departments: [] });
    },
    onError: () => toast.error("שגיאה בהוספת חבר צוות"),
  });

  const addDepartment = () => {
    if (selectedDept && !form.departments.includes(selectedDept)) {
      setForm({ ...form, departments: [...form.departments, selectedDept] });
      setSelectedDept("");
    }
  };

  const removeDepartment = (dept: string) => {
    setForm({ ...form, departments: form.departments.filter(d => d !== dept) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="glow">
          <Plus className="w-4 h-4 ml-2" />
          חבר צוות חדש
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>הוספת חבר צוות</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">שם מלא *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="שם חבר הצוות"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">אימייל</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">מחלקות</label>
            <div className="flex gap-2 mb-2">
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="בחר מחלקה" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.filter(d => !form.departments.includes(d)).map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={addDepartment}>
                הוסף
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.departments.map((dept) => (
                <span 
                  key={dept}
                  className="px-2 py-1 bg-primary/10 text-primary text-sm rounded-full flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={() => removeDepartment(dept)}
                >
                  {dept}
                  <span className="text-xs">×</span>
                </span>
              ))}
            </div>
          </div>
          
          <Button 
            className="w-full" 
            onClick={() => createMutation.mutate()}
            disabled={!form.name || createMutation.isPending}
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "הוסף חבר צוות"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
