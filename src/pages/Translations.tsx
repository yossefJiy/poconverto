import { MainLayout } from "@/components/layout/MainLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Languages,
  Plus,
  Save,
  Trash2,
  Search,
  Edit2,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface Translation {
  id: string;
  key: string;
  he: string;
  en: string | null;
  hi: string | null;
  context: string | null;
}

export default function Translations() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Translation>>({});
  const [newTranslation, setNewTranslation] = useState<Partial<Translation>>({
    key: "",
    he: "",
    en: "",
    hi: "",
    context: "",
  });

  const { data: translations = [], isLoading } = useQuery({
    queryKey: ["translations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("translations")
        .select("*")
        .order("key", { ascending: true });
      if (error) throw error;
      return data as Translation[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (translation: { key: string; he: string; en?: string; hi?: string; context?: string }) => {
      const { error } = await supabase
        .from("translations")
        .insert([translation]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translations"] });
      toast.success("התרגום נוסף בהצלחה");
      setIsDialogOpen(false);
      setNewTranslation({ key: "", he: "", en: "", hi: "", context: "" });
    },
    onError: () => {
      toast.error("שגיאה בהוספת התרגום");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Translation> }) => {
      const { error } = await supabase
        .from("translations")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translations"] });
      toast.success("התרגום עודכן בהצלחה");
      setEditingId(null);
    },
    onError: () => {
      toast.error("שגיאה בעדכון התרגום");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("translations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translations"] });
      toast.success("התרגום נמחק בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה במחיקת התרגום");
    },
  });

  const filteredTranslations = translations.filter(
    (t) =>
      t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.he.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.en && t.en.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.hi && t.hi.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAdd = () => {
    if (!newTranslation.key || !newTranslation.he) {
      toast.error("נא למלא את המפתח והתרגום בעברית");
      return;
    }
    addMutation.mutate({
      key: newTranslation.key,
      he: newTranslation.he,
      en: newTranslation.en || undefined,
      hi: newTranslation.hi || undefined,
      context: newTranslation.context || undefined,
    });
  };

  const handleEdit = (translation: Translation) => {
    setEditingId(translation.id);
    setEditData(translation);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, data: editData });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Languages className="w-8 h-8" />
              ניהול תרגומים
            </h1>
            <p className="text-muted-foreground">ניהול תרגומים לעברית, אנגלית והינדי</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                תרגום חדש
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>הוספת תרגום חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="key">מפתח (Key)</Label>
                  <Input
                    id="key"
                    value={newTranslation.key || ""}
                    onChange={(e) => setNewTranslation({ ...newTranslation, key: e.target.value })}
                    placeholder="example_key"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="context">הקשר</Label>
                  <Input
                    id="context"
                    value={newTranslation.context || ""}
                    onChange={(e) => setNewTranslation({ ...newTranslation, context: e.target.value })}
                    placeholder="תיאור ההקשר של התרגום"
                  />
                </div>
                <div>
                  <Label htmlFor="he">עברית 🇮🇱</Label>
                  <Input
                    id="he"
                    value={newTranslation.he || ""}
                    onChange={(e) => setNewTranslation({ ...newTranslation, he: e.target.value })}
                    placeholder="תרגום בעברית"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Label htmlFor="en">English 🇬🇧</Label>
                  <Input
                    id="en"
                    value={newTranslation.en || ""}
                    onChange={(e) => setNewTranslation({ ...newTranslation, en: e.target.value })}
                    placeholder="English translation"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="hi">हिन्दी 🇮🇳</Label>
                  <Input
                    id="hi"
                    value={newTranslation.hi || ""}
                    onChange={(e) => setNewTranslation({ ...newTranslation, hi: e.target.value })}
                    placeholder="हिन्दी अनुवाद"
                    dir="ltr"
                  />
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={addMutation.isPending}>
                  <Save className="w-4 h-4 ml-2" />
                  שמור
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="glass rounded-xl p-4 mb-6 opacity-0 animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש תרגומים..."
              className="pr-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-xl overflow-hidden opacity-0 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
          {isLoading ? (
            <div className="p-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 mb-2" />
              ))}
            </div>
          ) : filteredTranslations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchTerm ? "לא נמצאו תרגומים" : "אין תרגומים עדיין"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">מפתח</TableHead>
                  <TableHead>הקשר</TableHead>
                  <TableHead>🇮🇱 עברית</TableHead>
                  <TableHead>🇬🇧 English</TableHead>
                  <TableHead>🇮🇳 हिन्दी</TableHead>
                  <TableHead className="w-[100px]">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTranslations.map((translation) => (
                  <TableRow key={translation.id}>
                    {editingId === translation.id ? (
                      <>
                        <TableCell>
                          <Input
                            value={editData.key || ""}
                            onChange={(e) => setEditData({ ...editData, key: e.target.value })}
                            dir="ltr"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editData.context || ""}
                            onChange={(e) => setEditData({ ...editData, context: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editData.he || ""}
                            onChange={(e) => setEditData({ ...editData, he: e.target.value })}
                            dir="rtl"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editData.en || ""}
                            onChange={(e) => setEditData({ ...editData, en: e.target.value })}
                            dir="ltr"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editData.hi || ""}
                            onChange={(e) => setEditData({ ...editData, hi: e.target.value })}
                            dir="ltr"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={handleSaveEdit}>
                              <Check className="w-4 h-4 text-success" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-mono text-sm" dir="ltr">{translation.key}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{translation.context || "-"}</TableCell>
                        <TableCell dir="rtl">{translation.he}</TableCell>
                        <TableCell dir="ltr">{translation.en || "-"}</TableCell>
                        <TableCell dir="ltr">{translation.hi || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(translation)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMutation.mutate(translation.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
