import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Star, Clock, Zap, ArrowUpDown, ChevronDown, ChevronLeft, Shield } from "lucide-react";

interface Step {
  step: string;
  done: boolean;
}

interface ProjectImprovement {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  importance: number;
  status: string;
  estimated_effort: string | null;
  sprint_number: number | null;
  steps: unknown;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  auth: "אימות ואבטחה",
  users: "ניהול משתמשים",
  dashboard: "דשבורד",
  analytics: "אנליטיקס",
  clients: "לקוחות",
  campaigns: "קמפיינים",
  tasks: "משימות",
  integrations: "אינטגרציות",
  ui: "ממשק משתמש",
  performance: "ביצועים",
  feature: "פיצ'ר כללי",
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  high: { label: "גבוהה", color: "bg-destructive text-destructive-foreground" },
  medium: { label: "בינונית", color: "bg-yellow-500/20 text-yellow-700" },
  low: { label: "נמוכה", color: "bg-muted text-muted-foreground" },
};

const effortConfig: Record<string, { label: string; icon: typeof Clock }> = {
  small: { label: "קטן", icon: Zap },
  medium: { label: "בינוני", icon: Clock },
  large: { label: "גדול", icon: ArrowUpDown },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  backlog: { label: "ממתין", color: "bg-secondary text-secondary-foreground" },
  planned: { label: "מתוכנן", color: "bg-primary/20 text-primary" },
  in_progress: { label: "בעבודה", color: "bg-accent text-accent-foreground" },
  done: { label: "הושלם", color: "bg-green-500/20 text-green-700" },
};

function ImprovementRow({ item }: { item: ProjectImprovement }) {
  const [isOpen, setIsOpen] = useState(false);
  const steps = (Array.isArray(item.steps) ? item.steps : []) as Step[];
  const completedSteps = steps.filter((s) => s.done).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <TableRow className="group">
        <TableCell>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">{item.importance}</span>
          </div>
        </TableCell>
        <TableCell>
          <CollapsibleTrigger className="flex items-center gap-2 text-right w-full hover:text-primary transition-colors">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronLeft className="h-4 w-4 shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-medium">{item.title}</div>
              {item.description && (
                <div className="text-sm text-muted-foreground line-clamp-1">
                  {item.description}
                </div>
              )}
            </div>
          </CollapsibleTrigger>
        </TableCell>
        <TableCell>
          <Badge variant="outline">
            {categoryLabels[item.category] || item.category}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge className={priorityConfig[item.priority]?.color || "bg-secondary"}>
            {priorityConfig[item.priority]?.label || item.priority}
          </Badge>
        </TableCell>
        <TableCell>
          {item.estimated_effort && (
            <span className="text-sm text-muted-foreground">
              {effortConfig[item.estimated_effort]?.label || item.estimated_effort}
            </span>
          )}
        </TableCell>
        <TableCell>
          {steps.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {completedSteps}/{steps.length}
            </span>
          )}
        </TableCell>
        <TableCell>
          <Badge
            variant="secondary"
            className={statusConfig[item.status]?.color || "bg-secondary"}
          >
            {statusConfig[item.status]?.label || item.status}
          </Badge>
        </TableCell>
      </TableRow>
      <CollapsibleContent asChild>
        <tr>
          <td colSpan={7} className="p-0">
            <div className="bg-muted/30 border-t border-b px-6 py-4">
              <h4 className="font-medium mb-3 text-sm">שלבי ביצוע:</h4>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Checkbox
                      id={`step-${item.id}-${index}`}
                      checked={step.done}
                      disabled
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`step-${item.id}-${index}`}
                      className={`text-sm ${step.done ? "line-through text-muted-foreground" : ""}`}
                    >
                      {index + 1}. {step.step}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Backlog() {
  const { loading } = useAuth();
  const { isAdmin } = usePermissions();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"importance" | "priority">("importance");

  const { data: improvements, isLoading } = useQuery({
    queryKey: ["project-improvements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_improvements")
        .select("*")
        .order("importance", { ascending: false });

      if (error) throw error;
      return data as ProjectImprovement[];
    },
    enabled: isAdmin,
  });

  // Redirect non-admins
  if (!loading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredImprovements = improvements
    ?.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter;
      const matchesPriority =
        priorityFilter === "all" || item.priority === priorityFilter;
      return matchesSearch && matchesCategory && matchesPriority;
    })
    .sort((a, b) => {
      if (sortBy === "importance") return b.importance - a.importance;
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (
        (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
        (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
      );
    });

  const categories = [...new Set(improvements?.map((i) => i.category) || [])];

  return (
    <MainLayout>
      <div className="space-y-6 p-6" dir="rtl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">
                Backlog שיפורים
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">
              רשימת כל השיפורים והפיצ'רים המתוכננים לפרויקט (גלוי לאדמינים בלבד)
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">
              {filteredImprovements?.length || 0}
            </span>
            <span>פריטים</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="חיפוש..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {categoryLabels[cat] || cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="עדיפות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל העדיפויות</SelectItem>
              <SelectItem value="high">גבוהה</SelectItem>
              <SelectItem value="medium">בינונית</SelectItem>
              <SelectItem value="low">נמוכה</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as "importance" | "priority")}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="מיון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="importance">לפי חשיבות</SelectItem>
              <SelectItem value="priority">לפי עדיפות</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right w-20">חשיבות</TableHead>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right w-32">קטגוריה</TableHead>
                  <TableHead className="text-right w-24">עדיפות</TableHead>
                  <TableHead className="text-right w-24">מאמץ</TableHead>
                  <TableHead className="text-right w-20">שלבים</TableHead>
                  <TableHead className="text-right w-24">סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredImprovements?.map((item) => (
                  <ImprovementRow key={item.id} item={item} />
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
