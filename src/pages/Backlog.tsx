import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth, usePermissions } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Star,
  Clock,
  Zap,
  ArrowUpDown,
  Shield,
  Target,
  TrendingUp,
  CheckCircle2,
  ListTodo,
  Users,
  BarChart3,
  Rocket,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";

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
  high: { label: "גבוהה", color: "bg-destructive/20 text-destructive border-destructive/30" },
  medium: { label: "בינונית", color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30" },
  low: { label: "נמוכה", color: "bg-muted text-muted-foreground border-muted-foreground/30" },
};

const effortConfig: Record<string, { label: string; icon: typeof Clock }> = {
  small: { label: "קטן", icon: Zap },
  medium: { label: "בינוני", icon: Clock },
  large: { label: "גדול", icon: ArrowUpDown },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  backlog: { label: "ממתין", color: "bg-secondary text-secondary-foreground" },
  planned: { label: "מתוכנן", color: "bg-primary/20 text-primary" },
  in_progress: { label: "בעבודה", color: "bg-blue-500/20 text-blue-700" },
  done: { label: "הושלם", color: "bg-green-500/20 text-green-700" },
};

// Comparison data with market competitors
const radarData = [
  { feature: "ניהול משימות", ourSystem: 75, hubspot: 85, salesforce: 90, monday: 95 },
  { feature: "אוטומציה", ourSystem: 40, hubspot: 80, salesforce: 85, monday: 75 },
  { feature: "דוחות", ourSystem: 60, hubspot: 90, salesforce: 95, monday: 80 },
  { feature: "אינטגרציות", ourSystem: 35, hubspot: 95, salesforce: 90, monday: 85 },
  { feature: "UX/UI", ourSystem: 70, hubspot: 85, salesforce: 70, monday: 90 },
  { feature: "CRM", ourSystem: 55, hubspot: 95, salesforce: 100, monday: 75 },
];

