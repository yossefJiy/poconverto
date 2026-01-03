import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnalyticsPlatformNav } from "@/components/analytics/AnalyticsPlatformNav";
import { GlobalDateFilter, getDateRangeFromFilter, type DateFilterValue } from "@/components/analytics/GlobalDateFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useClient } from "@/hooks/useClient";
import { ArrowRight, RefreshCw, DollarSign, Eye, MousePointer, Users, Building2, FileText } from "lucide-react";

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("he-IL");
}

function formatCurrency(num: number | undefined | null): string {
  return "₪" + formatNumber(num);
}

type IntegrationRow = {
  id: string;
  external_account_id: string | null;
  settings: any;
  is_connected: boolean;
};

export default function MetaSummary() {
  const navigate = useNavigate();
  const { selectedClient } = useClient();
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("30");
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>();

  const dateRange = getDateRangeFromFilter(dateFilter, customDateRange);

  const integrationsQuery = useQuery({
    queryKey: ["meta-integrations", selectedClient?.id],
    queryFn: async (): Promise<IntegrationRow[]> => {
      const { data, error } = await supabase
        .from("integrations")
        .select("id, external_account_id, settings, is_connected")
        .eq("client_id", selectedClient!.id)
        .eq("platform", "facebook_ads")
        .eq("is_connected", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as IntegrationRow[];
    },
    enabled: !!selectedClient?.id,
    staleTime: 60_000,
  });

  const adsQuery = useQuery({
    queryKey: ["meta-ads-summary", selectedClient?.id, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("facebook-ads", {
        body: {
          clientId: selectedClient?.id,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClient?.id,
    staleTime: 5 * 60 * 1000,
  });

  const totals = adsQuery.data?.totals || { cost: 0, impressions: 0, clicks: 0, conversions: 0 };
  const accounts = adsQuery.data?.accounts || [];

  const assets = useMemo(() => {
    const rows = integrationsQuery.data || [];

    const uniqById = <T extends { id: string }>(items: T[]): T[] => {
      const map = new Map<string, T>();
      for (const item of items) map.set(item.id, item);
      return Array.from(map.values());
    };

    const pages = uniqById(
      rows.flatMap((r) => {
        const s = r.settings || {};
        if (Array.isArray(s.pages) && s.pages.length > 0) return s.pages;
        if (Array.isArray(s.selected_pages) && s.selected_pages.length > 0) {
          return s.selected_pages.map((id: string) => ({ id }));
        }
        return [];
      })
    );

    const instagram = uniqById(
      rows.flatMap((r) => {
        const s = r.settings || {};
        if (Array.isArray(s.instagram_accounts) && s.instagram_accounts.length > 0) return s.instagram_accounts;
        if (Array.isArray(s.selected_instagram) && s.selected_instagram.length > 0) {
          return s.selected_instagram.map((id: string) => ({ id }));
        }
        return [];
      })
    );

    const pixels = uniqById(
      rows.flatMap((r) => {
        const s = r.settings || {};
        if (Array.isArray(s.pixels) && s.pixels.length > 0) return s.pixels;
        if (Array.isArray(s.selected_pixels) && s.selected_pixels.length > 0) {
          return s.selected_pixels.map((id: string) => ({ id }));
        }
        return [];
      })
    );

    const catalogs = uniqById(
      rows.flatMap((r) => {
        const s = r.settings || {};
        if (Array.isArray(s.catalogs) && s.catalogs.length > 0) return s.catalogs;
        if (Array.isArray(s.selected_catalogs) && s.selected_catalogs.length > 0) {
          return s.selected_catalogs.map((id: string) => ({ id }));
        }
        return [];
      })
    );

    return { pages, instagram, pixels, catalogs };
  }, [integrationsQuery.data]);

  if (!selectedClient) {
    return (
      <MainLayout>
        <div className="p-8 text-center">בחר לקוח כדי לצפות בסיכום Meta</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/analytics")}
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
            <AnalyticsPlatformNav />
          </div>

          <div className="flex items-center gap-2">
            <GlobalDateFilter
              value={dateFilter}
              onChange={setDateFilter}
              customDateRange={customDateRange}
              onCustomDateChange={setCustomDateRange}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                adsQuery.refetch();
                integrationsQuery.refetch();
              }}
              disabled={adsQuery.isFetching || integrationsQuery.isFetching}
            >
              <RefreshCw className={"w-4 h-4 " + (adsQuery.isFetching || integrationsQuery.isFetching ? "animate-spin" : "")}
              />
            </Button>
          </div>
        </div>

        <PageHeader title="Meta (סיכום)" description={`סקירה מרוכזת • ${selectedClient.name}`} />

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <DollarSign className="w-4 h-4" /> הוצאה
              </div>
              <div className="text-2xl font-bold">{formatCurrency(totals.cost)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Eye className="w-4 h-4" /> חשיפות
              </div>
              <div className="text-2xl font-bold">{formatNumber(totals.impressions)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <MousePointer className="w-4 h-4" /> קליקים
              </div>
              <div className="text-2xl font-bold">{formatNumber(totals.clicks)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Users className="w-4 h-4" /> המרות
              </div>
              <div className="text-2xl font-bold">{formatNumber(totals.conversions)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> חשבונות מודעות ({accounts.length})
                </span>
                {integrationsQuery.data && integrationsQuery.data.length > 0 && (
                  <Badge variant="secondary">מחוברים: {integrationsQuery.data.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {adsQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">טוען...</div>
              ) : accounts.length === 0 ? (
                <div className="text-sm text-muted-foreground">אין נתוני חשבונות לתצוגה</div>
              ) : (
                <div className="space-y-2">
                  {accounts.map((a: any) => (
                    <div key={a.ad_account_id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{a.account_name || a.ad_account_id}</div>
                        <div className="text-xs text-muted-foreground">{a.ad_account_id}</div>
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{formatCurrency(a.cost)}</div>
                        <div className="text-xs text-muted-foreground">{formatNumber(a.clicks)} קליקים</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4" /> נכסים מחוברים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-3">
                עמודים: {assets.pages.length} • אינסטגרם: {assets.instagram.length} • פיקסלים: {assets.pixels.length} • קטלוגים: {assets.catalogs.length}
              </div>

              <Separator className="my-3" />

              <ScrollArea className="h-[260px] pr-3">
                <div className="space-y-4">
                  {assets.pages.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">עמודים</div>
                      <div className="space-y-2">
                        {assets.pages.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between p-2 rounded border bg-card">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{p.name || p.id}</div>
                              <div className="text-xs text-muted-foreground">{p.category || ""}</div>
                            </div>
                            {p.fan_count ? <Badge variant="outline">{p.fan_count.toLocaleString()} עוקבים</Badge> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {assets.instagram.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">אינסטגרם</div>
                      <div className="space-y-2">
                        {assets.instagram.map((ig: any) => (
                          <div key={ig.id} className="flex items-center justify-between p-2 rounded border bg-card">
                            <div className="text-sm font-medium">@{ig.username || ig.id}</div>
                            {ig.followers_count ? <Badge variant="outline">{ig.followers_count.toLocaleString()} עוקבים</Badge> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(assets.pixels.length > 0 || assets.catalogs.length > 0) && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2">טכני</div>
                      <div className="space-y-2">
                        {assets.pixels.map((px: any) => (
                          <div key={px.id} className="flex items-center justify-between p-2 rounded border bg-card">
                            <div className="text-sm font-medium truncate">{px.name || px.id}</div>
                            <Badge variant="secondary">Pixel</Badge>
                          </div>
                        ))}
                        {assets.catalogs.map((cat: any) => (
                          <div key={cat.id} className="flex items-center justify-between p-2 rounded border bg-card">
                            <div className="text-sm font-medium truncate">{cat.name || cat.id}</div>
                            {cat.product_count ? <Badge variant="outline">{cat.product_count} מוצרים</Badge> : <Badge variant="secondary">Catalog</Badge>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/analytics/facebook-ads")}>פתח נתוני Ads (מפורט)</Button>
          <Button onClick={() => navigate("/settings")}>ניהול אינטגרציות</Button>
        </div>
      </div>
    </MainLayout>
  );
}
