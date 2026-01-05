import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { 
  MoreVertical, 
  FileText, 
  Send, 
  CheckCircle, 
  Eye,
  Download,
  Trash2
} from "lucide-react";
import { Invoice } from "@/hooks/useBilling";

interface InvoiceCardProps {
  invoice: Invoice;
  onView?: () => void;
  onSend?: () => void;
  onMarkPaid?: () => void;
  onDownload?: () => void;
  className?: string;
}

const statusConfig = {
  draft: { label: "טיוטה", color: "bg-muted text-muted-foreground" },
  sent: { label: "נשלחה", color: "bg-blue-500/20 text-blue-600" },
  viewed: { label: "נצפתה", color: "bg-purple-500/20 text-purple-600" },
  paid: { label: "שולמה", color: "bg-success/20 text-success" },
  overdue: { label: "באיחור", color: "bg-destructive/20 text-destructive" },
  cancelled: { label: "בוטלה", color: "bg-muted text-muted-foreground line-through" },
};

const typeConfig = {
  invoice: { label: "חשבונית", icon: FileText },
  receipt: { label: "קבלה", icon: FileText },
  proforma: { label: "חשבונית עסקה", icon: FileText },
  credit_note: { label: "זיכוי", icon: FileText },
};

export function InvoiceCard({ invoice, onView, onSend, onMarkPaid, onDownload, className }: InvoiceCardProps) {
  const status = statusConfig[invoice.status] || statusConfig.draft;
  const type = typeConfig[invoice.type] || typeConfig.invoice;

  return (
    <Card className={cn("hover:shadow-md transition-all", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">{invoice.invoice_number}</h4>
              <p className="text-sm text-muted-foreground">
                {invoice.clients?.name || "לקוח"}
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
              {invoice.status === "draft" && (
                <DropdownMenuItem onClick={onSend}>
                  <Send className="w-4 h-4 mr-2" />
                  שליחה
                </DropdownMenuItem>
              )}
              {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                <DropdownMenuItem onClick={onMarkPaid}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  סמן כשולם
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                הורדת PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Badge className={cn("text-xs", status.color)}>
            {status.label}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {type.label}
          </Badge>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">תאריך</span>
            <span>{format(new Date(invoice.issue_date), "dd/MM/yyyy", { locale: he })}</span>
          </div>
          {invoice.due_date && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">לתשלום עד</span>
              <span className={cn(
                invoice.status === "overdue" && "text-destructive font-medium"
              )}>
                {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: he })}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-muted-foreground">סה״כ</span>
          <span className="text-xl font-bold">₪{invoice.total_amount.toLocaleString()}</span>
        </div>

        {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">שולם</span>
            <span className="text-success">₪{invoice.paid_amount.toLocaleString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
