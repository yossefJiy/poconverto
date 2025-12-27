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
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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

export default function ApiDocs() {
  const [copied, setCopied] = useState<string | null>(null);

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
          description="חיבור מערכות חיצוניות, webhooks ו-MCP"
        />

        <Tabs defaultValue="api" className="mt-6">
          <TabsList className="grid grid-cols-3 w-fit">
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
