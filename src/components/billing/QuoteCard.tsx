import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { 
  MoreVertical, 
  FileSpreadsheet, 
  Send, 
  Eye,
  Copy,
  ExternalLink
} from "lucide-react";
import { Quote } from "@/hooks/useBilling";

interface QuoteCardProps {
  quote: Quote;
  onView?: () => void;
  onSend?: () => void;
  onCopyLink?: () => void;
  onDuplicate?: () => void;
  className?: string;
}

const statusConfig = {
  draft: { label: "טיוטה", color: "bg-muted text-muted-foreground" },
  sent: { label: "נשלחה", color: "bg-blue-500/20 text-blue-600" },
  viewed: { label: "נצפתה", color: "bg-purple-500/20 text-purple-600" },
  accepted: { label: "אושרה", color: "bg-success/20 text-success" },
  rejected: { label: "נדחתה", color: "bg-destructive/20 text-destructive" },
  expired: { label: "פג תוקף", color: "bg-warning/20 text-warning" },
};

export function QuoteCard({ quote, onView, onSend, onCopyLink, onDuplicate, className }: QuoteCardProps) {
  const status = statusConfig[quote.status] || statusConfig.draft;
  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date() && quote.status !== "accepted";

  return (
    <Card className={cn("hover:shadow-md transition-all", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">{quote.quote_number}</h4>
              <p className="text-sm text-muted-foreground">
                {quote.clients?.name || quote.leads?.name || "ליד"}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="w-4 h-4 mr-2" />
                צפייה
              </DropdownMenuItem>
              {quote.status === "draft" && (
                <DropdownMenuItem onClick={onSend}>
                  <Send className="w-4 h-4 mr-2" />
                  שליחה
                </DropdownMenuItem>
              )}
              {quote.public_token && (
                <DropdownMenuItem onClick={onCopyLink}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  העתק קישור
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                שכפול
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h5 className="font-medium mb-2">{quote.title}</h5>

        <div className="flex items-center gap-2 mb-3">
          <Badge className={cn("text-xs", isExpired ? statusConfig.expired.color : status.color)}>
            {isExpired ? "פג תוקף" : status.label}
          </Badge>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">נוצר</span>
            <span>{format(new Date(quote.created_at), "dd/MM/yyyy", { locale: he })}</span>
          </div>
          {quote.valid_until && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">בתוקף עד</span>
              <span className={cn(isExpired && "text-warning")}>
                {format(new Date(quote.valid_until), "dd/MM/yyyy", { locale: he })}
              </span>
            </div>
          )}
        </div>

        {quote.discount_amount > 0 && (
          <div className="mt-2 text-sm">
            <span className="text-success">הנחה: ₪{quote.discount_amount.toLocaleString()}</span>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-muted-foreground">סה״כ</span>
          <span className="text-xl font-bold">₪{quote.total_amount.toLocaleString()}</span>
        </div>

        {quote.accepted_at && (
          <p className="text-xs text-success mt-2">
            אושר ב-{format(new Date(quote.accepted_at), "dd/MM/yyyy HH:mm", { locale: he })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
