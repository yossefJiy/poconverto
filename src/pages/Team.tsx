import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  CheckCircle2,
  Clock,
  Plus,
  Loader2,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const departmentConfig: Record<string, { color: string; label: string }> = {
  "קריאייטיב": { color: "bg-pink-500", label: "קריאייטיב" },
  "תוכן": { color: "bg-blue-500", label: "תוכן" },
  "אסטרטגיה": { color: "bg-purple-500", label: "אסטרטגיה" },
  "קופירייטינג": { color: "bg-green-500", label: "קופירייטינג" },
  "קמפיינים": { color: "bg-orange-500", label: "קמפיינים" },
  "מנהל מוצר": { color: "bg-teal-500", label: "מנהל מוצר" },
  "מנהל פרוייקטים": { color: "bg-indigo-500", label: "מנהל פרוייקטים" },
  "סטודיו": { color: "bg-rose-500", label: "סטודיו" },
  "גרפיקה": { color: "bg-amber-500", label: "גרפיקה" },
  "סרטונים": { color: "bg-cyan-500", label: "סרטונים" },
  "כלי AI": { color: "bg-violet-500", label: "כלי AI" },
  "מיתוג": { color: "bg-fuchsia-500", label: "מיתוג" },
  "אפיון אתרים": { color: "bg-lime-500", label: "אפיון אתרים" },
  "חוויית משתמש": { color: "bg-emerald-500", label: "חוויית משתמש" },
  "עיצוב אתרים": { color: "bg-sky-500", label: "עיצוב אתרים" },
  "תכנות": { color: "bg-red-500", label: "תכנות" },
  "ניהול אתרים": { color: "bg-yellow-500", label: "ניהול אתרים" },
};

export default function Team() {
  const { selectedClient } = useClient();
  const queryClient = useQueryClient();

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: taskStats = {} } = useQuery({
    queryKey: ["team-task-stats", selectedClient?.id],
    queryFn: async () => {
      let query = supabase.from("tasks").select("assigned_member_id, status");
      if (selectedClient) {
        query = query.eq("client_id", selectedClient.id);
      }
      const { data, error } = await query;
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
        <PageHeader 
          title={selectedClient ? `צוות - ${selectedClient.name}` : "הצוות"}
          description={selectedClient ? `חברי צוות העובדים עם ${selectedClient.name}` : "ניהול חברי צוות וביצועים"}
        />

        {teamMembers.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">אין חברי צוות</h3>
            <p className="text-muted-foreground">הוסף חברי צוות כדי להתחיל</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => {
              const stats = taskStats[member.id] || { completed: 0, inProgress: 0 };
              
              return (
                <div 
                  key={member.id}
                  className="glass rounded-xl card-shadow opacity-0 animate-slide-up overflow-hidden"
                  style={{ animationDelay: `${0.1 + index * 0.08}s`, animationFillMode: "forwards" }}
                >
                  <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                        {member.name.slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{member.name}</h3>
                        {member.email && (
                          <a 
                            href={`mailto:${member.email}`}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-6">
                      {member.departments.map((dept) => {
                        const config = departmentConfig[dept];
                        return (
                          <Badge 
                            key={dept} 
                            variant="secondary"
                            className="text-xs"
                          >
                            {config?.label || dept}
                          </Badge>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-success mb-1">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <p className="text-xl font-bold">{stats.completed}</p>
                        <p className="text-xs text-muted-foreground">הושלמו</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-warning mb-1">
                          <Clock className="w-4 h-4" />
                        </div>
                        <p className="text-xl font-bold">{stats.inProgress}</p>
                        <p className="text-xs text-muted-foreground">בתהליך</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
