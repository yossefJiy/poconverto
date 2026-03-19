import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Download, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SavedKeyword {
  id: string;
  keyword: string;
  category_type: string;
  category_value: string;
  tags: string[];
  avg_monthly_searches: number;
  competition: string;
  competition_index: number;
  low_bid: number;
  high_bid: number;
  notes: string | null;
  source_query: string | null;
  language_id: string;
  location_id: string;
  last_refreshed_at: string | null;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  season: "עונה",
  department: "מחלקה",
  campaign: "קמפיין",
  campaign_type: "סוג קמפיין",
  product: "מוצר",
  brand: "מותג",
  custom: "מותאם אישית",
};

const competitionLabels: Record<string, string> = {
  LOW: "נמוכה",
  MEDIUM: "בינונית",
  HIGH: "גבוהה",
  UNSPECIFIED: "לא ידוע",
};

const competitionColors: Record<string, string> = {
  LOW: "bg-green-500/20 text-green-400",
  MEDIUM: "bg-yellow-500/20 text-yellow-400",
  HIGH: "bg-red-500/20 text-red-400",
  UNSPECIFIED: "bg-muted text-muted-foreground",
};

interface SavedKeywordsTabProps {
  clientId: string;
  refreshTrigger?: number;
}

export function SavedKeywordsTab({ clientId, refreshTrigger }: SavedKeywordsTabProps) {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<SavedKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchKeywords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saved_keywords' as any)
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setKeywords((data || []).map((d: any) => ({
        ...d,
        tags: Array.isArray(d.tags) ? d.tags : (typeof d.tags === 'string' ? JSON.parse(d.tags) : []),
      })));
    } catch (err: any) {
      console.error('Fetch saved keywords error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchKeywords(); }, [clientId, refreshTrigger]);

  const categories = useMemo(() => {
    const cats = new Set(keywords.map(k => `${k.category_type}:${k.category_value}`));
    return Array.from(cats).map(c => {
      const [type, value] = c.split(':');
      return { type, value, label: `${categoryLabels[type] || type}: ${value}` };
    });
  }, [keywords]);

  const filtered = useMemo(() => {
    return keywords.filter(k => {
      if (filter && !k.keyword.toLowerCase().includes(filter.toLowerCase())) return false;
      if (categoryFilter !== "all" && `${k.category_type}:${k.category_value}` !== categoryFilter) return false;
      return true;
    });
  }, [keywords, filter, categoryFilter]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(k => k.id)));
  };

  const handleDelete = async () => {
    if (!selectedIds.size) return;
    try {
      const { error } = await supabase
        .from('saved_keywords' as any)
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      toast({ title: "נמחק", description: `${selectedIds.size} מילות מפתח נמחקו` });
      setSelectedIds(new Set());
      fetchKeywords();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    }
  };

  const handleRefreshMetrics = async () => {
    const selected = keywords.filter(k => selectedIds.has(k.id));
    if (!selected.length) {
      toast({ title: "בחר מילות מפתח", description: "בחר מילות מפתח לרענון", variant: "destructive" });
      return;
    }

    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('keyword-research', {
        body: {
          action: 'historical_metrics',
          keywords: selected.map(k => k.keyword),
          client_id: clientId,
          language_id: selected[0]?.language_id || '1027',
          location_ids: [selected[0]?.location_id || '2376'],
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update each keyword with refreshed data
      const updates = (data.results || []).map((r: any) => {
        const match = selected.find(k => k.keyword === r.keyword);
        if (!match) return null;
        return supabase
          .from('saved_keywords' as any)
          .update({
            avg_monthly_searches: r.avgMonthlySearches,
            competition: r.competition,
            competition_index: r.competitionIndex,
            low_bid: r.lowTopOfPageBidMicros,
            high_bid: r.highTopOfPageBidMicros,
            last_refreshed_at: new Date().toISOString(),
          } as any)
          .eq('id', match.id);
      }).filter(Boolean);

      await Promise.all(updates);

      toast({ title: "רוענן", description: `${data.results?.length || 0} מילות מפתח עודכנו` });
      fetchKeywords();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportCsv = () => {
    const rows = filtered.map(k => ({
      'מילת מפתח': k.keyword,
      'קטגוריה': `${categoryLabels[k.category_type] || k.category_type}: ${k.category_value}`,
      'נפח חיפוש': k.avg_monthly_searches,
      'תחרות': competitionLabels[k.competition] || k.competition,
      'CPC נמוך': k.low_bid,
      'CPC גבוה': k.high_bid,
      'תגיות': (k.tags || []).join(', '),
      'הערות': k.notes || '',
    }));

    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${(r as any)[h]}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved-keywords-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="mr-2 text-muted-foreground">טוען מילות מפתח שמורות...</span>
      </div>
    );
  }

  if (!keywords.length) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg">אין מילות מפתח שמורות</p>
        <p className="text-sm mt-1">חפש מילות מפתח בטאב "חיפוש" ושמור אותן כאן</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="border-border/50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="סנן מילות מפתח..."
              className="w-64"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-52"><SelectValue placeholder="כל הקטגוריות" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                {categories.map(c => (
                  <SelectItem key={`${c.type}:${c.value}`} value={`${c.type}:${c.value}`}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1" />
            {selectedIds.size > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handleRefreshMetrics} disabled={isRefreshing} className="gap-2">
                  {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  רענן נתונים ({selectedIds.size})
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  מחק ({selectedIds.size})
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
              <Download className="w-4 h-4" />
              CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead className="text-right">מילת מפתח</TableHead>
                  <TableHead className="text-right">קטגוריה</TableHead>
                  <TableHead className="text-right">נפח חיפוש</TableHead>
                  <TableHead className="text-right">תחרות</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                  <TableHead className="text-right">תגיות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(kw => (
                  <TableRow key={kw.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(kw.id)}
                        onChange={() => toggleSelect(kw.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{kw.keyword}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[kw.category_type] || kw.category_type}: {kw.category_value}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNum(kw.avg_monthly_searches)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("text-xs", competitionColors[kw.competition])}>
                        {competitionLabels[kw.competition] || kw.competition}
                      </Badge>
                    </TableCell>
                    <TableCell dir="ltr" className="text-right">
                      ₪{kw.low_bid.toFixed(2)} - ₪{kw.high_bid.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(kw.tags || []).slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
