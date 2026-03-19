import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClient } from "@/hooks/useClient";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Globe, ArrowUpDown, TrendingUp, DollarSign, BarChart3, Save, Bookmark, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { SaveKeywordsDialog } from "@/components/keywords/SaveKeywordsDialog";
import { SavedKeywordsTab } from "@/components/keywords/SavedKeywordsTab";

interface MonthlyVolume {
  year: string | number;
  month: string | number;
  volume: number;
}

interface KeywordResult {
  keyword: string;
  avgMonthlySearches: number;
  competition: string;
  competitionIndex: number;
  lowTopOfPageBidMicros: number;
  highTopOfPageBidMicros: number;
  monthlyVolumes: MonthlyVolume[];
}

type SortKey = "avgMonthlySearches" | "competitionIndex" | "lowTopOfPageBidMicros" | "highTopOfPageBidMicros";

const competitionLabels: Record<string, string> = {
  LOW: "נמוכה", MEDIUM: "בינונית", HIGH: "גבוהה", UNSPECIFIED: "לא ידוע",
};

const competitionColors: Record<string, string> = {
  LOW: "bg-green-500/20 text-green-400",
  MEDIUM: "bg-yellow-500/20 text-yellow-400",
  HIGH: "bg-red-500/20 text-red-400",
  UNSPECIFIED: "bg-muted text-muted-foreground",
};

const monthNameMap: Record<string, string> = {
  JANUARY: "ינו", FEBRUARY: "פבר", MARCH: "מרץ", APRIL: "אפר",
  MAY: "מאי", JUNE: "יוני", JULY: "יולי", AUGUST: "אוג",
  SEPTEMBER: "ספט", OCTOBER: "אוק", NOVEMBER: "נוב", DECEMBER: "דצמ",
  "1": "ינו", "2": "פבר", "3": "מרץ", "4": "אפר", "5": "מאי", "6": "יוני",
  "7": "יולי", "8": "אוג", "9": "ספט", "10": "אוק", "11": "נוב", "12": "דצמ",
};

const monthOrder: Record<string, number> = {
  JANUARY: 1, FEBRUARY: 2, MARCH: 3, APRIL: 4, MAY: 5, JUNE: 6,
  JULY: 7, AUGUST: 8, SEPTEMBER: 9, OCTOBER: 10, NOVEMBER: 11, DECEMBER: 12,
};

const languageOptions = [
  { value: "1027", label: "עברית" },
  { value: "1000", label: "אנגלית" },
  { value: "1019", label: "ערבית" },
];

const locationOptions = [
  { value: "2376", label: "ישראל" },
  { value: "2840", label: "ארה״ב" },
  { value: "2826", label: "בריטניה" },
];

