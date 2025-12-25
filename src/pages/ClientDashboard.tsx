import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  TrendingUp, 
  TrendingDown,
  Eye,
  MousePointer,
  DollarSign,
  ShoppingCart,
  Users,
  Target,
  Link2,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ExternalLink,
  Calendar,
  BarChart3,
  Zap,
  Settings,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Link } from "react-router-dom";

// Integration status
const integrations = [
  { id: "meta", name: "Meta Ads", icon: "📘", connected: true, lastSync: "לפני 5 דקות", status: "active" },
  { id: "google", name: "Google Ads", icon: "🔍", connected: true, lastSync: "לפני 12 דקות", status: "active" },
  { id: "shopify", name: "Shopify", icon: "🛒", connected: false, lastSync: null, status: "pending" },
  { id: "analytics", name: "Analytics", icon: "📊", connected: false, lastSync: null, status: "pending" },
];

// Monthly performance data
const performanceData = [
  { month: "ינואר", meta: 45000, google: 32000, revenue: 180000 },
  { month: "פברואר", meta: 52000, google: 38000, revenue: 210000 },
  { month: "מרץ", meta: 48000, google: 41000, revenue: 195000 },
  { month: "אפריל", meta: 61000, google: 45000, revenue: 245000 },
  { month: "מאי", meta: 55000, google: 48000, revenue: 230000 },
  { month: "יוני", meta: 68000, google: 52000, revenue: 285000 },
  { month: "יולי", meta: 72000, google: 58000, revenue: 310000 },
  { month: "אוגוסט", meta: 78000, google: 62000, revenue: 340000 },
  { month: "ספטמבר", meta: 85000, google: 68000, revenue: 380000 },
  { month: "אוקטובר", meta: 92000, google: 75000, revenue: 420000 },
  { month: "נובמבר", meta: 105000, google: 82000, revenue: 480000 },
  { month: "דצמבר", meta: 125000, google: 95000, revenue: 560000 },
];

// Campaign breakdown
const campaignBreakdown = [
  { name: "Remarketing", value: 35, color: "hsl(199, 89%, 48%)" },
  { name: "Prospecting", value: 40, color: "hsl(142, 71%, 45%)" },
  { name: "Brand", value: 15, color: "hsl(38, 92%, 50%)" },
  { name: "Sale", value: 10, color: "hsl(340, 82%, 52%)" },
];

// Main campaign and sub-campaigns
const mainCampaign = {
  name: "🔥 Sale of the Year",
  status: "active",
  startDate: "15/12/2024",
  endDate: "31/12/2024",
  budget: 150000,
  spent: 45000,
  impressions: 2500000,
  clicks: 85000,
  conversions: 3200,
  revenue: 480000,
  roas: 10.67,
};

const subCampaigns = [
  {
    id: "1",
    name: "Meta - Remarketing Sale",
    platform: "meta",
    status: "active",
    budget: 40000,
    spent: 12500,
    impressions: 850000,
    clicks: 32000,
    conversions: 1200,
    ctr: 3.76,
  },
  {
    id: "2",
    name: "Meta - Prospecting Sale",
    platform: "meta",
    status: "active",
    budget: 35000,
    spent: 10800,
    impressions: 720000,
    clicks: 24000,
    conversions: 680,
    ctr: 3.33,
  },
  {
    id: "3",
    name: "Google - Search Sale",
    platform: "google",
    status: "active",
    budget: 45000,
    spent: 14200,
    impressions: 580000,
    clicks: 18000,
    conversions: 920,
    ctr: 3.10,
  },
  {
    id: "4",
    name: "Google - Shopping Sale",
    platform: "google",
    status: "active",
    budget: 30000,
    spent: 7500,
    impressions: 350000,
    clicks: 11000,
    conversions: 400,
    ctr: 3.14,
  },
];

// Tasks for this client
const clientTasks = [
  {
    id: "1",
    title: "עיצוב באנרים לסייל",
    status: "completed",
    assignee: "יעל כהן",
    dueDate: "14/12/2024",
    priority: "high",
  },
  {
    id: "2",
    title: "הכנת קריאייטיב לרימרקטינג",
    status: "in-progress",
    assignee: "דני לוי",
    dueDate: "18/12/2024",
    priority: "high",
  },
  {
    id: "3",
    title: "אופטימיזציה לקמפיין גוגל",
    status: "in-progress",
    assignee: "מיכל אברהם",
    dueDate: "20/12/2024",
    priority: "urgent",
  },
  {
    id: "4",
    title: "עדכון מוצרים בשופיפיי",
    status: "pending",
    assignee: "נועה גולן",
    dueDate: "22/12/2024",
    priority: "medium",
  },
  {
    id: "5",
    title: "דו״ח ביצועים שבועי",
    status: "pending",
    assignee: "רון שמיר",
    dueDate: "25/12/2024",
    priority: "low",
  },
];