function ImprovementCard({ 
  item, 
  onSprintChange 
}: { 
  item: ProjectImprovement;
  onSprintChange: (id: string, sprint: number | null) => void;
}) {
  const steps = (Array.isArray(item.steps) ? item.steps : []) as Step[];
  const completedSteps = steps.filter((s) => s.done).length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;

  return (
    <AccordionItem value={item.id} className="border rounded-lg mb-3 overflow-hidden bg-card">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
        <div className="flex items-center gap-4 w-full text-right">
          <div className="flex items-center gap-1 min-w-[50px]">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-lg">{item.importance}</span>
          </div>
          
          <div className="flex-1">
            <div className="font-medium text-base">{item.title}</div>
            {item.description && (
              <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {item.description}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge variant="outline" className="text-xs">
              {categoryLabels[item.category] || item.category}
            </Badge>
            <Badge className={`text-xs ${priorityConfig[item.priority]?.color || "bg-secondary"}`}>
              {priorityConfig[item.priority]?.label || item.priority}
            </Badge>
            {item.sprint_number && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                <Calendar className="h-3 w-3 ml-1" />
                Sprint {item.sprint_number}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={`text-xs ${statusConfig[item.status]?.color || "bg-secondary"}`}
            >
              {statusConfig[item.status]?.label || item.status}
            </Badge>
          </div>

          {steps.length > 0 && (
            <div className="min-w-[80px]">
              <div className="text-xs text-muted-foreground mb-1 text-center">
                {completedSteps}/{steps.length}
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Execution Steps */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              שלבי ביצוע
            </h4>
            <div className="space-y-2">
              {steps.length > 0 ? (
                steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Checkbox
                      id={`step-${item.id}-${index}`}
                      checked={step.done}
                      disabled
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`step-${item.id}-${index}`}
                      className={`text-sm flex-1 ${step.done ? "line-through text-muted-foreground" : ""}`}
                    >
                      {index + 1}. {step.step}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">אין שלבי ביצוע מוגדרים</p>
              )}
            </div>
          </div>

          {/* Sprint Assignment */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              הקצאה לספרינט
            </h4>
            <Select
              value={item.sprint_number?.toString() || "none"}
              onValueChange={(value) => 
                onSprintChange(item.id, value === "none" ? null : parseInt(value))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="בחר ספרינט" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">לא מוקצה</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sprint) => (
                  <SelectItem key={sprint} value={sprint.toString()}>
                    Sprint {sprint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">מאמץ משוער:</span>
                <span className="font-medium">
                  {effortConfig[item.estimated_effort || ""]?.label || "לא מוגדר"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">נוצר:</span>
                <span className="font-medium">
                  {new Date(item.created_at).toLocaleDateString("he-IL")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function Backlog() {
  const { loading } = useAuth();
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();
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

  const updateSprintMutation = useMutation({
    mutationFn: async ({ id, sprint }: { id: string; sprint: number | null }) => {
      const { error } = await supabase
        .from("project_improvements")
        .update({ sprint_number: sprint })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-improvements"] });
      toast.success("הספרינט עודכן בהצלחה");
    },
    onError: () => {
      toast.error("שגיאה בעדכון הספרינט");
    },
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

  // Calculate stats
  const totalItems = improvements?.length || 0;
  const completedItems = improvements?.filter((i) => i.status === "done").length || 0;
  const inProgressItems = improvements?.filter((i) => i.status === "in_progress").length || 0;
  const plannedItems = improvements?.filter((i) => i.status === "planned").length || 0;
  const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Calculate system score (compared to competitors)
  const avgOurSystem = radarData.reduce((acc, d) => acc + d.ourSystem, 0) / radarData.length;
  const avgMarket = radarData.reduce((acc, d) => acc + (d.hubspot + d.salesforce + d.monday) / 3, 0) / radarData.length;
  const systemScore = Math.round(avgOurSystem);
  const marketGap = Math.round(avgMarket - avgOurSystem);

  // Progress by category
  const categoryProgress = categories.map((cat) => {
    const catItems = improvements?.filter((i) => i.category === cat) || [];
    const catDone = catItems.filter((i) => i.status === "done").length;
    return {
      category: categoryLabels[cat] || cat,
      total: catItems.length,
      done: catDone,
      progress: catItems.length > 0 ? Math.round((catDone / catItems.length) * 100) : 0,
    };
  }).sort((a, b) => b.total - a.total).slice(0, 6);

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
            <span className="font-medium">{filteredImprovements?.length || 0}</span>
            <span>פריטים</span>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ציון המערכת</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{systemScore}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                פער מהשוק: -{marketGap}%
              </p>
              <Progress value={systemScore} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">התקדמות כללית</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{overallProgress}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedItems} מתוך {totalItems} הושלמו
              </p>
              <Progress value={overallProgress} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">בעבודה</CardTitle>
              <Zap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{inProgressItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {plannedItems} מתוכננים
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">הושלמו</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completedItems}</div>
              <p className="text-xs text-muted-foreground mt-1">
                פריטים שהסתיימו
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                השוואה למתחרים בשוק
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="feature" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="המערכת שלנו"
                    dataKey="ourSystem"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.5}
                  />
                  <Radar
                    name="HubSpot"
                    dataKey="hubspot"
                    stroke="#FF7A59"
                    fill="#FF7A59"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="Salesforce"
                    dataKey="salesforce"
                    stroke="#00A1E0"
                    fill="#00A1E0"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name="monday.com"
                    dataKey="monday"
                    stroke="#6C63FF"
                    fill="#6C63FF"
                    fillOpacity={0.2}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                התקדמות לפי קטגוריה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="category" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, "התקדמות"]}
                    labelFormatter={(label) => `קטגוריה: ${label}`}
                  />
                  <Bar 
                    dataKey="progress" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                    name="התקדמות"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center bg-card rounded-lg p-4 border">
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

        {/* Improvements List */}
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredImprovements?.map((item) => (
                <ImprovementCard
                  key={item.id}
                  item={item}
                  onSprintChange={(id, sprint) =>
                    updateSprintMutation.mutate({ id, sprint })
                  }
                />
              ))}
            </Accordion>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
