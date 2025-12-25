import { TrendingUp, Eye, MousePointer, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  client: string;
  platform: "google" | "facebook" | "instagram" | "linkedin";
  status: "active" | "paused" | "ended";
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

const campaigns: Campaign[] = [
  {
    id: "1",
    name: "קמפיין מודעות קיץ 2024",
    client: "חברת אלפא",
    platform: "facebook",
    status: "active",
    spend: 12500,
    impressions: 450000,
    clicks: 8500,
    conversions: 340,
  },
  {
    id: "2",
    name: "חיפוש ממומן - מילות מפתח",
    client: "סטארטאפ בטא",
    platform: "google",
    status: "active",
    spend: 8200,
    impressions: 125000,
    clicks: 4200,
    conversions: 180,
  },
  {
    id: "3",
    name: "קמפיין אינסטגרם סטוריז",
    client: "חברת גמא",
    platform: "instagram",
    status: "paused",
    spend: 5600,
    impressions: 280000,
    clicks: 6100,
    conversions: 95,
  },
];

const platformColors = {
  google: "bg-[#4285F4]",
  facebook: "bg-[#1877F2]",
  instagram: "bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737]",
  linkedin: "bg-[#0A66C2]",
};

const statusConfig = {
  active: { color: "text-success", bg: "bg-success/10", label: "פעיל" },
  paused: { color: "text-warning", bg: "bg-warning/10", label: "מושהה" },
  ended: { color: "text-muted-foreground", bg: "bg-muted", label: "הסתיים" },
};

export function CampaignOverview() {
  return (
    <div className="glass rounded-xl card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}>
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h2 className="text-xl font-bold">קמפיינים פעילים</h2>
        <button className="text-primary text-sm hover:underline">ראה הכל</button>
      </div>
      <div className="divide-y divide-border">
        {campaigns.map((campaign, index) => {
          const status = statusConfig[campaign.status];
          
          return (
            <div 
              key={campaign.id} 
              className="p-4 hover:bg-muted/30 transition-colors cursor-pointer opacity-0 animate-fade-in"
              style={{ animationDelay: `${0.45 + index * 0.1}s`, animationFillMode: "forwards" }}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex-shrink-0",
                  platformColors[campaign.platform]
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{campaign.name}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      status.bg, status.color
                    )}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{campaign.client}</p>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">הוצאה</p>
                        <p className="font-medium">₪{campaign.spend.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">חשיפות</p>
                        <p className="font-medium">{(campaign.impressions / 1000).toFixed(0)}K</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MousePointer className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">קליקים</p>
                        <p className="font-medium">{campaign.clicks.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">המרות</p>
                        <p className="font-medium">{campaign.conversions}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
