import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { useCampaignPerformance } from "@/hooks/useDailyAnalytics";
import { getDateRange, formatILS, formatNum, formatPercent, type DatePreset } from "@/lib/dateUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const platformLabels: Record<string, string> = {
  meta_ads: "Meta",
  google_ads: "Google",
  tiktok_ads: "TikTok",
};

const platformColors: Record<string, string> = {
  meta_ads: "bg-blue-500/20 text-blue-400",
  google_ads: "bg-green-500/20 text-green-400",
  tiktok_ads: "bg-pink-500/20 text-pink-400",
};

type SortKey = "spend" | "impressions" | "clicks" | "conversions" | "conversion_value";

export default function CampaignPerformance() {
  const { selectedClient } = useClient();
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("spend");
  const [sortAsc, setSortAsc] = useState(false);

  const range = getDateRange(datePreset);
  const { data: campaigns = [], isLoading } = useCampaignPerformance(
    range.from,
    range.to,
    platformFilter !== "all" ? platformFilter : undefined
  );

  const filtered = campaigns
    .filter((c) => !search || c.campaign_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const diff = (a[sortBy] || 0) - (b[sortBy] || 0);
      return sortAsc ? diff : -diff;
    });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(false);
    }
  };

  const SortHeader = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <Button variant="ghost" size="sm" className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground" onClick={() => handleSort(sortKey)}>
      {label}
      <ArrowUpDown className={cn("w-3 h-3 mr-1", sortBy === sortKey && "text-primary")} />
    </Button>
  );

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8">
          <PageHeader title="ביצועי קמפיינים" description="בחר לקוח כדי לצפות בנתונים" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        <PageHeader title="ביצועי קמפיינים" description={`רמת קמפיין — ${selectedClient.name}`} />

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 ימים</SelectItem>
              <SelectItem value="14d">14 ימים</SelectItem>
              <SelectItem value="30d">30 ימים</SelectItem>
              <SelectItem value="mtd">החודש</SelectItem>
              <SelectItem value="ytd">השנה</SelectItem>
            </SelectContent>
          </Select>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הפלטפורמות</SelectItem>
              <SelectItem value="meta_ads">Meta Ads</SelectItem>
              <SelectItem value="google_ads">Google Ads</SelectItem>
              <SelectItem value="tiktok_ads">TikTok Ads</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חפש קמפיין..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 h-9"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center text-muted-foreground">
            אין נתוני קמפיינים בטווח התאריכים שנבחר
          </div>
        ) : (
          <div className="glass rounded-xl card-shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">קמפיין</TableHead>
                  <TableHead className="text-right">פלטפורמה</TableHead>
                  <TableHead className="text-right"><SortHeader label="הוצאה" sortKey="spend" /></TableHead>
                  <TableHead className="text-right"><SortHeader label="חשיפות" sortKey="impressions" /></TableHead>
                  <TableHead className="text-right"><SortHeader label="קליקים" sortKey="clicks" /></TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right"><SortHeader label="המרות" sortKey="conversions" /></TableHead>
                  <TableHead className="text-right"><SortHeader label="ערך המרות" sortKey="conversion_value" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={`${c.campaign_id}_${c.platform}`} className="hover:bg-muted/30">
                    <TableCell className="font-medium max-w-[250px] truncate">{c.campaign_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("text-xs", platformColors[c.platform])}>
                        {platformLabels[c.platform] || c.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{formatILS(c.spend)}</TableCell>
                    <TableCell className="font-mono">{formatNum(c.impressions)}</TableCell>
                    <TableCell className="font-mono">{formatNum(c.clicks)}</TableCell>
                    <TableCell className="font-mono">{c.impressions > 0 ? formatPercent((c.clicks / c.impressions) * 100) : "—"}</TableCell>
                    <TableCell className="font-mono">{formatNum(c.conversions)}</TableCell>
                    <TableCell className="font-mono">{formatILS(c.conversion_value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
