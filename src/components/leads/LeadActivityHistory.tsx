import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { 
  Clock, 
  MessageSquare, 
  Phone, 
  Mail, 
  Edit, 
  UserCheck,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadActivityHistoryProps {
  leadId: string;
}

interface Activity {
  id: string;
  activity_type: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

const activityIcons: Record<string, typeof Clock> = {
  status_change: UserCheck,
  note: Edit,
  call: Phone,
  email: Mail,
  message: MessageSquare,
  default: Clock,
};

const activityLabels: Record<string, string> = {
  status_change: "שינוי סטטוס",
  note: "הערה",
  call: "שיחה",
  email: "אימייל",
  message: "הודעה",
};

export function LeadActivityHistory({ leadId }: LeadActivityHistoryProps) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["lead-activities", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Activity[];
    },
    enabled: !!leadId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">אין פעילות רשומה עדיין</p>
        <p className="text-sm text-muted-foreground mt-1">
          פעילויות יופיעו כאן כאשר יתבצעו שינויים
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.activity_type] || activityIcons.default;
        const label = activityLabels[activity.activity_type] || activity.activity_type;
        
        return (
          <div 
            key={activity.id} 
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(activity.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                </span>
              </div>
              {activity.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {activity.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
