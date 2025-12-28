import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Search, Filter, AlertTriangle, CheckCircle, Info, Clock } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

interface SecurityLog {
  id: string;
  event_type: string;
  event_category: string;
  user_id: string | null;
  resource_type: string | null;
  resource_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const eventCategoryLabels: Record<string, string> = {
  integrations: "אינטגרציות",
  authorization: "הרשאות",
  authentication: "אימות",
  general: "כללי",
};

const eventTypeLabels: Record<string, string> = {
  integration_created: "אינטגרציה נוצרה",
  integration_deleted: "אינטגרציה נמחקה",
  credentials_updated: "פרטי התחברות עודכנו",
  connection_status_changed: "סטטוס חיבור השתנה",
  role_assigned: "תפקיד הוקצה",
  role_changed: "תפקיד שונה",
  role_revoked: "תפקיד בוטל",
};

const actionLabels: Record<string, string> = {
  create: "יצירה",
  update: "עדכון",
  delete: "מחיקה",
  update_credentials: "עדכון פרטי התחברות",
  connected: "התחבר",
  disconnected: "התנתק",
  assign: "הקצאה",
  revoke: "ביטול",
};

export default function SecurityLogs() {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  // Only admins can access this page
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const { data: logs, isLoading } = useQuery({
    queryKey: ["security-logs", categoryFilter, eventTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("security_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (categoryFilter !== "all") {
        query = query.eq("event_category", categoryFilter);
      }

      if (eventTypeFilter !== "all") {
        query = query.eq("event_type", eventTypeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SecurityLog[];
    },
  });

  const filteredLogs = logs?.filter((log) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.event_type.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.user_id?.toLowerCase().includes(searchLower) ||
      log.resource_id?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLower)
    );
  });

  const getEventIcon = (eventType: string) => {
    if (eventType.includes("deleted") || eventType.includes("revoked")) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    if (eventType.includes("created") || eventType.includes("assigned")) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    }
    return <Info className="h-4 w-4 text-info" />;
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case "authorization":
        return "destructive";
      case "integrations":
        return "secondary";
      case "authentication":
        return "default";
      default:
        return "outline";
    }
  };

  const uniqueCategories = [...new Set(logs?.map((l) => l.event_category) || [])];
  const uniqueEventTypes = [...new Set(logs?.map((l) => l.event_type) || [])];

  return (
    <MainLayout>
      <PageHeader
        title="לוגים של אבטחה"
        description="צפייה בכל הפעילויות הרגישות במערכת"
      />

      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              סינון לוגים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="חיפוש חופשי..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הקטגוריות</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {eventCategoryLabels[cat] || cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="סוג אירוע" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסוגים</SelectItem>
                  {uniqueEventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {eventTypeLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                היסטוריית אירועים
              </span>
              <Badge variant="outline">{filteredLogs?.length || 0} רשומות</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredLogs && filteredLogs.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-[50px]"></TableHead>
                      <TableHead className="text-right">זמן</TableHead>
                      <TableHead className="text-right">קטגוריה</TableHead>
                      <TableHead className="text-right">סוג אירוע</TableHead>
                      <TableHead className="text-right">פעולה</TableHead>
                      <TableHead className="text-right">משתמש</TableHead>
                      <TableHead className="text-right">פרטים נוספים</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{getEventIcon(log.event_type)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: he })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getCategoryBadgeVariant(log.event_category)}>
                            {eventCategoryLabels[log.event_category] || log.event_category}
                          </Badge>
                        </TableCell>
                        <TableCell>{eventTypeLabels[log.event_type] || log.event_type}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {actionLabels[log.action] || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[120px] truncate">
                          {log.user_id ? log.user_id.substring(0, 8) + "..." : "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {log.details && Object.keys(log.details).length > 0 ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                              {JSON.stringify(log.details)}
                            </code>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>לא נמצאו לוגים של אבטחה</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
