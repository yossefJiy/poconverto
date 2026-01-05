import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { he } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Coins, TrendingUp, TrendingDown, Calendar, FileText } from "lucide-react";
import { creditsToHours, creditsToCost } from "@/hooks/useClientCredits";

interface Transaction {
  id: string;
  credits_amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
  task_id: string | null;
}

interface CreditUsageReportProps {
  transactions: Transaction[];
  totalCredits: number;
  usedCredits: number;
  periodStart: string;
  periodEnd: string;
  className?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

export function CreditUsageReport({ 
  transactions, 
  totalCredits, 
  usedCredits,
  periodStart,
  periodEnd,
  className 
}: CreditUsageReportProps) {
  // Daily usage data for bar chart
  const dailyData = useMemo(() => {
    const start = startOfMonth(new Date(periodStart));
    const end = endOfMonth(new Date(periodEnd));
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayTransactions = transactions.filter(t => 
        isSameDay(new Date(t.created_at), day) && t.credits_amount < 0
      );
      const used = dayTransactions.reduce((sum, t) => sum + Math.abs(t.credits_amount), 0);
      
      return {
        date: format(day, "dd/MM"),
        קרדיטים: used,
      };
    });
  }, [transactions, periodStart, periodEnd]);

  // Usage by type for pie chart
  const usageByType = useMemo(() => {
    const typeMap: Record<string, number> = {};
    
    transactions
      .filter(t => t.credits_amount < 0)
      .forEach(t => {
        const type = t.transaction_type || "אחר";
        typeMap[type] = (typeMap[type] || 0) + Math.abs(t.credits_amount);
      });

    return Object.entries(typeMap).map(([name, value]) => ({
      name: name === "task_deduction" ? "משימות" : 
            name === "adjustment" ? "התאמות" : 
            name === "refund" ? "החזרים" : name,
      value,
    }));
  }, [transactions]);

  // Summary stats
  const stats = useMemo(() => {
    const deductions = transactions.filter(t => t.credits_amount < 0);
    const additions = transactions.filter(t => t.credits_amount > 0);
    
    return {
      totalDeducted: deductions.reduce((sum, t) => sum + Math.abs(t.credits_amount), 0),
      totalAdded: additions.reduce((sum, t) => sum + t.credits_amount, 0),
      transactionCount: transactions.length,
      avgPerTransaction: deductions.length > 0 
        ? Math.round(deductions.reduce((sum, t) => sum + Math.abs(t.credits_amount), 0) / deductions.length)
        : 0,
    };
  }, [transactions]);

  const remainingCredits = totalCredits - usedCredits;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Coins className="w-4 h-4" />
              <span className="text-xs">סה״כ נוצל</span>
            </div>
            <p className="text-xl font-bold text-destructive">{stats.totalDeducted.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{creditsToHours(stats.totalDeducted).toFixed(1)} שעות</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">נוסף</span>
            </div>
            <p className="text-xl font-bold text-success">{stats.totalAdded.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs">טרנזקציות</span>
            </div>
            <p className="text-xl font-bold">{stats.transactionCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">ממוצע לפעולה</span>
            </div>
            <p className="text-xl font-bold">{stats.avgPerTransaction}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">שימוש יומי</CardTitle>
            <CardDescription>קרדיטים שנוצלו בכל יום</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="קרדיטים" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage by Type Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">שימוש לפי סוג</CardTitle>
            <CardDescription>התפלגות השימוש בקרדיטים</CardDescription>
          </CardHeader>
          <CardContent>
            {usageByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={usageByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {usageByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} קרדיטים`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                אין נתונים להצגה
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">טרנזקציות אחרונות</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {transactions.slice(0, 20).map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {tx.credits_amount > 0 ? (
                      <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-success" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-destructive" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{tx.description || tx.transaction_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "font-mono",
                    tx.credits_amount > 0 
                      ? "bg-success/20 text-success" 
                      : "bg-destructive/20 text-destructive"
                  )}>
                    {tx.credits_amount > 0 ? "+" : ""}{tx.credits_amount}
                  </Badge>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">אין טרנזקציות</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
