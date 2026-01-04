import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  RefreshCw, 
  Shield, 
  Database, 
  Code,
  Clock,
  Eye,
  EyeOff,
  Play,
  Lock,
  Sparkles,
  ExternalLink,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { useSecurityIssues } from "@/hooks/useSecurityIssues";
import { AICodeAgent } from "@/components/code-health/AICodeAgent";
import { AIUsageDashboard } from "@/components/ai/AIUsageDashboard";

interface CodeHealthIssue {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string | null;
  details: Record<string, unknown>;
  detected_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  ignored_at: string | null;
  ignored_by: string | null;
  ignore_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface CodeHealthReport {
  id: string;
  report_date: string;
  total_issues: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
}

const severityConfig = {
  critical: { 
    icon: XCircle, 
    color: "text-red-500", 
    bg: "bg-red-100 dark:bg-red-900/30",
    badge: "destructive" as const
  },
  warning: { 
    icon: AlertTriangle, 
    color: "text-yellow-500", 
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    badge: "default" as const
  },
  info: { 
    icon: Info, 
    color: "text-blue-500", 
    bg: "bg-blue-100 dark:bg-blue-900/30",
    badge: "secondary" as const
  },
};

const categoryConfig: Record<string, { icon: typeof Shield; label: string }> = {
  security: { icon: Shield, label: "אבטחה" },
  database: { icon: Database, label: "מסד נתונים" },
  code: { icon: Code, label: "קוד" },
  performance: { icon: Clock, label: "ביצועים" },
};

export default function CodeHealth() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIssue, setSelectedIssue] = useState<CodeHealthIssue | null>(null);
  const [ignoreReason, setIgnoreReason] = useState("");
  const [isIgnoreDialogOpen, setIsIgnoreDialogOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Fetch security issues from Lovable scan
  const { 
    findings: securityFindings, 
    isLoading: securityLoading, 
    errorCount: securityErrorCount,
    warningCount: securityWarningCount,
    refetch: refetchSecurity 
  } = useSecurityIssues();

  // Fetch open issues
  const { data: issues, isLoading: issuesLoading } = useQuery({
    queryKey: ["code-health-issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("code_health_issues")
        .select("*")
        .order("severity", { ascending: true })
        .order("detected_at", { ascending: false });
      
      if (error) throw error;
      return data as CodeHealthIssue[];
    },
  });

  // Fetch reports history
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["code-health-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("code_health_reports")
        .select("*")
        .order("report_date", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as CodeHealthReport[];
    },
  });

  // Resolve issue mutation
  const resolveMutation = useMutation({
    mutationFn: async (issueId: string) => {
      const { error } = await supabase
        .from("code_health_issues")
        .update({ 
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id 
        })
        .eq("id", issueId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["code-health-issues"] });
      toast.success("הבעיה סומנה כפתורה");
    },
    onError: () => {
      toast.error("שגיאה בעדכון הבעיה");
    },
  });

  // Ignore issue mutation
  const ignoreMutation = useMutation({
    mutationFn: async ({ issueId, reason }: { issueId: string; reason: string }) => {
      const { error } = await supabase
        .from("code_health_issues")
        .update({ 
          ignored_at: new Date().toISOString(),
          ignored_by: user?.id,
          ignore_reason: reason
        })
        .eq("id", issueId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["code-health-issues"] });
      setIsIgnoreDialogOpen(false);
      setIgnoreReason("");
      setSelectedIssue(null);
      toast.success("הבעיה סומנה כמתעלמת");
    },
    onError: () => {
      toast.error("שגיאה בעדכון הבעיה");
    },
  });

  // Reopen issue mutation
  const reopenMutation = useMutation({
    mutationFn: async (issueId: string) => {
      const { error } = await supabase
        .from("code_health_issues")
        .update({ 
          resolved_at: null,
          resolved_by: null,
          ignored_at: null,
          ignored_by: null,
          ignore_reason: null
        })
        .eq("id", issueId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["code-health-issues"] });
      toast.success("הבעיה נפתחה מחדש");
    },
    onError: () => {
      toast.error("שגיאה בעדכון הבעיה");
    },
  });

  // Run health check manually
  const runHealthCheck = async () => {
    setIsRunning(true);
    try {
      const { error } = await supabase.functions.invoke("code-health-audit", {
        body: { manual: true },
      });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["code-health-issues"] });
      queryClient.invalidateQueries({ queryKey: ["code-health-reports"] });
      toast.success("בדיקת בריאות הקוד הושלמה");
    } catch (error) {
      toast.error("שגיאה בהרצת בדיקת הבריאות");
    } finally {
      setIsRunning(false);
    }
  };

  // Filter issues
  const openIssues = issues?.filter(i => !i.resolved_at && !i.ignored_at) || [];
  const resolvedIssues = issues?.filter(i => i.resolved_at) || [];
  const ignoredIssues = issues?.filter(i => i.ignored_at && !i.resolved_at) || [];

  const criticalCount = openIssues.filter(i => i.severity === "critical").length;
  const warningCount = openIssues.filter(i => i.severity === "warning").length;
  const infoCount = openIssues.filter(i => i.severity === "info").length;

  const handleIgnore = (issue: CodeHealthIssue) => {
    setSelectedIssue(issue);
    setIsIgnoreDialogOpen(true);
  };

  const renderIssueCard = (issue: CodeHealthIssue, showActions = true) => {
    const severity = severityConfig[issue.severity as keyof typeof severityConfig] || severityConfig.info;
    const category = categoryConfig[issue.category] || { icon: Code, label: issue.category };
    const SeverityIcon = severity.icon;
    const CategoryIcon = category.icon;

    return (
      <Card key={issue.id} className={`${severity.bg} border-l-4 ${issue.severity === 'critical' ? 'border-l-red-500' : issue.severity === 'warning' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <SeverityIcon className={`h-5 w-5 mt-0.5 ${severity.color}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{issue.title}</h4>
                  <Badge variant={severity.badge} className="text-xs">
                    {issue.severity === 'critical' ? 'קריטי' : issue.severity === 'warning' ? 'אזהרה' : 'מידע'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {category.label}
                  </Badge>
                </div>
                {issue.description && (
                  <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  זוהה {formatDistanceToNow(new Date(issue.detected_at), { addSuffix: true, locale: he })}
                </p>
                {issue.ignore_reason && (
                  <p className="text-xs text-muted-foreground mt-1">
                    סיבת התעלמות: {issue.ignore_reason}
                  </p>
                )}
              </div>
            </div>
            {showActions && (
              <div className="flex gap-2 flex-wrap">
                {!issue.resolved_at && !issue.ignored_at ? (
                  <>
                    <AICodeAgent 
                      issue={{
                        id: issue.id,
                        category: issue.category,
                        severity: issue.severity,
                        title: issue.title,
                        description: issue.description,
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveMutation.mutate(issue.id)}
                      disabled={resolveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      פתור
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleIgnore(issue)}
                    >
                      <EyeOff className="h-4 w-4 mr-1" />
                      התעלם
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reopenMutation.mutate(issue.id)}
                    disabled={reopenMutation.isPending}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    פתח מחדש
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MainLayout>
      <PageHeader title="בריאות הקוד" description="ניטור ובקרה על בעיות קוד ואבטחה" />
      
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{criticalCount}</p>
                  <p className="text-sm text-muted-foreground">בעיות קריטיות</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{warningCount}</p>
                  <p className="text-sm text-muted-foreground">אזהרות</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Info className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{infoCount}</p>
                  <p className="text-sm text-muted-foreground">הודעות מידע</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Issues Card */}
          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Lock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{securityErrorCount + securityWarningCount}</p>
                  <p className="text-sm text-muted-foreground">בעיות אבטחה</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{resolvedIssues.length}</p>
                  <p className="text-sm text-muted-foreground">נפתרו</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 flex-wrap">
          <AICodeAgent onActionComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["code-health-issues"] });
          }} />
          <Button variant="outline" onClick={() => refetchSecurity()} disabled={securityLoading}>
            <Shield className="h-4 w-4 mr-2" />
            סרוק אבטחה
          </Button>
          <Button onClick={runHealthCheck} disabled={isRunning}>
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            הרץ בדיקה עכשיו
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="open" dir="rtl">
          <TabsList className="flex-wrap">
            <TabsTrigger value="open">
              פתוחות ({openIssues.length})
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              אבטחה ({securityFindings.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              נפתרו ({resolvedIssues.length})
            </TabsTrigger>
            <TabsTrigger value="ignored">
              מתעלמים ({ignoredIssues.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              היסטוריית דוחות
            </TabsTrigger>
            <TabsTrigger value="ai-usage" className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              שימוש AI
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="open" className="space-y-3 mt-4">
            {issuesLoading ? (
              <div className="text-center py-8 text-muted-foreground">טוען...</div>
            ) : openIssues.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">אין בעיות פתוחות!</h3>
                  <p className="text-muted-foreground">המערכת פועלת תקין</p>
                </CardContent>
              </Card>
            ) : (
              openIssues.map(issue => renderIssueCard(issue))
            )}
          </TabsContent>

          {/* Security Issues Tab */}
          <TabsContent value="security" className="space-y-3 mt-4">
            {securityLoading ? (
              <div className="text-center py-8 text-muted-foreground">טוען בעיות אבטחה...</div>
            ) : securityFindings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">אין בעיות אבטחה!</h3>
                  <p className="text-muted-foreground">המערכת מאובטחת</p>
                </CardContent>
              </Card>
            ) : (
              securityFindings.map(finding => (
                <Card 
                  key={finding.internal_id} 
                  className={`border-l-4 ${
                    finding.level === 'error' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/10' : 
                    finding.level === 'warn' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' : 
                    'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        finding.level === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                        finding.level === 'warn' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        <Lock className={`h-5 w-5 ${
                          finding.level === 'error' ? 'text-red-500' :
                          finding.level === 'warn' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium">{finding.name}</h4>
                          <Badge variant={finding.level === 'error' ? 'destructive' : finding.level === 'warn' ? 'default' : 'secondary'}>
                            {finding.level === 'error' ? 'קריטי' : finding.level === 'warn' ? 'אזהרה' : 'מידע'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {finding.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {finding.remediation_difficulty === 'high' ? 'קשה לתיקון' : 
                             finding.remediation_difficulty === 'medium' ? 'בינוני' : 'קל לתיקון'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                        {finding.details && (
                          <details className="text-xs text-muted-foreground mt-2">
                            <summary className="cursor-pointer hover:text-foreground">פרטים נוספים</summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto whitespace-pre-wrap">
                              {finding.details}
                            </pre>
                          </details>
                        )}
                        {finding.link && (
                          <a 
                            href={finding.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            קרא עוד על תיקון הבעיה
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="resolved" className="space-y-3 mt-4">
            {resolvedIssues.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  אין בעיות שנפתרו
                </CardContent>
              </Card>
            ) : (
              resolvedIssues.map(issue => renderIssueCard(issue))
            )}
          </TabsContent>
          
          <TabsContent value="ignored" className="space-y-3 mt-4">
            {ignoredIssues.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  אין בעיות מתעלמות
                </CardContent>
              </Card>
            ) : (
              ignoredIssues.map(issue => renderIssueCard(issue))
            )}
          </TabsContent>
          
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>היסטוריית דוחות</CardTitle>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="text-center py-4 text-muted-foreground">טוען...</div>
                ) : reports?.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">אין דוחות עדיין</div>
                ) : (
                  <div className="space-y-3">
                    {reports?.map(report => (
                      <div key={report.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{new Date(report.report_date).toLocaleDateString('he-IL')}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.total_issues} בעיות • {report.critical_count} קריטיות • {report.warning_count} אזהרות
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {report.email_sent && (
                            <Badge variant="outline" className="text-green-600">
                              מייל נשלח
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Usage Tab */}
          <TabsContent value="ai-usage" className="mt-4">
            <AIUsageDashboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Ignore Dialog */}
      <Dialog open={isIgnoreDialogOpen} onOpenChange={setIsIgnoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>התעלם מבעיה</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך להתעלם מבעיה זו? ניתן לפתוח אותה מחדש בכל עת.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">סיבת ההתעלמות (אופציונלי)</label>
            <Textarea
              value={ignoreReason}
              onChange={(e) => setIgnoreReason(e.target.value)}
              placeholder="הסבר למה מתעלמים מהבעיה..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIgnoreDialogOpen(false)}>
              ביטול
            </Button>
            <Button 
              onClick={() => selectedIssue && ignoreMutation.mutate({ 
                issueId: selectedIssue.id, 
                reason: ignoreReason 
              })}
              disabled={ignoreMutation.isPending}
            >
              התעלם
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
