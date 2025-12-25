import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Play, 
  Pause, 
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  Calendar,
  Filter,
  Plus,
  MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  client: string;
  platform: "google" | "facebook" | "instagram" | "linkedin" | "tiktok";
  status: "active" | "paused" | "ended" | "draft";
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  story: string;
}

const campaigns: Campaign[] = [
  {
    id: "1",
    name: "קמפיין מודעות קיץ 2024",
    client: "חברת אלפא",
    platform: "facebook",
    status: "active",
    startDate: "01/06/2024",
    endDate: "31/08/2024",
    budget: 25000,
    spent: 12500,
    impressions: 450000,
    clicks: 8500,
    conversions: 340,
    ctr: 1.89,
    cpc: 1.47,
    story: "הקמפיין נועד להגביר את המודעות למותג לקראת עונת הקיץ. התמקדנו בקהל צעיר 25-35.",
  },
  {
    id: "2",
    name: "חיפוש ממומן - מילות מפתח",
    client: "סטארטאפ בטא",
    platform: "google",
    status: "active",
    startDate: "15/05/2024",
    endDate: "15/08/2024",
    budget: 15000,
    spent: 8200,
    impressions: 125000,
    clicks: 4200,
    conversions: 180,
    ctr: 3.36,
    cpc: 1.95,
    story: "קמפיין ממוקד להובלת תנועה איכותית לדף הנחיתה החדש. שיפור CTR ב-40% מהקמפיין הקודם.",
  },
  {
    id: "3",
    name: "קמפיין אינסטגרם סטוריז",
    client: "חברת גמא",
    platform: "instagram",
    status: "paused",
    startDate: "01/07/2024",
    endDate: "30/09/2024",
    budget: 10000,
    spent: 5600,
    impressions: 280000,
    clicks: 6100,
    conversions: 95,
    ctr: 2.18,
    cpc: 0.92,
    story: "הושהה זמנית לצורך אופטימיזציה של הקריאייטיב. שיעור המרה נמוך מהצפי.",
  },
  {
    id: "4",
    name: "קמפיין לינקדאין B2B",
    client: "חברת דלתא",
    platform: "linkedin",
    status: "active",
    startDate: "10/06/2024",
    endDate: "10/09/2024",
    budget: 20000,
    spent: 9800,
    impressions: 85000,
    clicks: 2100,
    conversions: 45,
    ctr: 2.47,
    cpc: 4.67,
    story: "קמפיין לגיוס לידים B2B. מיקוד במנהלי שיווק ומנכ״לים. תוצאות מעולות.",
  },
  {
    id: "5",
    name: "השקת מוצר חדש",
    client: "חברת אלפא",
    platform: "tiktok",
    status: "draft",
    startDate: "01/09/2024",
    endDate: "30/11/2024",
    budget: 30000,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ctr: 0,
    cpc: 0,
    story: "קמפיין מתוכנן להשקת המוצר החדש. ממתין לאישור קריאייטיב.",
  },
];

const platformConfig = {
  google: { color: "bg-[#4285F4]", name: "Google Ads" },
  facebook: { color: "bg-[#1877F2]", name: "Facebook" },
  instagram: { color: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737]", name: "Instagram" },
  linkedin: { color: "bg-[#0A66C2]", name: "LinkedIn" },
  tiktok: { color: "bg-[#000000]", name: "TikTok" },
};

const statusConfig = {
  active: { icon: Play, color: "text-success", bg: "bg-success/10", label: "פעיל" },
  paused: { icon: Pause, color: "text-warning", bg: "bg-warning/10", label: "מושהה" },
  ended: { icon: null, color: "text-muted-foreground", bg: "bg-muted", label: "הסתיים" },
  draft: { icon: null, color: "text-muted-foreground", bg: "bg-muted", label: "טיוטה" },
};

export default function Campaigns() {
  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <div>
            <h1 className="text-3xl font-bold mb-2">ניהול קמפיינים</h1>
            <p className="text-muted-foreground">נתונים בזמן אמת וסיפור הקמפיין</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <Filter className="w-4 h-4" />
              <span>סינון</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors glow">
              <Plus className="w-4 h-4" />
              <span>קמפיין חדש</span>
            </button>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          {campaigns.map((campaign, index) => {
            const status = statusConfig[campaign.status];
            const platform = platformConfig[campaign.platform];
            const budgetUsed = (campaign.spent / campaign.budget) * 100;
            const StatusIcon = status.icon;

            return (
              <div 
                key={campaign.id}
                className="glass rounded-xl card-shadow opacity-0 animate-slide-up glass-hover overflow-hidden"
                style={{ animationDelay: `${0.1 + index * 0.1}s`, animationFillMode: "forwards" }}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Platform Badge */}
                    <div className={cn("w-12 h-12 rounded-xl flex-shrink-0", platform.color)} />
                    
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold truncate">{campaign.name}</h3>
                        <span className={cn(
                          "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium",
                          status.bg, status.color
                        )}>
                          {StatusIcon && <StatusIcon className="w-3 h-3" />}
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span>{campaign.client}</span>
                        <span>•</span>
                        <span>{platform.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {campaign.startDate} - {campaign.endDate}
                        </span>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs">הוצאה</span>
                          </div>
                          <p className="font-bold">₪{campaign.spent.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">מתוך ₪{campaign.budget.toLocaleString()}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Eye className="w-4 h-4" />
                            <span className="text-xs">חשיפות</span>
                          </div>
                          <p className="font-bold">{(campaign.impressions / 1000).toFixed(0)}K</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <MousePointer className="w-4 h-4" />
                            <span className="text-xs">קליקים</span>
                          </div>
                          <p className="font-bold">{campaign.clicks.toLocaleString()}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs">המרות</span>
                          </div>
                          <p className="font-bold">{campaign.conversions}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <span className="text-xs">CTR</span>
                          </div>
                          <p className="font-bold">{campaign.ctr}%</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <span className="text-xs">CPC</span>
                          </div>
                          <p className="font-bold">₪{campaign.cpc}</p>
                        </div>
                      </div>

                      {/* Budget Progress */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">ניצול תקציב</span>
                          <span className="font-medium">{budgetUsed.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              budgetUsed > 90 ? "bg-destructive" : budgetUsed > 70 ? "bg-warning" : "bg-primary"
                            )}
                            style={{ width: `${Math.min(budgetUsed, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Story */}
                      <div className="bg-muted/20 rounded-lg p-4 border-r-4 border-primary">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">סיפור הקמפיין: </span>
                          {campaign.story}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
