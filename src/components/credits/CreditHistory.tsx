import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Gift, 
  RefreshCw,
  FileText,
  Clock
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { creditsToHours } from "@/hooks/useClientCredits";

interface Transaction {
  id: string;
  credits_amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
  task_id?: string | null;
}

interface CreditHistoryProps {
  transactions: Transaction[];
  maxHeight?: string;
}

export function CreditHistory({ transactions, maxHeight = "400px" }: CreditHistoryProps) {
  const getTypeConfig = (type: string, amount: number) => {
    const isPositive = amount > 0;
    
    switch (type) {
      case "task_deduction":
        return {
          icon: FileText,
          label: "משימה",
          color: "text-destructive",
          bgColor: "bg-destructive/10",
        };
      case "purchase":
        return {
          icon: ArrowUpRight,
          label: "רכישה",
          color: "text-success",
          bgColor: "bg-success/10",
        };
      case "refund":
        return {
          icon: RefreshCw,
          label: "החזר",
          color: "text-info",
          bgColor: "bg-info/10",
        };
      case "bonus":
        return {
          icon: Gift,
          label: "בונוס",
          color: "text-primary",
          bgColor: "bg-primary/10",
        };
      default:
        return {
          icon: isPositive ? ArrowUpRight : ArrowDownRight,
          label: isPositive ? "זיכוי" : "חיוב",
          color: isPositive ? "text-success" : "text-destructive",
          bgColor: isPositive ? "bg-success/10" : "bg-destructive/10",
        };
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          היסטוריית קרדיטים
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <p>אין היסטוריית עסקאות</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="p-4 border-b border-border">
        <h3 className="font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          היסטוריית קרדיטים
        </h3>
      </div>
      <ScrollArea style={{ maxHeight }}>
        <div className="divide-y divide-border">
          {transactions.map((transaction) => {
            const config = getTypeConfig(transaction.transaction_type, transaction.credits_amount);
            const Icon = config.icon;
            const isPositive = transaction.credits_amount > 0;

            return (
              <div key={transaction.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bgColor)}>
                    <Icon className={cn("w-5 h-5", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{config.label}</span>
                      <span className={cn("font-bold", isPositive ? "text-success" : "text-destructive")}>
                        {isPositive ? "+" : ""}{transaction.credits_amount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate max-w-[200px]">
                        {transaction.description || `${creditsToHours(Math.abs(transaction.credits_amount)).toFixed(1)} שעות`}
                      </span>
                      <span>
                        {format(new Date(transaction.created_at), "dd/MM/yy HH:mm", { locale: he })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
