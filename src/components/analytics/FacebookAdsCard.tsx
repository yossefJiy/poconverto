import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, RefreshCw, Loader2, TrendingUp, TrendingDown, DollarSign, Eye, MousePointer, Users, AlertCircle, Clock } from "lucide-react";
import { useAnalyticsSnapshot, formatSnapshotDate } from "@/hooks/useAnalyticsSnapshot";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FacebookAdsCardProps {
  globalDateFrom: Date | string;
  globalDateTo: Date | string;
  clientId?: string;
  isAdmin: boolean;
  onAddIntegration: () => void;
  onRefresh: () => void;
}

export function FacebookAdsCard({ globalDateFrom, globalDateTo, clientId, isAdmin, onAddIntegration, onRefresh }: FacebookAdsCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  const normalizeDate = (input: Date | string): string => {
    if (typeof input === "string") return input.split("T")[0];
    const year = input.getFullYear();
    const month = String(input.getMonth() + 1).padStart(2, "0");
    const day = String(input.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const startDate = normalizeDate(globalDateFrom);
  const endDate = normalizeDate(globalDateTo);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['facebook-ads', clientId, startDate, endDate],
    queryFn: async () => {
      if (!clientId) return null;

      const { data: responseData, error: functionError } = await supabase.functions.invoke('facebook-ads', {
        body: {
          clientId,
          startDate,
          endDate,
        }
      });

      if (functionError) {
        // Extract detailed error message from response
        const errorMessage = functionError.message || 'Failed to fetch Facebook Ads data';
        throw new Error(errorMessage);
      }

      // Check for error in response body
      if (responseData?.error) {
        throw new Error(responseData.error);
      }

      return responseData;
    },
    enabled: !!clientId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Fetch snapshot fallback
  const { data: snapshot } = useAnalyticsSnapshot(clientId, 'facebook_ads');

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (num: number) => `₪${num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  // Determine if we're using snapshot fallback
  const usingSnapshot = !data && error && !!snapshot;
  const effectiveData = data || (snapshot?.data as typeof data | undefined);
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Show error only if no snapshot fallback available
  if (error && !snapshot) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook Ads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-destructive">שגיאה בטעינת נתונים</p>
              <p className="text-sm text-muted-foreground mt-1 break-words">{errorMessage}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="flex-shrink-0">
              <RefreshCw className="w-4 h-4 ml-2" />
              נסה שנית
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="glass">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook Ads
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {usingSnapshot && snapshot && (
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    נתונים שמורים מ־{formatSnapshotDate(snapshot.updated_at)}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); refetch(); }}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : effectiveData ? (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <DollarSign className="w-4 h-4" />
                      הוצאה
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(effectiveData.totals?.cost || 0)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Eye className="w-4 h-4" />
                      חשיפות
                    </div>
                    <p className="text-2xl font-bold">{formatNumber(effectiveData.totals?.impressions || 0)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <MousePointer className="w-4 h-4" />
                      קליקים
                    </div>
                    <p className="text-2xl font-bold">{formatNumber(effectiveData.totals?.clicks || 0)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Users className="w-4 h-4" />
                      המרות
                    </div>
                    <p className="text-2xl font-bold">{formatNumber(effectiveData.totals?.conversions || 0)}</p>
                  </div>
                </div>

                {/* Daily Chart */}
                {effectiveData.daily && effectiveData.daily.length > 0 && (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.daily}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="cost" stroke="#1877F2" name="הוצאה" strokeWidth={2} />
                        <Line type="monotone" dataKey="clicks" stroke="#42B72A" name="קליקים" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Campaigns Table */}
                {effectiveData.campaigns && effectiveData.campaigns.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">קמפיינים ({effectiveData.campaigns.length})</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-right py-2 px-2">שם</th>
                            <th className="text-center py-2 px-2">סטטוס</th>
                            <th className="text-left py-2 px-2">הוצאה</th>
                            <th className="text-left py-2 px-2">קליקים</th>
                            <th className="text-left py-2 px-2">CTR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {effectiveData.campaigns.slice(0, 10).map((campaign: any) => (
                            <tr key={campaign.id} className="border-b border-muted/50">
                              <td className="py-2 px-2 font-medium">{campaign.name}</td>
                              <td className="py-2 px-2 text-center">
                                <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                  {campaign.status === 'ACTIVE' ? 'פעיל' : campaign.status}
                                </Badge>
                              </td>
                              <td className="py-2 px-2 text-left">{formatCurrency(campaign.cost)}</td>
                              <td className="py-2 px-2 text-left">{formatNumber(campaign.clicks)}</td>
                              <td className="py-2 px-2 text-left">{campaign.ctr?.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>אין נתונים זמינים</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
