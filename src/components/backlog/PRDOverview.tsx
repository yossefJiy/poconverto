import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Zap,
  Target,
  TrendingUp
} from "lucide-react";
import { prdSections, calculatePRDStats } from "@/data/prdFeatures";
import { cn } from "@/lib/utils";

export function PRDOverview() {
  const stats = calculatePRDStats(prdSections);

  const priorityCards = [
    { 
      label: "קריטי", 
      color: "text-destructive", 
      bg: "bg-destructive/10",
      icon: AlertTriangle,
      ...stats.critical 
    },
    { 
      label: "גבוה", 
      color: "text-orange-400", 
      bg: "bg-orange-500/10",
      icon: Zap,
      ...stats.high 
    },
    { 
      label: "בינוני", 
      color: "text-yellow-400", 
      bg: "bg-yellow-500/10",
      icon: Target,
      ...stats.medium 
    },
    { 
      label: "נמוך", 
      color: "text-muted-foreground", 
      bg: "bg-muted",
      icon: TrendingUp,
      ...stats.low 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Main Progress Card */}
      <Card className="lg:col-span-1 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PRD מוצר
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">{stats.percentage}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.completed} מתוך {stats.total} פיצ'רים
          </p>
          <Progress value={stats.percentage} className="mt-3 h-2" />
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary" className="bg-green-500/20 text-green-400">
              <CheckCircle2 className="h-3 w-3 ml-1" />
              {stats.completed} הושלמו
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Priority Cards */}
      {priorityCards.map((card) => {
        const Icon = card.icon;
        const percentage = card.total > 0 ? Math.round((card.completed / card.total) * 100) : 0;
        
        return (
          <Card key={card.label} className={cn("border-border/50", card.bg)}>
            <CardHeader className="pb-2">
              <CardTitle className={cn("text-sm font-medium flex items-center gap-2", card.color)}>
                <Icon className="h-4 w-4" />
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", card.color)}>
                {card.completed}/{card.total}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {percentage}% הושלמו
              </p>
              <Progress value={percentage} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
