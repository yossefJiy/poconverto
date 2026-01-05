import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  MessageSquare,
  FileText,
  Image,
  Megaphone,
  DollarSign
} from "lucide-react";
import { ApprovalItem } from "@/hooks/useApprovals";

interface ApprovalCardProps {
  item: ApprovalItem;
  onView?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  className?: string;
}

const statusConfig = {
  pending: { label: "ממתין", color: "bg-warning/20 text-warning", icon: Clock },
  in_review: { label: "בבדיקה", color: "bg-primary/20 text-primary", icon: Eye },
  approved: { label: "אושר", color: "bg-success/20 text-success", icon: CheckCircle },
  rejected: { label: "נדחה", color: "bg-destructive/20 text-destructive", icon: XCircle },
  cancelled: { label: "בוטל", color: "bg-muted text-muted-foreground", icon: XCircle },
  expired: { label: "פג תוקף", color: "bg-muted text-muted-foreground", icon: AlertTriangle },
};

const priorityConfig = {
  low: { label: "נמוך", color: "bg-muted text-muted-foreground" },
  medium: { label: "בינוני", color: "bg-primary/20 text-primary" },
  high: { label: "גבוה", color: "bg-warning/20 text-warning" },
  urgent: { label: "דחוף", color: "bg-destructive/20 text-destructive" },
};

const typeIcons: Record<string, typeof FileText> = {
  content: FileText,
  campaign: Megaphone,
  budget: DollarSign,
  invoice: FileText,
  quote: FileText,
  ai_action: MessageSquare,
  general: FileText,
};

export function ApprovalCard({ item, onView, onApprove, onReject, className }: ApprovalCardProps) {
  const status = statusConfig[item.status] || statusConfig.pending;
  const priority = priorityConfig[item.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const StatusIcon = status.icon;
  const TypeIcon = typeIcons[item.item_type] || FileText;

  const isPending = ["pending", "in_review"].includes(item.status);
  const isOverdue = item.due_date && new Date(item.due_date) < new Date() && isPending;

  return (
    <Card className={cn(
      "hover:shadow-md transition-all",
      isOverdue && "border-destructive/50",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isPending ? "bg-primary/20" : "bg-muted"
            )}>
              <TypeIcon className={cn("w-5 h-5", isPending ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div>
              <h4 className="font-medium line-clamp-1">{item.title}</h4>
              <p className="text-sm text-muted-foreground">
                {item.clients?.name || "כללי"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", status.color)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </div>

        {item.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge className={cn("text-xs", priority.color)}>
            {priority.label}
          </Badge>
          {item.total_steps > 1 && (
            <Badge variant="outline" className="text-xs">
              שלב {item.current_step}/{item.total_steps}
            </Badge>
          )}
          {isOverdue && (
            <Badge className="text-xs bg-destructive/20 text-destructive">
              <AlertTriangle className="w-3 h-3 mr-1" />
              באיחור
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>
            נשלח {formatDistanceToNow(new Date(item.submitted_at), { locale: he, addSuffix: true })}
          </span>
          {item.due_date && (
            <span className={cn(isOverdue && "text-destructive font-medium")}>
              עד {format(new Date(item.due_date), "dd/MM/yyyy", { locale: he })}
            </span>
          )}
        </div>

        {isPending && (
          <div className="flex items-center gap-2 pt-3 border-t border-border">
            <Button size="sm" variant="outline" className="flex-1" onClick={onView}>
              <Eye className="w-4 h-4 mr-1" />
              צפייה
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-destructive hover:text-destructive"
              onClick={onReject}
            >
              <XCircle className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              className="text-success-foreground bg-success hover:bg-success/90"
              onClick={onApprove}
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
