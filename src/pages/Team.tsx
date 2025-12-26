import { MainLayout } from "@/components/layout/MainLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  CheckCircle2,
  Clock,
  BarChart3,
  Edit2,
  Save,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { LanguageSwitcher, useTranslation } from "@/hooks/useTranslation";
import { useEditMode } from "@/hooks/useEditMode";

interface TeamMember {
  id: string;
  name: string;
  name_en: string | null;
  name_hi: string | null;
  departments: string[];
  email: string | null;
  is_active: boolean;
  avatar_url: string | null;
}

const departmentConfig: Record<string, { color: string; label: string; labelEn: string; labelHi: string }> = {
  "קריאייטיב": { color: "bg-pink-500", label: "קריאייטיב", labelEn: "Creative", labelHi: "क्रिएटिव" },
  "תוכן": { color: "bg-blue-500", label: "תוכן", labelEn: "Content", labelHi: "सामग्री" },
  "אסטרטגיה": { color: "bg-purple-500", label: "אסטרטגיה", labelEn: "Strategy", labelHi: "रणनीति" },
  "קופירייטינג": { color: "bg-green-500", label: "קופירייטינג", labelEn: "Copywriting", labelHi: "कॉपीराइटिंग" },
  "קמפיינים": { color: "bg-orange-500", label: "קמפיינים", labelEn: "Campaigns", labelHi: "अभियान" },
  "מנהל מוצר": { color: "bg-teal-500", label: "מנהל מוצר", labelEn: "Product Manager", labelHi: "उत्पाद प्रबंधक" },
  "מנהל פרוייקטים": { color: "bg-indigo-500", label: "מנהל פרוייקטים", labelEn: "Project Manager", labelHi: "परियोजना प्रबंधक" },
  "סטודיו": { color: "bg-rose-500", label: "סטודיו", labelEn: "Studio", labelHi: "स्टूडियो" },
  "גרפיקה": { color: "bg-amber-500", label: "גרפיקה", labelEn: "Graphics", labelHi: "ग्राफिक्स" },
  "סרטונים": { color: "bg-cyan-500", label: "סרטונים", labelEn: "Videos", labelHi: "वीडियो" },
  "כלי AI": { color: "bg-violet-500", label: "כלי AI", labelEn: "AI Tools", labelHi: "AI उपकरण" },
  "מיתוג": { color: "bg-fuchsia-500", label: "מיתוג", labelEn: "Branding", labelHi: "ब्रांडिंग" },
  "אפיון אתרים": { color: "bg-lime-500", label: "אפיון אתרים", labelEn: "Web Design", labelHi: "वेब डिज़ाइन" },
  "חוויית משתמש": { color: "bg-emerald-500", label: "חוויית משתמש", labelEn: "UX", labelHi: "यूएक्स" },
  "עיצוב אתרים": { color: "bg-sky-500", label: "עיצוב אתרים", labelEn: "Web Design", labelHi: "वेब डिजाइन" },
  "תכנות": { color: "bg-red-500", label: "תכנות", labelEn: "Development", labelHi: "विकास" },
  "ניהול אתרים": { color: "bg-yellow-500", label: "ניהול אתרים", labelEn: "Web Management", labelHi: "वेब प्रबंधन" },
  "משימות רפטטביות": { color: "bg-gray-500", label: "משימות רפטטביות", labelEn: "Repetitive Tasks", labelHi: "दोहराए जाने वाले कार्य" },
};

export default function Team() {
  const { language } = useTranslation();
  const { isEditMode } = useEditMode();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<TeamMember>>({});

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  const { data: taskStats = {} } = useQuery({
    queryKey: ["team-task-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("assigned_member_id, status");
      if (error) throw error;
      
      const stats: Record<string, { completed: number; inProgress: number }> = {};
      data.forEach((task) => {
        if (task.assigned_member_id) {
          if (!stats[task.assigned_member_id]) {
            stats[task.assigned_member_id] = { completed: 0, inProgress: 0 };
          }
          if (task.status === "completed") {
            stats[task.assigned_member_id].completed++;
          } else if (task.status === "in-progress") {
            stats[task.assigned_member_id].inProgress++;
          }
        }
      });
      return stats;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TeamMember> }) => {
      const { error } = await supabase
        .from("team_members")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("העובד עודכן בהצלחה");
      setEditingId(null);
    },
    onError: () => {
      toast.error("שגיאה בעדכון");
    },
  });

  const handleEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setEditData(member);
  };

  const handleSave = () => {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, updates: editData });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const getMemberName = (member: TeamMember) => {
    if (language === "en" && member.name_en) return member.name_en;
    if (language === "hi" && member.name_hi) return member.name_hi;
    return member.name;
  };

  const getDeptLabel = (dept: string) => {
    const config = departmentConfig[dept];
    if (!config) return dept;
    if (language === "en") return config.labelEn;
    if (language === "hi") return config.labelHi;
    return config.label;
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {language === "en" ? "Team" : language === "hi" ? "टीम" : "הצוות"}
            </h1>
            <p className="text-muted-foreground">
              {language === "en" ? "Team management and performance" : language === "hi" ? "टीम प्रबंधन और प्रदर्शन" : "ניהול חברי צוות וביצועים"}
            </p>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member, index) => {
            const stats = taskStats[member.id] || { completed: 0, inProgress: 0 };
            const isEditing = editingId === member.id;
            
            return (
              <div 
                key={member.id}
                className="glass rounded-xl card-shadow opacity-0 animate-slide-up glass-hover overflow-hidden"
                style={{ animationDelay: `${0.1 + index * 0.08}s`, animationFillMode: "forwards" }}
              >
                <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                <div className="p-6">
                  {/* Avatar & Info */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                      {member.name.slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editData.name || ""}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            placeholder="שם בעברית"
                            className="h-8"
                          />
                          <Input
                            value={editData.name_en || ""}
                            onChange={(e) => setEditData({ ...editData, name_en: e.target.value })}
                            placeholder="Name in English"
                            className="h-8"
                            dir="ltr"
                          />
                          <Input
                            value={editData.name_hi || ""}
                            onChange={(e) => setEditData({ ...editData, name_hi: e.target.value })}
                            placeholder="हिंदी में नाम"
                            className="h-8"
                            dir="ltr"
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-bold">{getMemberName(member)}</h3>
                          {member.email && (
                            <a 
                              href={`mailto:${member.email}`}
                              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </a>
                          )}
                        </>
                      )}
                    </div>
                    {isEditMode && !isEditing && (
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                    {isEditing && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={handleSave}>
                          <Save className="w-4 h-4 text-success" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleCancel}>
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Departments */}
                  <div className="flex flex-wrap gap-1 mb-6">
                    {member.departments.map((dept) => {
                      const config = departmentConfig[dept];
                      return (
                        <Badge 
                          key={dept} 
                          variant="secondary"
                          className={cn("text-xs", config?.color ? `${config.color}/20` : "")}
                        >
                          {getDeptLabel(dept)}
                        </Badge>
                      );
                    })}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-success mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <p className="text-xl font-bold">{stats.completed}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === "en" ? "Completed" : language === "hi" ? "पूर्ण" : "הושלמו"}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-warning mb-1">
                        <Clock className="w-4 h-4" />
                      </div>
                      <p className="text-xl font-bold">{stats.inProgress}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === "en" ? "In Progress" : language === "hi" ? "प्रगति पर" : "בתהליך"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