export default function KeywordResearch() {
  const { selectedClient } = useClient();
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState("search");
  const [inputMode, setInputMode] = useState<"keywords" | "url">("keywords");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [language, setLanguage] = useState("1027");
  const [location, setLocation] = useState("2376");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("avgMonthlySearches");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordResult | null>(null);
  const [filter, setFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savedRefresh, setSavedRefresh] = useState(0);

  const handleSearch = async () => {
    const keywords = inputMode === "keywords"
      ? keywordsInput.split(/[,\n]/).map(k => k.trim()).filter(Boolean)
      : [];
    const url = inputMode === "url" ? urlInput.trim() : undefined;

    if (!keywords.length && !url) {
      toast({ title: "שגיאה", description: "הזן מילות מפתח או כתובת אתר", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setResults([]);
    setSelectedKeyword(null);
    setSelectedRows(new Set());

    try {
      const { data, error } = await supabase.functions.invoke('keyword-research', {
        body: {
          action: 'generate_ideas',
          keywords: keywords.length ? keywords : undefined,
          url,
          client_id: selectedClient?.id,
          language_id: language,
          location_ids: [location],
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResults(data.results || []);
      if (data.results?.length) setSelectedKeyword(data.results[0]);
      toast({ title: "הושלם", description: `נמצאו ${data.results?.length || 0} רעיונות למילות מפתח` });
    } catch (err: any) {
      console.error('Keyword research error:', err);
      toast({ title: "שגיאה", description: err.message || "שגיאה בחיפוש מילות מפתח", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  const filtered = useMemo(() => {
    return results
      .filter(r => !filter || r.keyword.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => {
        const diff = (a[sortBy] || 0) - (b[sortBy] || 0);
        return sortAsc ? diff : -diff;
      });
  }, [results, filter, sortBy, sortAsc]);

  const trendData = useMemo(() => {
    if (!selectedKeyword?.monthlyVolumes?.length) return [];
    return [...selectedKeyword.monthlyVolumes]
      .sort((a, b) => {
        const yearA = typeof a.year === 'string' ? parseInt(a.year) : a.year;
        const yearB = typeof b.year === 'string' ? parseInt(b.year) : b.year;
        const monthA = typeof a.month === 'string' ? (monthOrder[a.month] || 0) : a.month;
        const monthB = typeof b.month === 'string' ? (monthOrder[b.month] || 0) : b.month;
        return yearA - yearB || monthA - monthB;
      })
      .map(m => ({
        label: `${monthNameMap[String(m.month)] || m.month} ${m.year}`,
        volume: m.volume,
      }));
  }, [selectedKeyword]);

  const stats = useMemo(() => {
    if (!results.length) return null;
    const avgVolume = Math.round(results.reduce((s, r) => s + r.avgMonthlySearches, 0) / results.length);
    const avgCpc = results.reduce((s, r) => s + r.highTopOfPageBidMicros, 0) / results.length;
    const highComp = results.filter(r => r.competition === "HIGH").length;
    return { avgVolume, avgCpc, highComp, total: results.length };
  }, [results]);

  const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  const toggleRow = (idx: number) => {
    const next = new Set(selectedRows);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setSelectedRows(next);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === filtered.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(filtered.map((_, i) => i)));
  };

  const selectedKeywords = useMemo(() =>
    filtered.filter((_, i) => selectedRows.has(i)),
  [filtered, selectedRows]);

  const sourceQuery = inputMode === "keywords" ? keywordsInput : urlInput;

  const exportResultsCsv = () => {
    if (!filtered.length) return;
    const rows = filtered.map(r => ({
      'מילת מפתח': r.keyword,
      'נפח חיפוש חודשי': r.avgMonthlySearches,
      'תחרות': competitionLabels[r.competition] || r.competition,
      'אינדקס תחרות': r.competitionIndex,
      'CPC נמוך': r.lowTopOfPageBidMicros.toFixed(2),
      'CPC גבוה': r.highTopOfPageBidMicros.toFixed(2),
    }));
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r as any)[h]}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyword-research-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <PageHeader title="מחקר מילות מפתח" description="גלה מילות מפתח חדשות עם נתוני נפח חיפוש, תחרות ו-CPC מ-Google Ads" />

      <div className="p-6 space-y-6" dir="rtl">
        {/* Main Tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList>
            <TabsTrigger value="search" className="gap-2">
              <Search className="w-4 h-4" />
              חיפוש
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Bookmark className="w-4 h-4" />
              שמורות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6 mt-4">
            {/* Search Controls */}
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "keywords" | "url")}>
                    <TabsList>
                      <TabsTrigger value="keywords" className="gap-2">
                        <Search className="w-4 h-4" />
                        מילות מפתח
                      </TabsTrigger>
                      <TabsTrigger value="url" className="gap-2">
                        <Globe className="w-4 h-4" />
                        סריקת אתר
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex gap-3 items-end flex-wrap">
                    {inputMode === "keywords" ? (
                      <div className="flex-1 min-w-[300px]">
                        <label className="text-sm text-muted-foreground mb-1.5 block">מילות מפתח (מופרדות בפסיק)</label>
                        <Input
                          value={keywordsInput}
                          onChange={e => setKeywordsInput(e.target.value)}
                          placeholder="נעלי ריצה, נעלי ספורט, נעלי אימון"
                          onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 min-w-[300px]">
                        <label className="text-sm text-muted-foreground mb-1.5 block">כתובת אתר לסריקה</label>
                        <Input
                          value={urlInput}
                          onChange={e => setUrlInput(e.target.value)}
                          placeholder="https://example.com"
                          dir="ltr"
                          onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                      </div>
                    )}

                    <div className="w-32">
                      <label className="text-sm text-muted-foreground mb-1.5 block">שפה</label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {languageOptions.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-32">
                      <label className="text-sm text-muted-foreground mb-1.5 block">מיקום</label>
                      <Select value={location} onValueChange={setLocation}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {locationOptions.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={handleSearch} disabled={isLoading} className="gap-2">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      חפש
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-border/50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <BarChart3 className="w-4 h-4" />
                      סה״כ מילות מפתח
                    </div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <TrendingUp className="w-4 h-4" />
                      נפח חיפוש ממוצע
                    </div>
                    <div className="text-2xl font-bold">{formatNum(stats.avgVolume)}</div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <DollarSign className="w-4 h-4" />
                      CPC ממוצע
                    </div>
                    <div className="text-2xl font-bold">₪{stats.avgCpc.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      תחרות גבוהה
                    </div>
                    <div className="text-2xl font-bold">{stats.highComp}</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Trend Chart */}
            {selectedKeyword && trendData.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    מגמת חיפושים: <span className="text-primary">{selectedKeyword.keyword}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "13px",
                          }}
                          formatter={(value: number) => [formatNum(value), "נפח חיפוש"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="volume"
                          stroke="hsl(var(--primary))"
                          fill="url(#volumeGradient)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Table */}
            {results.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base">תוצאות ({filtered.length})</CardTitle>
                    <div className="flex items-center gap-2">
                      {selectedRows.size > 0 && selectedClient && (
                        <Button size="sm" onClick={() => setShowSaveDialog(true)} className="gap-2">
                          <Save className="w-4 h-4" />
                          שמור נבחרות ({selectedRows.size})
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={exportResultsCsv} className="gap-2">
                        <Download className="w-4 h-4" />
                        CSV
                      </Button>
                      <Input
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="סנן מילות מפתח..."
                        className="w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <input
                              type="checkbox"
                              checked={selectedRows.size === filtered.length && filtered.length > 0}
                              onChange={toggleAllRows}
                              className="rounded"
                            />
                          </TableHead>
                          <TableHead className="text-right">מילת מפתח</TableHead>
                          <TableHead className="text-right">
                            <Button variant="ghost" size="sm" className="gap-1 -mr-2" onClick={() => toggleSort("avgMonthlySearches")}>
                              נפח חיפוש
                              <ArrowUpDown className="w-3 h-3" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button variant="ghost" size="sm" className="gap-1 -mr-2" onClick={() => toggleSort("competitionIndex")}>
                              תחרות
                              <ArrowUpDown className="w-3 h-3" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button variant="ghost" size="sm" className="gap-1 -mr-2" onClick={() => toggleSort("lowTopOfPageBidMicros")}>
                              CPC נמוך
                              <ArrowUpDown className="w-3 h-3" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button variant="ghost" size="sm" className="gap-1 -mr-2" onClick={() => toggleSort("highTopOfPageBidMicros")}>
                              CPC גבוה
                              <ArrowUpDown className="w-3 h-3" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">מגמה</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((row, i) => (
                          <TableRow
                            key={i}
                            className={cn(
                              "cursor-pointer transition-colors",
                              selectedKeyword?.keyword === row.keyword && "bg-primary/5",
                              selectedRows.has(i) && "bg-primary/10"
                            )}
                            onClick={() => setSelectedKeyword(row)}
                          >
                            <TableCell onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedRows.has(i)}
                                onChange={() => toggleRow(i)}
                                className="rounded"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{row.keyword}</TableCell>
                            <TableCell>{formatNum(row.avgMonthlySearches)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={cn("text-xs", competitionColors[row.competition])}>
                                {competitionLabels[row.competition] || row.competition}
                              </Badge>
                            </TableCell>
                            <TableCell dir="ltr" className="text-right">₪{row.lowTopOfPageBidMicros.toFixed(2)}</TableCell>
                            <TableCell dir="ltr" className="text-right">₪{row.highTopOfPageBidMicros.toFixed(2)}</TableCell>
                            <TableCell className="w-24">
                              {row.monthlyVolumes?.length > 0 && (
                                <MiniSparkline data={row.monthlyVolumes.map(m => m.volume)} />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty / Loading states */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="mr-3 text-muted-foreground">מחפש מילות מפתח...</span>
              </div>
            )}

            {!isLoading && results.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">הזן מילות מפתח או כתובת אתר כדי להתחיל</p>
                <p className="text-sm mt-1">קבל נתוני נפח חיפוש, תחרות ו-CPC ישירות מ-Google Ads</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-4">
            {selectedClient ? (
              <SavedKeywordsTab clientId={selectedClient.id} refreshTrigger={savedRefresh} />
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg">בחר לקוח כדי לראות מילות מפתח שמורות</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Dialog */}
      {selectedClient && (
        <SaveKeywordsDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          keywords={selectedKeywords}
          clientId={selectedClient.id}
          sourceQuery={sourceQuery}
          languageId={language}
          locationId={location}
          onSaved={() => {
            setSelectedRows(new Set());
            setSavedRefresh(p => p + 1);
          }}
        />
      )}
    </MainLayout>
  );
}

// Mini sparkline component
function MiniSparkline({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 80;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
