import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Bot,
  DollarSign,
  Users,
  Activity,
  TrendingUp,
  Download,
  Search,
  Loader2,
  AlertTriangle,
  Settings,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { toast } from "sonner";

interface UsageRecord {
  id: string;
  action: string;
  model: string;
  issue_title: string | null;
  estimated_cost: number;
  input_tokens: number | null;
  output_tokens: number | null;
  created_by: string;
  created_at: string;
}

interface UserStats {
  userId: string;
  email: string;
  name: string;
  requestCount: number;
  totalCost: number;
  totalTokens: number;
}

interface UserLimit {
  id?: string;
  user_id: string;
  name: string;
  daily_requests_limit: number;
  daily_cost_limit: number;
  monthly_requests_limit: number;
  monthly_cost_limit: number;
  premium_models_enabled: boolean;
}

export function AIUsageDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageRecord[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalStats, setTotalStats] = useState({
    totalRequests: 0,
    totalCost: 0,
    totalTokens: 0,
    activeUsers: 0,
    monthlyBudget: 100,
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<UserLimit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkRole = async () => {
      if (!user?.id) return;
      const { data } = await supabase.rpc('get_user_role', { _user_id: user.id });
      console.log('User role check:', { userId: user.id, role: data });
      setIsAdmin(data === 'admin');
    };
    checkRole();
  }, [user?.id]);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    setIsLoading(true);
    
    try {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const { data: usage, error: usageError } = await supabase
        .from('ai_query_history')
        .select('*')
        .gte('created_at', monthStart)
        .order('created_at', { ascending: false })
        .limit(100);

      if (usageError) throw usageError;

      setUsageData(usage || []);

      const stats: Record<string, UserStats> = {};
      let totalCost = 0;
      let totalTokens = 0;

      for (const record of usage || []) {
        const userId = record.created_by;
        const cost = Number(record.estimated_cost || 0);
        const tokens = (record.input_tokens || 0) + (record.output_tokens || 0);

        totalCost += cost;
        totalTokens += tokens;

        if (!stats[userId]) {
          stats[userId] = {
            userId,
            email: '',
            name: userId.slice(0, 8),
            requestCount: 0,
            totalCost: 0,
            totalTokens: 0,
          };
        }
        stats[userId].requestCount++;
        stats[userId].totalCost += cost;
        stats[userId].totalTokens += tokens;
      }

      const userIds = Object.keys(stats);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);

        for (const profile of profiles || []) {
          if (stats[profile.id]) {
            stats[profile.id].email = profile.email || '';
            stats[profile.id].name = profile.full_name || profile.email || profile.id.slice(0, 8);
          }
        }
      }

      const { data: limits } = await supabase
        .from('ai_usage_limits')
        .select('monthly_cost_limit')
        .eq('limit_type', 'global')
        .single();

      setUserStats(Object.values(stats).sort((a, b) => b.totalCost - a.totalCost));
      setTotalStats({
        totalRequests: usage?.length || 0,
        totalCost,
        totalTokens,
        activeUsers: Object.keys(stats).length,
        monthlyBudget: limits?.monthly_cost_limit || 100,
      });

    } catch (error) {
      console.error('Error fetching usage data:', error);
      toast.error('שגיאה בטעינת נתוני שימוש');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = async (userId: string, userName: string) => {
    // Fetch existing limits for this user
    const { data: existingLimit } = await supabase
      .from('ai_usage_limits')
      .select('*')
      .eq('limit_type', 'user')
      .eq('target_id', userId)
      .single();

    if (existingLimit) {
      setEditingUser({
        id: existingLimit.id,
        user_id: userId,
        name: userName,
        daily_requests_limit: existingLimit.daily_requests_limit,
        daily_cost_limit: existingLimit.daily_cost_limit,
        monthly_requests_limit: existingLimit.monthly_requests_limit,
        monthly_cost_limit: existingLimit.monthly_cost_limit,
        premium_models_enabled: existingLimit.premium_models_enabled,
      });
    } else {
      // Use default values
      setEditingUser({
        user_id: userId,
        name: userName,
        daily_requests_limit: 50,
        daily_cost_limit: 5,
        monthly_requests_limit: 500,
        monthly_cost_limit: 50,
        premium_models_enabled: false,
      });
    }
  };

  const saveUserLimits = async () => {
    if (!editingUser) return;
    setIsSaving(true);

    try {
      if (editingUser.id) {
        // Update existing
        const { error } = await supabase
          .from('ai_usage_limits')
          .update({
            daily_requests_limit: editingUser.daily_requests_limit,
            daily_cost_limit: editingUser.daily_cost_limit,
            monthly_requests_limit: editingUser.monthly_requests_limit,
            monthly_cost_limit: editingUser.monthly_cost_limit,
            premium_models_enabled: editingUser.premium_models_enabled,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUser.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('ai_usage_limits')
          .insert({
            limit_type: 'user',
            target_id: editingUser.user_id,
            daily_requests_limit: editingUser.daily_requests_limit,
            daily_cost_limit: editingUser.daily_cost_limit,
            monthly_requests_limit: editingUser.monthly_requests_limit,
            monthly_cost_limit: editingUser.monthly_cost_limit,
            premium_models_enabled: editingUser.premium_models_enabled,
          });

        if (error) throw error;
      }

      toast.success('המכסות עודכנו בהצלחה');
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving limits:', error);
      toast.error('שגיאה בשמירת המכסות');
    } finally {
      setIsSaving(false);
    }
  };

  const exportToCsv = () => {
    const headers = ['תאריך', 'משתמש', 'פעולה', 'מודל', 'עלות', 'Tokens'];
    const rows = usageData.map(record => [
      format(new Date(record.created_at), 'dd/MM/yyyy HH:mm'),
      record.created_by.slice(0, 8),
      record.action,
      record.model,
      Number(record.estimated_cost || 0).toFixed(4),
      (record.input_tokens || 0) + (record.output_tokens || 0),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-usage-${format(new Date(), 'yyyy-MM')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('הקובץ הורד בהצלחה');
  };

  const budgetPercent = (totalStats.totalCost / totalStats.monthlyBudget) * 100;
  const filteredData = usageData.filter(record =>
    record.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.issue_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.totalRequests}</p>
                <p className="text-sm text-muted-foreground">בקשות החודש</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <DollarSign className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalStats.totalCost.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">עלות החודש</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStats.activeUsers}</p>
                <p className="text-sm text-muted-foreground">משתמשים פעילים</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Bot className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(totalStats.totalTokens / 1000).toFixed(1)}K</p>
                <p className="text-sm text-muted-foreground">Tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              מכסה חודשית
            </span>
            {budgetPercent >= 80 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {budgetPercent >= 100 ? 'חריגה!' : 'קרוב למכסה'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>${totalStats.totalCost.toFixed(2)} מתוך ${totalStats.monthlyBudget}</span>
              <span>{budgetPercent.toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(budgetPercent, 100)} 
              className={`h-3 ${budgetPercent >= 80 ? '[&>div]:bg-destructive' : ''}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            שימוש לפי משתמש
            {isAdmin && <Badge variant="outline" className="mr-2">מנהל</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>משתמש</TableHead>
                <TableHead className="text-center">בקשות</TableHead>
                <TableHead className="text-center">Tokens</TableHead>
                <TableHead className="text-left">עלות</TableHead>
                {isAdmin && <TableHead className="text-center">פעולות</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {userStats.slice(0, 10).map((stat) => (
                <TableRow key={stat.userId}>
                  <TableCell className="font-medium">{stat.name}</TableCell>
                  <TableCell className="text-center">{stat.requestCount}</TableCell>
                  <TableCell className="text-center">{stat.totalTokens.toLocaleString()}</TableCell>
                  <TableCell className="text-left">${stat.totalCost.toFixed(2)}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(stat.userId, stat.name)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Usage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              היסטוריית שימוש
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px] pr-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={exportToCsv}>
                <Download className="h-4 w-4 mr-1" />
                ייצוא CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תאריך</TableHead>
                  <TableHead>פעולה</TableHead>
                  <TableHead>מודל</TableHead>
                  <TableHead>נושא</TableHead>
                  <TableHead className="text-left">עלות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(record.created_at), 'dd/MM HH:mm', { locale: he })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{record.model.split('/')[1] || record.model}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {record.issue_title || '-'}
                    </TableCell>
                    <TableCell className="text-left text-amber-600">
                      ${Number(record.estimated_cost || 0).toFixed(4)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Limits Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>עריכת מכסות - {editingUser?.name}</DialogTitle>
          </DialogHeader>
          
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>בקשות יומיות</Label>
                  <Input
                    type="number"
                    value={editingUser.daily_requests_limit}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      daily_requests_limit: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>עלות יומית ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingUser.daily_cost_limit}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      daily_cost_limit: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>בקשות חודשיות</Label>
                  <Input
                    type="number"
                    value={editingUser.monthly_requests_limit}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      monthly_requests_limit: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>עלות חודשית ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingUser.monthly_cost_limit}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      monthly_cost_limit: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>גישה למודלים יקרים</Label>
                  <p className="text-xs text-muted-foreground">
                    Claude, Perplexity, GPT-4o
                  </p>
                </div>
                <Switch
                  checked={editingUser.premium_models_enabled}
                  onCheckedChange={(checked) => setEditingUser({
                    ...editingUser,
                    premium_models_enabled: checked
                  })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              ביטול
            </Button>
            <Button onClick={saveUserLimits} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
