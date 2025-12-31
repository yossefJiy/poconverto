import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Zap,
  ArrowRight,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  impact: "high" | "medium" | "low";
  category: string;
  icon: React.ElementType;
}

const defaultSuggestions: Suggestion[] = [
  {
    id: "landing-page",
    title: "דף נחיתה ממיר",
    description: "עיצוב ופיתוח דף נחיתה עם אופטימיזציה להמרות",
    estimatedHours: 8,
    impact: "high",
    category: "פיתוח",
    icon: Target,
  },
  {
    id: "social-strategy",
    title: "אסטרטגיית תוכן חודשית",
    description: "תכנון ויצירת תוכן לרשתות החברתיות לחודש שלם",
    estimatedHours: 12,
    impact: "high",
    category: "שיווק",
    icon: TrendingUp,
  },
  {
    id: "automation",
    title: "אוטומציות שיווק",
    description: "הגדרת תהליכי אוטומציה למיילים וליודים",
    estimatedHours: 6,
    impact: "medium",
    category: "טכנולוגיה",
    icon: Zap,
  },
  {
    id: "analytics-setup",
    title: "הגדרת אנליטיקס מתקדם",
    description: "הטמעת מעקב מתקדם ודוחות מותאמים אישית",
    estimatedHours: 4,
    impact: "medium",
    category: "אנליטיקס",
    icon: Star,
  },
];

interface UpsellSuggestionsProps {
  onRequestProject?: (suggestion: Suggestion) => void;
  suggestions?: Suggestion[];
}

export function UpsellSuggestions({ onRequestProject, suggestions = defaultSuggestions }: UpsellSuggestionsProps) {
  const impactConfig = {
    high: { label: "השפעה גבוהה", className: "bg-success/20 text-success" },
    medium: { label: "השפעה בינונית", className: "bg-warning/20 text-warning" },
    low: { label: "השפעה נמוכה", className: "bg-muted text-muted-foreground" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-jiy-gold" />
          הצעות לפרויקטים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          
          return (
            <div 
              key={suggestion.id}
              className="group p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer"
              onClick={() => onRequestProject?.(suggestion)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium group-hover:text-primary transition-colors">
                      {suggestion.title}
                    </h4>
                    <Badge className={cn("text-xs", impactConfig[suggestion.impact].className)}>
                      {impactConfig[suggestion.impact].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      ~{suggestion.estimatedHours} שעות • {suggestion.category}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      בקש הצעת מחיר
                      <ArrowRight className="w-4 h-4 mr-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
