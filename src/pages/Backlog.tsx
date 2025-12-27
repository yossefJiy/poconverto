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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  FileText,
  ListTodo,
  Target,
  TrendingUp,
  CheckCircle2,
  Zap,
  BarChart3,
  Users,
  Rocket,
  Calendar,
  Star,
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
import { prdSections, calculatePRDStats } from "@/data/prdFeatures";
import { PRDOverview } from "@/components/backlog/PRDOverview";
import { PRDSectionCard } from "@/components/backlog/PRDSection";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

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
  medium: { label: "בינונית", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  low: { label: "נמוכה", color: "bg-muted text-muted-foreground border-muted-foreground/30" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  backlog: { label: "ממתין", color: "bg-secondary text-secondary-foreground" },
  planned: { label: "מתוכנן", color: "bg-primary/20 text-primary" },
  in_progress: { label: "בעבודה", color: "bg-blue-500/20 text-blue-400" },
  done: { label: "הושלם", color: "bg-green-500/20 text-green-400" },
};

const effortConfig: Record<string, { label: string }> = {
  small: { label: "קטן" },
  medium: { label: "בינוני" },
  large: { label: "גדול" },
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
    <AccordionItem value={item.id} className="border rounded-lg mb-2 overflow-hidden bg-card/50 border-border/50">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-4 w-full text-right">
          <div className="flex items-center gap-1 min-w-[40px]">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-sm">{item.importance}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{item.title}</div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {categoryLabels[item.category] || item.category}
            </Badge>
            <Badge className={`text-[10px] px-1.5 py-0 ${priorityConfig[item.priority]?.color || "bg-secondary"}`}>
              {priorityConfig[item.priority]?.label || item.priority}
            </Badge>
            {item.sprint_number && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                S{item.sprint_number}
              </Badge>
            )}
            <Badge className={`text-[10px] px-1.5 py-0 ${statusConfig[item.status]?.color || "bg-secondary"}`}>
              {statusConfig[item.status]?.label || item.status}
            </Badge>
          </div>

          {steps.length > 0 && (
            <div className="min-w-[60px]">
              <Progress value={progress} className="h-1.5" />
            </div>
          )}
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="px-4 pb-4 border-t border-border/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
          {item.description && (
            <p className="text-sm text-muted-foreground col-span-full">{item.description}</p>
          )}
          
          <div className="bg-muted/20 rounded-lg p-3">
            <h4 className="font-medium mb-2 text-xs flex items-center gap-2">
              <ListTodo className="h-3.5 w-3.5" />
              שלבי ביצוע
            </h4>
            <div className="space-y-1.5">
              {steps.length > 0 ? (
                steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Checkbox checked={step.done} disabled className="h-3.5 w-3.5" />
                    <span className={`text-xs ${step.done ? "line-through text-muted-foreground" : ""}`}>
                      {step.step}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">אין שלבים</p>
              )}
            </div>
          </div>

          <div className="bg-muted/20 rounded-lg p-3">
            <h4 className="font-medium mb-2 text-xs flex items-center gap-2">
              <Rocket className="h-3.5 w-3.5" />
              הקצאה
            </h4>
            <Select
              value={item.sprint_number?.toString() || "none"}
              onValueChange={(value) => 
                onSprintChange(item.id, value === "none" ? null : parseInt(value))
              }
            >
              <SelectTrigger className="h-8 text-xs">
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
            <div className="mt-2 text-xs text-muted-foreground">
              מאמץ: {effortConfig[item.estimated_effort || ""]?.label || "לא מוגדר"}
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
  const [activeTab, setActiveTab] = useState("prd");
  const [prdSearch, setPrdSearch] = useState("");

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

  if (!loading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredImprovements = improvements
    ?.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
      return matchesSearch && matchesCategory && matchesPriority;
    })
    .sort((a, b) => b.importance - a.importance);

  const categories = [...new Set(improvements?.map((i) => i.category) || [])];

  // Stats
  const prdStats = calculatePRDStats(prdSections);
  const totalItems = improvements?.length || 0;
  const completedItems = improvements?.filter((i) => i.status === "done").length || 0;
  const inProgressItems = improvements?.filter((i) => i.status === "in_progress").length || 0;
  
  const avgOurSystem = radarData.reduce((acc, d) => acc + d.ourSystem, 0) / radarData.length;
  const systemScore = Math.round(avgOurSystem);

  // Category progress for chart
  const categoryProgress = categories.map((cat) => {
    const catItems = improvements?.filter((i) => i.category === cat) || [];
    const catDone = catItems.filter((i) => i.status === "done").length;
    return {
      category: categoryLabels[cat] || cat,
      total: catItems.length,
      progress: catItems.length > 0 ? Math.round((catDone / catItems.length) * 100) : 0,
    };
  }).sort((a, b) => b.total - a.total).slice(0, 6);

  // Filter PRD sections based on search
  const filteredPrdSections = prdSections.filter(section => {
    if (!prdSearch) return true;
    const searchLower = prdSearch.toLowerCase();
    return (
      section.name.toLowerCase().includes(searchLower) ||
      section.features.some(f => 
        f.name.toLowerCase().includes(searchLower) ||
        f.description.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <MainLayout>
      <div className="space-y-6 p-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                PRD & Backlog
              </h1>
              <p className="text-sm text-muted-foreground">
                מסמך דרישות מוצר ורשימת שיפורים
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">ציון מערכת</p>
                  <p className="text-2xl font-bold text-primary">{systemScore}%</p>
                </div>
                <Target className="h-8 w-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">PRD הושלמו</p>
                  <p className="text-2xl font-bold text-green-400">{prdStats.percentage}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">בעבודה</p>
                  <p className="text-2xl font-bold text-blue-400">{inProgressItems}</p>
                </div>
                <Zap className="h-8 w-8 text-blue-500/30" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">הושלמו</p>
                  <p className="text-2xl font-bold text-purple-400">{completedItems}/{totalItems}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="prd" className="gap-2">
              <FileText className="h-4 w-4" />
              PRD מוצר
            </TabsTrigger>
            <TabsTrigger value="backlog" className="gap-2">
              <ListTodo className="h-4 w-4" />
              Backlog שיפורים
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              ניתוח
            </TabsTrigger>
          </TabsList>

          {/* PRD Tab */}
          <TabsContent value="prd" className="space-y-4">
            <PRDOverview />
            
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="חיפוש בפיצ'רים..."
                value={prdSearch}
                onChange={(e) => setPrdSearch(e.target.value)}
                className="pr-9 bg-card/50"
              />
            </div>

            <div className="grid gap-3">
              {filteredPrdSections.map((section, index) => (
                <PRDSectionCard 
                  key={section.id} 
                  section={section}
                  defaultOpen={index < 2}
                />
              ))}
            </div>
          </TabsContent>

          {/* Backlog Tab */}
          <TabsContent value="backlog" className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center bg-card/50 rounded-lg p-3 border border-border/50">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="חיפוש..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-9 h-9"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px] h-9">
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
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="עדיפות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל העדיפויות</SelectItem>
                  <SelectItem value="high">גבוהה</SelectItem>
                  <SelectItem value="medium">בינונית</SelectItem>
                  <SelectItem value="low">נמוכה</SelectItem>
                </SelectContent>
              </Select>

              <Badge variant="secondary" className="text-xs">
                {filteredImprovements?.length || 0} פריטים
              </Badge>
            </div>

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
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    השוואה למתחרים
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <PolarAngleAxis 
                        dataKey="feature" 
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} 
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="המערכת שלנו"
                        dataKey="ourSystem"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.4}
                      />
                      <Radar
                        name="HubSpot"
                        dataKey="hubspot"
                        stroke="#FF7A59"
                        fill="#FF7A59"
                        fillOpacity={0.15}
                      />
                      <Radar
                        name="monday.com"
                        dataKey="monday"
                        stroke="#6C63FF"
                        fill="#6C63FF"
                        fillOpacity={0.15}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    התקדמות לפי קטגוריה
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={categoryProgress} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <YAxis 
                        dataKey="category" 
                        type="category" 
                        width={80} 
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, "התקדמות"]}
                        contentStyle={{ 
                          background: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Bar 
                        dataKey="progress" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
