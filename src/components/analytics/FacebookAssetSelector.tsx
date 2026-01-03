import { useState, forwardRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  Check, 
  AlertCircle, 
  Building2, 
  FileText, 
  Instagram,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  DollarSign,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdAccount {
  id: string;
  account_id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  amount_spent: string;
  business_name?: string;
  displayName: string;
  statusInfo: { label: string; color: string };
}

interface FacebookPage {
  id: string;
  name: string;
  category: string;
  fan_count: number;
  picture_url?: string;
  has_instagram: boolean;
}

interface InstagramAccount {
  id: string;
  username: string;
  followers_count: number;
  profile_picture_url: string;
  connected_page_id: string;
  connected_page_name: string;
}

interface DiscoveredAssets {
  user: { id: string; name: string };
  adAccounts: AdAccount[];
  pages: FacebookPage[];
  instagramAccounts: InstagramAccount[];
  summary: {
    totalAdAccounts: number;
    activeAdAccounts: number;
    totalPages: number;
    totalInstagramAccounts: number;
  };
}

interface SelectedAssets {
  adAccounts: string[];
  pages: string[];
  instagramAccounts: string[];
}

interface FacebookAssetSelectorProps {
  onAssetsSelected: (assets: SelectedAssets, accessToken: string) => void;
  onCancel: () => void;
}

export const FacebookAssetSelector = forwardRef<HTMLDivElement, FacebookAssetSelectorProps>(
  function FacebookAssetSelector({ onAssetsSelected, onCancel }, ref) {
  const [accessToken, setAccessToken] = useState("");
  const [discoveredAssets, setDiscoveredAssets] = useState<DiscoveredAssets | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<SelectedAssets>({
    adAccounts: [],
    pages: [],
    instagramAccounts: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    adAccounts: true,
    pages: true,
    instagram: true,
  });

  const discoverMutation = useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.functions.invoke('facebook-discover-assets', {
        body: { accessToken: token }
      });
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as DiscoveredAssets;
    },
    onSuccess: (data) => {
      setDiscoveredAssets(data);
      // Auto-select first active ad account
      const activeAccounts = data.adAccounts.filter(a => a.account_status === 1);
      if (activeAccounts.length > 0) {
        setSelectedAssets(prev => ({
          ...prev,
          adAccounts: [activeAccounts[0].id],
        }));
      }
    },
  });

  const handleDiscover = () => {
    if (!accessToken.trim()) return;
    discoverMutation.mutate(accessToken.trim());
  };

  const toggleAsset = (type: keyof SelectedAssets, id: string) => {
    setSelectedAssets(prev => {
      const current = prev[type];
      const updated = current.includes(id)
        ? current.filter(i => i !== id)
        : [...current, id];
      return { ...prev, [type]: updated };
    });
  };

  const handleConfirm = () => {
    if (selectedAssets.adAccounts.length === 0) return;
    onAssetsSelected(selectedAssets, accessToken);
  };

  const getStatusBadge = (status: number) => {
    const statusMap: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      1: { label: "פעיל", variant: "default" },
      2: { label: "מושבת", variant: "destructive" },
      3: { label: "לא מאושר", variant: "secondary" },
      7: { label: "ממתין לסקירה", variant: "outline" },
      9: { label: "בסקירה", variant: "outline" },
      100: { label: "סגור", variant: "destructive" },
      101: { label: "מוגבל", variant: "secondary" },
    };
    const info = statusMap[status] || { label: "לא ידוע", variant: "outline" as const };
    return <Badge variant={info.variant} className="text-[10px]">{info.label}</Badge>;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const filterAssets = <T extends { name?: string; username?: string; displayName?: string }>(
    assets: T[]
  ): T[] => {
    if (!searchQuery.trim()) return assets;
    const query = searchQuery.toLowerCase();
    return assets.filter(a => 
      (a.name?.toLowerCase().includes(query)) ||
      (a.username?.toLowerCase().includes(query)) ||
      (a.displayName?.toLowerCase().includes(query))
    );
  };

  // Step 1: Token Input
  if (!discoveredAssets) {
    return (
      <div className="space-y-6">
        <Alert className="border-blue-500/50 bg-blue-500/5">
          <Building2 className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-sm">חיבור אוטומטי לנכסי Facebook</AlertTitle>
          <AlertDescription className="text-xs">
            הזן Access Token ואנחנו נשלוף אוטומטית את כל הנכסים שלך: חשבונות מודעות, עמודים ואינסטגרם
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            Access Token <Badge variant="destructive" className="text-[10px]">חובה</Badge>
          </Label>
          <Input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="EAAxxxxxxx..."
            dir="ltr"
            className="text-left font-mono text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleDiscover()}
          />
          <p className="text-xs text-muted-foreground">
            צור ב-Graph API Explorer עם הרשאות: ads_read, pages_read_engagement, instagram_basic
          </p>
        </div>

        {discoverMutation.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription className="text-xs">
              {(discoverMutation.error as Error).message}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            ביטול
          </Button>
          <Button 
            onClick={handleDiscover} 
            disabled={!accessToken.trim() || discoverMutation.isPending}
            className="flex-1"
          >
            {discoverMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                מחפש נכסים...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                חפש נכסים
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Asset Selection
  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Alert className="border-green-500/50 bg-green-500/5">
        <Check className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-sm">נמצאו {discoveredAssets.summary.totalAdAccounts + discoveredAssets.summary.totalPages} נכסים</AlertTitle>
        <AlertDescription className="text-xs">
          מחובר בתור: <strong>{discoveredAssets.user.name}</strong>
          <span className="mx-2">•</span>
          {discoveredAssets.summary.activeAdAccounts} חשבונות פעילים
          <span className="mx-2">•</span>
          {discoveredAssets.summary.totalPages} עמודים
          <span className="mx-2">•</span>
          {discoveredAssets.summary.totalInstagramAccounts} אינסטגרם
        </AlertDescription>
      </Alert>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חפש נכסים..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      <ScrollArea className="h-[350px] pr-3">
        <div className="space-y-4">
          {/* Ad Accounts */}
          <Collapsible 
            open={expandedSections.adAccounts}
            onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, adAccounts: open }))}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/50 hover:bg-muted">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">חשבונות מודעות</span>
                <Badge variant="secondary" className="text-[10px]">
                  {selectedAssets.adAccounts.length}/{discoveredAssets.adAccounts.length}
                </Badge>
              </div>
              {expandedSections.adAccounts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              {filterAssets(discoveredAssets.adAccounts).map(account => (
                <label
                  key={account.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedAssets.adAccounts.includes(account.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Checkbox
                    checked={selectedAssets.adAccounts.includes(account.id)}
                    onCheckedChange={() => toggleAsset('adAccounts', account.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{account.displayName}</span>
                      {getStatusBadge(account.account_status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {account.currency}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatNumber(parseFloat(account.amount_spent) / 100)} הוצאות
                      </span>
                    </div>
                  </div>
                </label>
              ))}
              {filterAssets(discoveredAssets.adAccounts).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">לא נמצאו חשבונות מודעות</p>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Pages */}
          <Collapsible 
            open={expandedSections.pages}
            onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, pages: open }))}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/50 hover:bg-muted">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-sm">עמודי פייסבוק</span>
                <Badge variant="secondary" className="text-[10px]">
                  {selectedAssets.pages.length}/{discoveredAssets.pages.length}
                </Badge>
              </div>
              {expandedSections.pages ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 space-y-2">
              {filterAssets(discoveredAssets.pages).map(page => (
                <label
                  key={page.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedAssets.pages.includes(page.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Checkbox
                    checked={selectedAssets.pages.includes(page.id)}
                    onCheckedChange={() => toggleAsset('pages', page.id)}
                  />
                  {page.picture_url && (
                    <img src={page.picture_url} alt="" className="w-8 h-8 rounded-full" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{page.name}</span>
                      {page.has_instagram && (
                        <Badge variant="outline" className="text-[10px]">
                          <Instagram className="w-3 h-3 mr-1" />
                          IG
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{page.category}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {formatNumber(page.fan_count)} עוקבים
                      </span>
                    </div>
                  </div>
                </label>
              ))}
              {filterAssets(discoveredAssets.pages).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">לא נמצאו עמודים</p>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Instagram */}
          {discoveredAssets.instagramAccounts.length > 0 && (
            <Collapsible 
              open={expandedSections.instagram}
              onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, instagram: open }))}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/50 hover:bg-muted">
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  <span className="font-medium text-sm">אינסטגרם</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedAssets.instagramAccounts.length}/{discoveredAssets.instagramAccounts.length}
                  </Badge>
                </div>
                {expandedSections.instagram ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                {filterAssets(discoveredAssets.instagramAccounts).map(account => (
                  <label
                    key={account.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedAssets.instagramAccounts.includes(account.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Checkbox
                      checked={selectedAssets.instagramAccounts.includes(account.id)}
                      onCheckedChange={() => toggleAsset('instagramAccounts', account.id)}
                    />
                    {account.profile_picture_url && (
                      <img src={account.profile_picture_url} alt="" className="w-8 h-8 rounded-full" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">@{account.username}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {formatNumber(account.followers_count)} עוקבים
                        </span>
                        <span>מחובר ל: {account.connected_page_name}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button 
          variant="outline" 
          onClick={() => {
            setDiscoveredAssets(null);
            setSelectedAssets({ adAccounts: [], pages: [], instagramAccounts: [] });
          }}
          className="flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          התחל מחדש
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          ביטול
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={selectedAssets.adAccounts.length === 0}
          className="flex-1"
        >
          <Check className="w-4 h-4 mr-2" />
          חבר {selectedAssets.adAccounts.length} נכסים
        </Button>
      </div>
    </div>
  );
});
