import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth, usePermissions, ROLE_LABELS, AppRole } from "@/hooks/useAuth";
import { 
  Shield, 
  Check, 
  X, 
  Loader2, 
  Settings, 
  Users, 
  FileText, 
  BarChart3,
  Megaphone,
  ListTodo,
  Bot,
  ShoppingCart,
  Target,
  TrendingUp,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

// Define all system functionalities
const SYSTEM_FUNCTIONALITIES = [
  {
    category: "דשבורד",
    icon: BarChart3,
    permissions: [
      { id: "view_dashboard", name: "צפייה בדשבורד", description: "גישה לדשבורד הראשי" },
      { id: "view_analytics", name: "צפייה באנליטיקס", description: "גישה לנתונים אנליטיים" },
      { id: "export_reports", name: "ייצוא דוחות", description: "הורדת דוחות מהמערכת" },
    ],
  },
  {
    category: "לקוחות",
    icon: Users,
    permissions: [
      { id: "view_clients", name: "צפייה בלקוחות", description: "רשימת לקוחות מוקצים" },
      { id: "view_all_clients", name: "צפייה בכל הלקוחות", description: "גישה לכל לקוחות הסוכנות" },
      { id: "create_clients", name: "יצירת לקוחות", description: "הוספת לקוחות חדשים" },
      { id: "edit_clients", name: "עריכת לקוחות", description: "שינוי פרטי לקוחות" },
      { id: "delete_clients", name: "מחיקת לקוחות", description: "הסרת לקוחות מהמערכת" },
    ],
  },
  {
    category: "משימות",
    icon: ListTodo,
    permissions: [
      { id: "view_tasks", name: "צפייה במשימות", description: "רשימת משימות" },
      { id: "create_tasks", name: "יצירת משימות", description: "הוספת משימות חדשות" },
      { id: "edit_tasks", name: "עריכת משימות", description: "שינוי פרטי משימות" },
      { id: "delete_tasks", name: "מחיקת משימות", description: "הסרת משימות" },
      { id: "assign_tasks", name: "הקצאת משימות", description: "שיוך משימות לעובדים" },
    ],
  },
  {
    category: "קמפיינים",
    icon: Megaphone,
    permissions: [
      { id: "view_campaigns", name: "צפייה בקמפיינים", description: "רשימת קמפיינים" },
      { id: "create_campaigns", name: "יצירת קמפיינים", description: "הוספת קמפיינים חדשים" },
      { id: "edit_campaigns", name: "עריכת קמפיינים", description: "שינוי קמפיינים" },
      { id: "delete_campaigns", name: "מחיקת קמפיינים", description: "הסרת קמפיינים" },
    ],
  },
  {
    category: "שיווק",
    icon: Target,
    permissions: [
      { id: "view_marketing", name: "צפייה בשיווק", description: "גישה לנתוני שיווק" },
      { id: "manage_marketing", name: "ניהול שיווק", description: "עריכת אסטרטגיות שיווק" },
    ],
  },
  {
    category: "איקומרס",
    icon: ShoppingCart,
    permissions: [
      { id: "view_ecommerce", name: "צפייה באיקומרס", description: "נתוני מכירות וחנות" },
      { id: "manage_ecommerce", name: "ניהול איקומרס", description: "עריכת הגדרות חנות" },
    ],
  },
  {
    category: "AI סוכנים",
    icon: Bot,
    permissions: [
      { id: "use_ai_agents", name: "שימוש בסוכני AI", description: "גישה לסוכני AI" },
      { id: "configure_ai", name: "הגדרות AI", description: "עריכת הגדרות סוכנים" },
      { id: "approve_ai_actions", name: "אישור פעולות AI", description: "אישור פעולות אוטומטיות" },
    ],
  },
  {
    category: "תובנות",
    icon: TrendingUp,
    permissions: [
      { id: "view_insights", name: "צפייה בתובנות", description: "גישה לתובנות" },
      { id: "generate_insights", name: "יצירת תובנות", description: "יצירת דוחות תובנות" },
    ],
  },
  {
    category: "הגדרות מערכת",
    icon: Settings,
    permissions: [
      { id: "view_settings", name: "צפייה בהגדרות", description: "הגדרות אישיות" },
      { id: "manage_users", name: "ניהול משתמשים", description: "הוספה והסרת משתמשים" },
      { id: "manage_roles", name: "ניהול תפקידים", description: "שינוי הרשאות תפקידים" },
      { id: "manage_integrations", name: "ניהול חיבורים", description: "חיבור שירותים חיצוניים" },
      { id: "view_logs", name: "צפייה בלוגים", description: "לוגי אבטחה ופעילות" },
    ],
  },
];

// Default permissions by role
const DEFAULT_PERMISSIONS: Record<AppRole, string[]> = {
  super_admin: SYSTEM_FUNCTIONALITIES.flatMap(c => c.permissions.map(p => p.id)),
  admin: SYSTEM_FUNCTIONALITIES.flatMap(c => c.permissions.map(p => p.id)).filter(p => p !== "manage_roles"),
  agency_manager: [
    "view_dashboard", "view_analytics", "export_reports",
    "view_clients", "view_all_clients", "create_clients", "edit_clients",
    "view_tasks", "create_tasks", "edit_tasks", "assign_tasks",
    "view_campaigns", "create_campaigns", "edit_campaigns",
    "view_marketing", "manage_marketing",
    "view_ecommerce",
    "use_ai_agents", "approve_ai_actions",
    "view_insights", "generate_insights",
    "view_settings", "manage_users", "manage_integrations",
  ],
  team_manager: [
    "view_dashboard", "view_analytics", "export_reports",
    "view_clients", "edit_clients",
    "view_tasks", "create_tasks", "edit_tasks", "delete_tasks", "assign_tasks",
    "view_campaigns", "create_campaigns", "edit_campaigns",
    "view_marketing",
    "view_ecommerce",
    "use_ai_agents",
    "view_insights", "generate_insights",
    "view_settings",
  ],
  employee: [
    "view_dashboard", "view_analytics",
    "view_clients",
    "view_tasks", "create_tasks", "edit_tasks",
    "view_campaigns",
    "view_marketing",
    "view_ecommerce",
    "use_ai_agents",
    "view_insights",
    "view_settings",
  ],
  premium_client: [
    "view_dashboard", "view_analytics", "export_reports",
    "view_tasks",
    "view_campaigns",
    "use_ai_agents",
    "view_insights",
    "view_settings",
  ],
  basic_client: [
    "view_dashboard",
    "view_tasks",
    "view_campaigns",
    "view_settings",
  ],
  demo: [
    "view_dashboard",
    "view_settings",
  ],
};

const ROLE_ORDER: AppRole[] = [
  "super_admin",
  "admin",
  "agency_manager",
  "team_manager",
  "employee",
  "premium_client",
  "basic_client",
  "demo",
];

export default function Permissions() {
  const { user } = useAuth();
  const { isSuperAdmin, isAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Redirect if not super_admin or admin
  if (!isSuperAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const allCategories = selectedCategory 
    ? SYSTEM_FUNCTIONALITIES.filter(c => c.category === selectedCategory)
    : SYSTEM_FUNCTIONALITIES;

  const hasPermission = (role: AppRole, permissionId: string) => {
    return DEFAULT_PERMISSIONS[role]?.includes(permissionId) || false;
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-7 h-7 text-primary" />
              ניהול הרשאות
            </h1>
            <p className="text-muted-foreground mt-1">
              מטריקס הרשאות לפי תפקידים במערכת
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Lock className="w-3 h-3" />
            {isSuperAdmin ? "סופר אדמין" : "אדמין"}
          </Badge>
        </div>

        {/* Category Filter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">סינון לפי קטגוריה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
              >
                הכל
              </Button>
              {SYSTEM_FUNCTIONALITIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.category}
                    size="sm"
                    variant={selectedCategory === cat.category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat.category)}
                    className="gap-1.5"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.category}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Permissions Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>מטריקס הרשאות</CardTitle>
            <CardDescription>
              הרשאות ברירת מחדל לכל תפקיד. ✓ = יש הרשאה, ✗ = אין הרשאה
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full" dir="rtl">
              <div className="min-w-[1000px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] text-right sticky right-0 bg-background z-10">
                        הרשאה
                      </TableHead>
                      {ROLE_ORDER.map((role) => (
                        <TableHead key={role} className="text-center min-w-[100px]">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-medium">{ROLE_LABELS[role]}</span>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCategories.map((category) => (
                      <>
                        {/* Category Header Row */}
                        <TableRow key={`cat-${category.category}`} className="bg-muted/50">
                          <TableCell colSpan={ROLE_ORDER.length + 1} className="font-bold">
                            <div className="flex items-center gap-2">
                              <category.icon className="w-4 h-4" />
                              {category.category}
                            </div>
                          </TableCell>
                        </TableRow>
                        {/* Permission Rows */}
                        {category.permissions.map((permission) => (
                          <TableRow key={permission.id}>
                            <TableCell className="text-right sticky right-0 bg-background">
                              <div>
                                <p className="font-medium text-sm">{permission.name}</p>
                                <p className="text-xs text-muted-foreground">{permission.description}</p>
                              </div>
                            </TableCell>
                            {ROLE_ORDER.map((role) => {
                              const has = hasPermission(role, permission.id);
                              return (
                                <TableCell key={`${permission.id}-${role}`} className="text-center">
                                  {has ? (
                                    <div className="flex justify-center">
                                      <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-green-500" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex justify-center">
                                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                        <X className="w-4 h-4 text-muted-foreground" />
                                      </div>
                                    </div>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">מקרא תפקידים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ROLE_ORDER.map((role) => (
                <div key={role} className="flex items-start gap-2 p-3 rounded-lg border bg-card">
                  <Badge variant="outline" className="shrink-0">
                    {ROLE_LABELS[role]}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {role === "super_admin" && "גישה מלאה לכל המערכת"}
                    {role === "admin" && "ניהול מלא מלבד הרשאות"}
                    {role === "agency_manager" && "ניהול כל הלקוחות והצוותים"}
                    {role === "team_manager" && "ניהול צוות ומשימות"}
                    {role === "employee" && "עבודה על לקוחות מוקצים"}
                    {role === "premium_client" && "גישה מלאה לדשבורד + AI"}
                    {role === "basic_client" && "צפייה בדשבורד בלבד"}
                    {role === "demo" && "גישה מוגבלת לצפייה"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">שים לב</p>
                <p className="text-sm text-muted-foreground mt-1">
                  הרשאות אלו הן ברירת מחדל ונאכפות ברמת הדאטהבייס (RLS). 
                  לשינוי הרשאות נדרש עדכון של מדיניות האבטחה בדאטהבייס.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
