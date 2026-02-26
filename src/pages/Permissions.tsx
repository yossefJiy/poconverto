import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DomainErrorBoundary } from "@/components/shared/DomainErrorBoundary";
import { useAuth, usePermissions, ROLE_LABELS, AppRole } from "@/hooks/useAuth";
import { 
  Shield, 
  Check, 
  X, 
  Settings, 
  Users, 
  BarChart3,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Navigate } from "react-router-dom";

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
      { id: "view_clients", name: "צפייה בלקוחות", description: "רשימת לקוחות" },
      { id: "create_clients", name: "יצירת לקוחות", description: "הוספת לקוחות חדשים" },
      { id: "edit_clients", name: "עריכת לקוחות", description: "שינוי פרטי לקוחות" },
      { id: "delete_clients", name: "מחיקת לקוחות", description: "הסרת לקוחות מהמערכת" },
    ],
  },
  {
    category: "הגדרות מערכת",
    icon: Settings,
    permissions: [
      { id: "view_settings", name: "צפייה בהגדרות", description: "הגדרות אישיות" },
      { id: "manage_users", name: "ניהול משתמשים", description: "הוספה והסרת משתמשים" },
      { id: "manage_integrations", name: "ניהול חיבורים", description: "חיבור שירותים חיצוניים" },
    ],
  },
];

const DEFAULT_PERMISSIONS: Record<AppRole, string[]> = {
  super_admin: SYSTEM_FUNCTIONALITIES.flatMap(c => c.permissions.map(p => p.id)),
  admin: SYSTEM_FUNCTIONALITIES.flatMap(c => c.permissions.map(p => p.id)),
  agency_manager: ["view_dashboard", "view_analytics", "export_reports", "view_clients", "create_clients", "edit_clients", "view_settings", "manage_integrations"],
  team_manager: ["view_dashboard", "view_analytics", "view_clients", "edit_clients", "view_settings"],
  employee: ["view_dashboard", "view_analytics", "view_clients", "view_settings"],
  premium_client: ["view_dashboard", "view_analytics", "export_reports", "view_settings"],
  basic_client: ["view_dashboard", "view_settings"],
  demo: ["view_dashboard", "view_settings"],
};

const ROLE_ORDER: AppRole[] = ["super_admin", "admin", "agency_manager", "team_manager", "employee", "premium_client", "basic_client", "demo"];

export default function Permissions() {
  const { isSuperAdmin, isAdmin } = usePermissions();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
      <DomainErrorBoundary domain="permissions">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-7 h-7 text-primary" />
              ניהול הרשאות
            </h1>
            <p className="text-muted-foreground mt-1">מטריקס הרשאות לפי תפקידים</p>
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
              <Button size="sm" variant={selectedCategory === null ? "default" : "outline"} onClick={() => setSelectedCategory(null)}>הכל</Button>
              {SYSTEM_FUNCTIONALITIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button key={cat.category} size="sm" variant={selectedCategory === cat.category ? "default" : "outline"} onClick={() => setSelectedCategory(cat.category)} className="gap-1.5">
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
            <CardTitle>מטריקס הרשאות תפקידים</CardTitle>
            <CardDescription>✓ = יש הרשאה, ✗ = אין הרשאה</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full" dir="rtl">
              <div className="min-w-[1000px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] text-right sticky right-0 bg-background z-10">הרשאה</TableHead>
                      {ROLE_ORDER.map((role) => (
                        <TableHead key={role} className="text-center min-w-[100px]">
                          <span className="text-xs font-medium">{ROLE_LABELS[role]}</span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCategories.map((category) => (
                      <>
                        <TableRow key={`cat-${category.category}`} className="bg-muted/50">
                          <TableCell colSpan={ROLE_ORDER.length + 1} className="font-bold">
                            <div className="flex items-center gap-2">
                              <category.icon className="w-4 h-4" />
                              {category.category}
                            </div>
                          </TableCell>
                        </TableRow>
                        {category.permissions.map((permission) => (
                          <TableRow key={permission.id}>
                            <TableCell className="text-right sticky right-0 bg-background">
                              <p className="font-medium text-sm">{permission.name}</p>
                              <p className="text-xs text-muted-foreground">{permission.description}</p>
                            </TableCell>
                            {ROLE_ORDER.map((role) => (
                              <TableCell key={`${permission.id}-${role}`} className="text-center">
                                {hasPermission(role, permission.id) ? (
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
                            ))}
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

        {/* Info */}
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">שים לב</p>
                <p className="text-sm text-muted-foreground mt-1">
                  הרשאות אלו הן ברירת מחדל ונאכפות ברמת הדאטהבייס (RLS).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </DomainErrorBoundary>
    </MainLayout>
  );
}
