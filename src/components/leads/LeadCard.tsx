import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { 
  MoreVertical, 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  MessageSquare,
  Star,
  Trash2,
  Edit,
  UserPlus
} from "lucide-react";
import { Lead } from "@/hooks/useLeads";

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  className?: string;
}

const priorityConfig = {
  low: { label: "נמוך", color: "bg-muted text-muted-foreground" },
  medium: { label: "בינוני", color: "bg-primary/20 text-primary" },
  high: { label: "גבוה", color: "bg-warning/20 text-warning" },
  urgent: { label: "דחוף", color: "bg-destructive/20 text-destructive" },
};

const stageConfig = {
  new: { label: "חדש", color: "bg-blue-500/20 text-blue-600" },
  contacted: { label: "נוצר קשר", color: "bg-purple-500/20 text-purple-600" },
  qualified: { label: "מוסמך", color: "bg-cyan-500/20 text-cyan-600" },
  proposal: { label: "הצעה", color: "bg-amber-500/20 text-amber-600" },
  negotiation: { label: "משא ומתן", color: "bg-orange-500/20 text-orange-600" },
  won: { label: "נסגר", color: "bg-success/20 text-success" },
  lost: { label: "אבוד", color: "bg-destructive/20 text-destructive" },
};

export function LeadCard({ lead, onClick, onEdit, onDelete, onAssign, className }: LeadCardProps) {
  const priority = priorityConfig[lead.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const stage = stageConfig[lead.pipeline_stage as keyof typeof stageConfig] || stageConfig.new;

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all cursor-pointer group",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/20 text-primary">
                {lead.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium flex items-center gap-2">
                {lead.name}
                {lead.lead_score > 70 && (
                  <Star className="w-4 h-4 text-warning fill-warning" />
                )}
              </h4>
              {lead.company && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {lead.company}
                </p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                <Edit className="w-4 h-4 mr-2" />
                עריכה
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAssign?.(); }}>
                <UserPlus className="w-4 h-4 mr-2" />
                הקצאה
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                מחיקה
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 mb-3 text-sm">
          {lead.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="w-3 h-3" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3 h-3" />
              <span dir="ltr">{lead.phone}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {lead.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {lead.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{lead.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", stage.color)}>
              {stage.label}
            </Badge>
            <Badge className={cn("text-xs", priority.color)}>
              {priority.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {lead.conversion_value && (
              <span className="font-medium text-success">
                ₪{lead.conversion_value.toLocaleString()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(lead.created_at), "dd/MM", { locale: he })}
            </span>
          </div>
        </div>

        {/* Score Bar */}
        {lead.lead_score > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">ציון ליד</span>
              <span className="font-medium">{lead.lead_score}/100</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all",
                  lead.lead_score >= 70 ? "bg-success" :
                  lead.lead_score >= 40 ? "bg-warning" : "bg-destructive"
                )}
                style={{ width: `${lead.lead_score}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
