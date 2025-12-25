import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Building2, 
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  ExternalLink,
  MoreVertical,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  industry: string;
  logo: string;
  monthlyBudget: number;
  activeCampaigns: number;
  totalSpend: number;
  performance: number;
  startDate: string;
  status: "active" | "paused" | "churned";
}

const clients: Client[] = [
  {
    id: "1",
    name: "חברת אלפא",
    industry: "טכנולוגיה",
    logo: "α",
    monthlyBudget: 50000,
    activeCampaigns: 5,
    totalSpend: 180000,
    performance: 124,
    startDate: "ינואר 2023",
    status: "active",
  },
  {
    id: "2",
    name: "סטארטאפ בטא",
    industry: "SaaS",
    logo: "β",
    monthlyBudget: 25000,
    activeCampaigns: 3,
    totalSpend: 95000,
    performance: 112,
    startDate: "מרץ 2023",
    status: "active",
  },
  {
    id: "3",
    name: "חברת גמא",
    industry: "קמעונאות",
    logo: "γ",
    monthlyBudget: 35000,
    activeCampaigns: 2,
    totalSpend: 120000,
    performance: 98,
    startDate: "יוני 2023",
    status: "paused",
  },
  {
    id: "4",
    name: "חברת דלתא",
    industry: "פיננסים",
    logo: "δ",
    monthlyBudget: 75000,
    activeCampaigns: 6,
    totalSpend: 280000,
    performance: 145,
    startDate: "ספטמבר 2022",
    status: "active",
  },
  {
    id: "5",
    name: "חברת אפסילון",
    industry: "בריאות",
    logo: "ε",
    monthlyBudget: 40000,
    activeCampaigns: 4,
    totalSpend: 150000,
    performance: 108,
    startDate: "נובמבר 2023",
    status: "active",
  },
];

const statusConfig = {
  active: { color: "text-success", bg: "bg-success/10", label: "פעיל" },
  paused: { color: "text-warning", bg: "bg-warning/10", label: "מושהה" },
  churned: { color: "text-destructive", bg: "bg-destructive/10", label: "עזב" },
};

export default function Clients() {
  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <div>
            <h1 className="text-3xl font-bold mb-2">לקוחות</h1>
            <p className="text-muted-foreground">ניהול ומעקב אחר לקוחות</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors glow">
            <Plus className="w-4 h-4" />
            <span>לקוח חדש</span>
          </button>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clients.map((client, index) => {
            const status = statusConfig[client.status];
            const performanceColor = client.performance >= 100 ? "text-success" : "text-destructive";
            
            return (
              <div 
                key={client.id}
                className="glass rounded-xl card-shadow opacity-0 animate-slide-up glass-hover"
                style={{ animationDelay: `${0.1 + index * 0.08}s`, animationFillMode: "forwards" }}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                        {client.logo}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold">{client.name}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            status.bg, status.color
                          )}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{client.industry}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          לקוח מ{client.startDate}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-xs">תקציב חודשי</span>
                      </div>
                      <p className="text-xl font-bold">₪{client.monthlyBudget.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Target className="w-4 h-4" />
                        <span className="text-xs">קמפיינים פעילים</span>
                      </div>
                      <p className="text-xl font-bold">{client.activeCampaigns}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Building2 className="w-4 h-4" />
                        <span className="text-xs">סה״כ הוצאה</span>
                      </div>
                      <p className="text-xl font-bold">₪{client.totalSpend.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs">ביצוע מול יעד</span>
                      </div>
                      <p className={cn("text-xl font-bold", performanceColor)}>
                        {client.performance}%
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
                      צפה בפרטים
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                      <ExternalLink className="w-4 h-4" />
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