const statusConfig = {
  pending: { icon: Circle, color: "text-warning", bg: "bg-warning/10", label: "ממתין" },
  "in-progress": { icon: Clock, color: "text-info", bg: "bg-info/10", label: "בתהליך" },
  completed: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "הושלם" },
};

const priorityConfig = {
  low: { color: "bg-muted", label: "נמוכה" },
  medium: { color: "bg-warning", label: "בינונית" },
  high: { color: "bg-destructive", label: "גבוהה" },
  urgent: { color: "bg-destructive animate-pulse-glow", label: "דחוף" },
};

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "campaigns" | "tasks" | "integrations">("overview");

  const budgetUsed = (mainCampaign.spent / mainCampaign.budget) * 100;

  return (
    <MainLayout>
      <div className="p-8">
        {/* Client Header */}
        <div className="flex items-start justify-between mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-3xl font-bold shadow-lg">
              TD
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">TD TAMAR DRORY</h1>
              <p className="text-muted-foreground mb-2">אופנה ולייפסטייל</p>
              <div className="flex items-center gap-3">
                {integrations.map((int) => (
                  <div 
                    key={int.id}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                      int.connected ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span>{int.icon}</span>
                    <span>{int.connected ? "מחובר" : "לא מחובר"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Link
            to="/client-settings"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>הגדרות לקוח</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 opacity-0 animate-slide-up" style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            {[
              { id: "overview", label: "סקירה כללית", icon: BarChart3 },
              { id: "campaigns", label: "קמפיינים", icon: Target },
              { id: "tasks", label: "משימות", icon: CheckCircle2 },
              { id: "integrations", label: "אינטגרציות", icon: Link2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 opacity-0 animate-slide-up" style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}>
              <div className="glass rounded-xl p-6 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <span className="flex items-center gap-1 text-sm text-success">
                    <TrendingUp className="w-3 h-3" />
                    +23%
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mb-1">הכנסות החודש</p>
                <p className="text-3xl font-bold">₪560,000</p>
              </div>

              <div className="glass rounded-xl p-6 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-accent/10 text-accent">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <span className="flex items-center gap-1 text-sm text-success">
                    <TrendingUp className="w-3 h-3" />
                    +18%
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mb-1">הזמנות</p>
                <p className="text-3xl font-bold">3,420</p>
              </div>

              <div className="glass rounded-xl p-6 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-info/10 text-info">
                    <Target className="w-6 h-6" />
                  </div>
                  <span className="flex items-center gap-1 text-sm text-success">
                    <TrendingUp className="w-3 h-3" />
                    +0.8
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mb-1">ROAS</p>
                <p className="text-3xl font-bold">10.67x</p>
              </div>

              <div className="glass rounded-xl p-6 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-warning/10 text-warning">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="flex items-center gap-1 text-sm text-success">
                    <TrendingUp className="w-3 h-3" />
                    +12%
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mb-1">מבקרים חדשים</p>
                <p className="text-3xl font-bold">45.2K</p>
              </div>
            </div>

            {/* Main Campaign Banner */}
            <div className="glass rounded-xl overflow-hidden card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}>
              <div className="bg-gradient-to-l from-pink-500/20 via-purple-500/20 to-transparent p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">{mainCampaign.name}</h2>
                      <span className="px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                        פעיל
                      </span>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {mainCampaign.startDate} - {mainCampaign.endDate}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-muted-foreground text-sm">תקציב כולל</p>
                    <p className="text-2xl font-bold">₪{mainCampaign.budget.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">הוצאה</p>
                    <p className="text-xl font-bold">₪{mainCampaign.spent.toLocaleString()}</p>
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${budgetUsed}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">חשיפות</p>
                    <p className="text-xl font-bold">{(mainCampaign.impressions / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">קליקים</p>
                    <p className="text-xl font-bold">{(mainCampaign.clicks / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">המרות</p>
                    <p className="text-xl font-bold">{mainCampaign.conversions.toLocaleString()}</p>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">הכנסות</p>
                    <p className="text-xl font-bold text-success">₪{mainCampaign.revenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Performance Chart */}
              <div className="lg:col-span-2 glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}>
                <h3 className="text-lg font-bold mb-4">ביצועים שנתיים - Meta vs Google</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <defs>
                        <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1877F2" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorGoogle" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4285F4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
                      <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickFormatter={(v) => `₪${v/1000}K`} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "hsl(222, 47%, 10%)",
                          border: "1px solid hsl(222, 47%, 16%)",
                          borderRadius: "0.75rem",
                        }}
                        formatter={(value: number) => [`₪${value.toLocaleString()}`, '']}
                      />
                      <Area type="monotone" dataKey="meta" name="Meta" stroke="#1877F2" fill="url(#colorMeta)" strokeWidth={2} />
                      <Area type="monotone" dataKey="google" name="Google" stroke="#4285F4" fill="url(#colorGoogle)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Campaign Breakdown */}
              <div className="glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}>
                <h3 className="text-lg font-bold mb-4">חלוקת תקציב</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={campaignBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {campaignBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {campaignBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === "campaigns" && (
          <div className="space-y-4 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">קמפיינים תחת {mainCampaign.name}</h2>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
                <Zap className="w-4 h-4" />
                סנכרן נתונים
              </button>
            </div>
            
            {subCampaigns.map((campaign, index) => (
              <div 
                key={campaign.id}
                className="glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up glass-hover"
                style={{ animationDelay: `${0.1 + index * 0.08}s`, animationFillMode: "forwards" }}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-xl",
                    campaign.platform === "meta" ? "bg-[#1877F2]" : "bg-[#4285F4]"
                  )}>
                    {campaign.platform === "meta" ? "📘" : "🔍"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold">{campaign.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs">פעיל</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">תקציב</p>
                        <p className="font-medium">₪{campaign.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">הוצאה</p>
                        <p className="font-medium">₪{campaign.spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">חשיפות</p>
                        <p className="font-medium">{(campaign.impressions / 1000).toFixed(0)}K</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">קליקים</p>
                        <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">המרות</p>
                        <p className="font-medium text-success">{campaign.conversions}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div className="space-y-4 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">משימות ל-TD TAMAR DRORY</h2>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors">
                + משימה חדשה
              </button>
            </div>

            {clientTasks.map((task, index) => {
              const status = statusConfig[task.status as keyof typeof statusConfig];
              const priority = priorityConfig[task.priority as keyof typeof priorityConfig];
              const StatusIcon = status.icon;

              return (
                <div 
                  key={task.id}
                  className="glass rounded-xl p-4 card-shadow opacity-0 animate-slide-up glass-hover"
                  style={{ animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: "forwards" }}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", status.bg)}>
                      <StatusIcon className={cn("w-5 h-5", status.color)} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{task.title}</h3>
                        <span className={cn("w-2 h-2 rounded-full", priority.color)} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{task.assignee}</span>
                        <span>תאריך יעד: {task.dueDate}</span>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      status.bg, status.color
                    )}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === "integrations" && (
          <div className="space-y-6 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">אינטגרציות</h2>
                <p className="text-sm text-muted-foreground">חבר את מערכות הפרסום והמכירה של הלקוח</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration, index) => (
                <div 
                  key={integration.id}
                  className={cn(
                    "glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up",
                    integration.connected ? "border-2 border-success/30" : ""
                  )}
                  style={{ animationDelay: `${0.1 + index * 0.08}s`, animationFillMode: "forwards" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl">
                        {integration.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{integration.name}</h3>
                        {integration.connected ? (
                          <p className="text-sm text-success flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            מחובר • {integration.lastSync}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            לא מחובר
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {integration.connected ? (
                      <>
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm">
                          <RefreshCw className="w-4 h-4" />
                          סנכרן עכשיו
                        </button>
                        <button className="px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm">
                          נתק
                        </button>
                      </>
                    ) : (
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm glow">
                        <Link2 className="w-4 h-4" />
                        התחבר
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-info/10 text-info">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">חיבור אוטומטי</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    לאחר חיבור כל המערכות, הנתונים יסונכרנו אוטומטית כל 15 דקות ותוכל לראות ביצועים בזמן אמת.
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      <span>Meta + Google מחוברים</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-warning" />
                      <span>Shopify + Analytics ממתינים</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
