import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useState } from "react";
import { 
  Code, 
  Copy, 
  Check, 
  Zap, 
  Database,
  Webhook,
  Bot,
  ExternalLink,
  Server,
  Shield,
  Globe,
  RefreshCw,
  Lock,
  Unlock,
  Activity,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const API_BASE = `https://ovkuabbfubtiwnlksmxd.supabase.co/functions/v1`;

const endpoints = [
  {
    category: "Data API",
    baseUrl: `${API_BASE}/data-api`,
    items: [
      { method: "GET", path: "/dashboard", params: "?client_id=xxx", description: "קבלת סיכום דשבורד מלא" },
      { method: "GET", path: "/clients", params: "", description: "רשימת כל הלקוחות" },
      { method: "GET", path: "/campaigns", params: "?client_id=xxx", description: "קמפיינים של לקוח" },
      { method: "GET", path: "/tasks", params: "?client_id=xxx", description: "משימות של לקוח" },
      { method: "GET", path: "/team", params: "", description: "רשימת חברי צוות" },
      { method: "GET", path: "/analytics", params: "?client_id=xxx", description: "נתוני אנליטיקס לפי פלטפורמה" },
      { method: "GET", path: "/export", params: "?client_id=xxx", description: "ייצוא מלא של נתוני לקוח" },
    ],
  },
  {
    category: "Webhooks",
    baseUrl: `${API_BASE}/webhook-receiver`,
    items: [
      { method: "POST", path: "?source=google_ads&client_id=xxx", params: "", description: "עדכון נתוני Google Ads" },
      { method: "POST", path: "?source=facebook_ads&client_id=xxx", params: "", description: "עדכון נתוני Facebook Ads" },
      { method: "POST", path: "?source=analytics&client_id=xxx", params: "", description: "עדכון נתוני Analytics" },
      { method: "POST", path: "?source=task_update", params: "", description: "עדכון סטטוס משימה" },
      { method: "POST", path: "?source=campaign_create&client_id=xxx", params: "", description: "יצירת קמפיין חדש" },
    ],
  },
];

const mcpActions = [
  { action: "list_clients", description: "קבלת רשימת לקוחות" },
  { action: "get_client", params: "client_id", description: "קבלת פרטי לקוח" },
  { action: "create_client", params: "name, industry?, website?", description: "יצירת לקוח חדש" },
  { action: "list_campaigns", params: "client_id?, status?", description: "קבלת קמפיינים" },
  { action: "create_campaign", params: "client_id, name, platform?, budget?", description: "יצירת קמפיין" },
  { action: "update_campaign", params: "campaign_id, ...fields", description: "עדכון קמפיין" },
  { action: "list_tasks", params: "client_id?, status?, assignee?", description: "קבלת משימות" },
  { action: "create_task", params: "title, client_id?, assignee?", description: "יצירת משימה" },
  { action: "update_task", params: "task_id, ...fields", description: "עדכון משימה" },
  { action: "get_dashboard", params: "client_id?", description: "קבלת סיכום דשבורד" },
  { action: "get_analytics", params: "client_id?", description: "קבלת אנליטיקס" },
  { action: "list_goals", params: "client_id", description: "קבלת יעדים" },
  { action: "create_goal", params: "client_id, name, target_value", description: "יצירת יעד" },
  { action: "help", description: "רשימת כל הפעולות הזמינות" },
];

interface GatewayRoute {
  path: string;
  methods: string[];
  description: string;
  requireAuth: boolean;
}

interface GatewayStatus {
  status: string;
  version: string;
  routes: GatewayRoute[];
}

const methodColors: Record<string, string> = {
  GET: "bg-green-500/20 text-green-600 dark:text-green-400",
  POST: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  PUT: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  DELETE: "bg-red-500/20 text-red-600 dark:text-red-400",
};

export default function ApiDocs() {
  const [copied, setCopied] = useState<string | null>(null);

  // Fetch gateway status
  const { data: gatewayData, isLoading: gatewayLoading, refetch: refetchGateway } = useQuery<GatewayStatus>({
    queryKey: ["api-gateway-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("api-gateway", { body: {} });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("הועתק!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <MainLayout>
      <div className="p-8 max-w-5xl">
        <PageHeader 
          title="API ותיעוד"
          description="חיבור מערכות חיצוניות, API Gateway, Webhooks ו-MCP"
        />

        <Tabs defaultValue="gateway" className="mt-6">
          <TabsList className="grid grid-cols-4 w-fit">
            <TabsTrigger value="gateway" className="gap-2">
              <Server className="w-4 h-4" />
              API Gateway
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Database className="w-4 h-4" />
              Data API
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="w-4 h-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="mcp" className="gap-2">
              <Bot className="w-4 h-4" />
              MCP Server
            </TabsTrigger>
          </TabsList>

          {/* API Gateway Tab */}
          <TabsContent value="gateway" className="mt-6 space-y-6">
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Server className="w-5 h-5 text-primary" />
                  API Gateway
                </h2>
                <Button variant="outline" size="sm" onClick={() => refetchGateway()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  רענן
                </Button>
              </div>
              <p className="text-muted-foreground mb-4">
                נקודת כניסה אחידה לכל שירותי הפלטפורמה עם אימות, Rate Limiting והפניה אוטומטית.
              </p>

              {/* Status Cards */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
                        <Activity className="h-4 w-4 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">סטטוס</p>
                        <p className="font-semibold text-sm text-green-500">
                          {gatewayData?.status === "healthy" ? "פעיל" : "בודק..."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                        <Globe className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">נקודות קצה</p>
                        <p className="font-semibold text-sm">{gatewayData?.routes?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                        <Shield className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">גרסה</p>
                        <p className="font-semibold text-sm">{gatewayData?.version || "1.0.0"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded">
                        <Clock className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rate Limit</p>
                        <p className="font-semibold text-sm text-green-500">פעיל</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Base URL */}
              <div className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between">
                <code className="text-sm font-mono" dir="ltr">
                  {API_BASE}/api-gateway
                </code>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => copyToClipboard(`${API_BASE}/api-gateway`, "gateway-base")}
                >
                  {copied === "gateway-base" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Routes */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {gatewayData?.routes?.map((route, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg text-sm">
                    <div className="flex gap-1">
                      {route.methods.map((method) => (
                        <Badge key={method} className={`${methodColors[method]} text-xs px-1.5`}>
                          {method}
                        </Badge>
                      ))}
                    </div>
                    <code className="font-mono text-primary flex-1">{route.path}</code>
                    {route.requireAuth ? (
                      <span title="דורש אימות"><Lock className="h-3 w-3 text-yellow-500" /></span>
                    ) : (
                      <span title="ציבורי"><Unlock className="h-3 w-3 text-green-500" /></span>
                    )}
                    <span className="text-muted-foreground text-xs">{route.description}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={() => window.open(`${API_BASE}/api-gateway/docs`, "_blank")}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  OpenAPI Spec
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="api" className="mt-6 space-y-6">
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Data API
              </h2>
              <p className="text-muted-foreground mb-4">
                קבלת נתונים מהמערכת בפורמט JSON. כל הנתיבים תומכים ב-GET requests.
              </p>
              
              <div className="space-y-3">
                {endpoints[0].items.map((endpoint, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <span className="px-2 py-1 bg-success/20 text-success text-xs font-mono rounded">
                      {endpoint.method}
                    </span>
                    <code className="flex-1 text-sm font-mono text-primary">
                      {endpoints[0].baseUrl}{endpoint.path}{endpoint.params}
                    </code>
                    <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(`${endpoints[0].baseUrl}${endpoint.path}${endpoint.params}`, `api-${idx}`)}
                    >
                      {copied === `api-${idx}` ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-info/10 border border-info/30 rounded-lg">
                <h3 className="font-semibold mb-2">דוגמת שימוש:</h3>
                <pre className="text-sm font-mono bg-background/50 p-3 rounded overflow-x-auto" dir="ltr">
{`fetch('${API_BASE}/data-api/dashboard?client_id=YOUR_CLIENT_ID')
  .then(res => res.json())
  .then(data => console.log(data));`}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="mt-6 space-y-6">
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Webhook className="w-5 h-5 text-primary" />
                Webhook Receiver
              </h2>
              <p className="text-muted-foreground mb-4">
                קבלת עדכונים ממערכות חיצוניות כמו Google Ads, Facebook, Zapier ועוד.
              </p>
              
              <div className="space-y-3">
                {endpoints[1].items.map((endpoint, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <span className="px-2 py-1 bg-warning/20 text-warning text-xs font-mono rounded">
                      {endpoint.method}
                    </span>
                    <code className="flex-1 text-sm font-mono text-primary">
                      {endpoints[1].baseUrl}{endpoint.path}
                    </code>
                    <span className="text-sm text-muted-foreground">{endpoint.description}</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(`${endpoints[1].baseUrl}${endpoint.path}`, `webhook-${idx}`)}
                    >
                      {copied === `webhook-${idx}` ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-info/10 border border-info/30 rounded-lg">
                <h3 className="font-semibold mb-2">דוגמת Webhook מ-Zapier:</h3>
                <pre className="text-sm font-mono bg-background/50 p-3 rounded overflow-x-auto" dir="ltr">
{`POST ${API_BASE}/webhook-receiver?source=task_update
Content-Type: application/json

{
  "task_id": "uuid-here",
  "status": "completed",
  "notes": "Task finished via Zapier"
}`}
                </pre>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mcp" className="mt-6 space-y-6">
            <div className="glass rounded-xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                MCP Server
              </h2>
              <p className="text-muted-foreground mb-4">
                ממשק מתקדם לאינטגרציה עם עוזרי AI וכלי אוטומציה. שלח פעולות ב-JSON וקבל תגובות מובנות.
              </p>

              <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                <code className="text-sm font-mono" dir="ltr">
                  POST {API_BASE}/mcp-server
                </code>
              </div>
              
              <div className="space-y-2">
                {mcpActions.map((action, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <code className="font-mono text-primary font-bold">{action.action}</code>
                    {action.params && (
                      <span className="text-xs text-muted-foreground">({action.params})</span>
                    )}
                    <span className="flex-1 text-sm text-muted-foreground text-left">{action.description}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-info/10 border border-info/30 rounded-lg">
                <h3 className="font-semibold mb-2">דוגמת שימוש MCP:</h3>
                <pre className="text-sm font-mono bg-background/50 p-3 rounded overflow-x-auto" dir="ltr">
{`// Get dashboard data
fetch('${API_BASE}/mcp-server', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'get_dashboard',
    params: { client_id: 'YOUR_CLIENT_ID' }
  })
}).then(res => res.json());

// Create a new task
fetch('${API_BASE}/mcp-server', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'create_task',
    params: {
      title: 'New task from API',
      client_id: 'YOUR_CLIENT_ID',
      priority: 'high',
      assignee: 'John Doe'
    }
  })
});`}
                </pre>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="gap-2" onClick={() => window.open(`${API_BASE}/mcp-server`, '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                  בדוק API
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
