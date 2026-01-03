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
  Target,
  Package,
  Clock,
  AlertTriangle,
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
  instagram_id?: string;
}

interface InstagramAccount {
  id: string;
  username: string;
  name?: string;
  followers_count: number;
  profile_picture_url: string;
  connected_page_id: string;
  connected_page_name: string;
}

interface Pixel {
  id: string;
  name: string;
  last_fired_time?: string;
  is_created_by_business?: boolean;
  ad_account_id?: string;
}

interface ProductCatalog {
  id: string;
  name: string;
  product_count?: number;
  ad_account_id?: string;
}

interface DiscoveredAssets {
  user: { id: string; name: string };
  adAccounts: AdAccount[];
  pages: FacebookPage[];
  instagramAccounts: InstagramAccount[];
  pixels: Pixel[];
  catalogs: ProductCatalog[];
  tokenInfo?: {
    expires_at: string | null;
    is_valid: boolean;
  };
  summary: {
    totalAdAccounts: number;
    activeAdAccounts: number;
    totalPages: number;
    totalInstagramAccounts: number;
    totalPixels: number;
    totalCatalogs: number;
  };
}

interface SelectedAssets {
  adAccounts: string[];
  pages: string[];
  instagramAccounts: string[];
  pixels: string[];
  catalogs: string[];
}

interface FacebookAssetSelectorProps {
  onAssetsSelected: (assets: SelectedAssets, accessToken: string, assetsData?: any) => void;
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
    pixels: [],
    catalogs: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    adAccounts: true,
    pages: true,
    instagram: true,
    pixels: false,
    catalogs: false,
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
      // Expand pixels/catalogs sections if they have data
      if (data.pixels?.length > 0) {
        setExpandedSections(prev => ({ ...prev, pixels: true }));
      }
      if (data.catalogs?.length > 0) {
        setExpandedSections(prev => ({ ...prev, catalogs: true }));
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
    if (selectedAssets.adAccounts.length === 0 || !discoveredAssets) return;
    
    // Build assets data with full details
    const assetsData = {
      pages: discoveredAssets.pages
        .filter(p => selectedAssets.pages.includes(p.id))
        .map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          fan_count: p.fan_count,
          picture_url: p.picture_url,
        })),
      instagram: discoveredAssets.instagramAccounts
        .filter(ig => selectedAssets.instagramAccounts.includes(ig.id))
        .map(ig => ({
          id: ig.id,
          username: ig.username,
          name: ig.name,
          followers_count: ig.followers_count,
        })),
      pixels: (discoveredAssets.pixels || [])
        .filter(px => selectedAssets.pixels.includes(px.id))
        .map(px => ({
          id: px.id,
          name: px.name,
          last_fired_time: px.last_fired_time,
        })),
      catalogs: (discoveredAssets.catalogs || [])
        .filter(cat => selectedAssets.catalogs.includes(cat.id))
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          product_count: cat.product_count,
        })),
      token_expires_at: discoveredAssets.tokenInfo?.expires_at || null,
    };
    
    onAssetsSelected(selectedAssets, accessToken, assetsData);
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

  // Calculate days until token expiry
  const getDaysUntilExpiry = (): number | null => {
    if (!discoveredAssets?.tokenInfo?.expires_at) return null;
    const expiryDate = new Date(discoveredAssets.tokenInfo.expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilExpiry = discoveredAssets ? getDaysUntilExpiry() : null;

  // Step 1: Token Input
  if (!discoveredAssets) {
    return (
      <div className="space-y-6">
        <Alert className="border-blue-500/50 bg-blue-500/5">
          <Building2 className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-sm">חיבור אוטומטי לנכסי Facebook</AlertTitle>
          <AlertDescription className="text-xs">
            הזן Access Token ואנחנו נשלוף אוטומטית את כל הנכסים שלך: חשבונות מודעות, עמודים, אינסטגרם, פיקסלים וקטלוגים
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
            צור ב-Graph API Explorer עם הרשאות: ads_read, pages_read_engagement, instagram_basic, business_management
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
        <AlertTitle className="text-sm">
          נמצאו {discoveredAssets.summary.totalAdAccounts + discoveredAssets.summary.totalPages + (discoveredAssets.summary.totalPixels || 0) + (discoveredAssets.summary.totalCatalogs || 0)} נכסים
        </AlertTitle>
        <AlertDescription className="text-xs">
          מחובר בתור: <strong>{discoveredAssets.user.name}</strong>
          <span className="mx-2">•</span>
          {discoveredAssets.summary.activeAdAccounts} חשבונות פעילים
          <span className="mx-2">•</span>
          {discoveredAssets.summary.totalPages} עמודים
          <span className="mx-2">•</span>
          {discoveredAssets.summary.totalInstagramAccounts} אינסטגרם
          {discoveredAssets.summary.totalPixels > 0 && (
            <>
              <span className="mx-2">•</span>
              {discoveredAssets.summary.totalPixels} פיקסלים
            </>
          )}
          {discoveredAssets.summary.totalCatalogs > 0 && (
            <>
              <span className="mx-2">•</span>
              {discoveredAssets.summary.totalCatalogs} קטלוגים
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Token expiry warning */}
      {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
        <Alert variant={daysUntilExpiry <= 3 ? "destructive" : "default"} className="py-2">
          <Clock className="h-4 w-4" />
          <AlertDescription className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            הטוקן יפוג בעוד {daysUntilExpiry} ימים. מומלץ ליצור Long-Lived Token חדש.
          </AlertDescription>
        </Alert>
      )}

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
                      <span className="font-medium text-sm">@{account.username || account.name}</span>
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

          {/* Pixels */}
          {discoveredAssets.pixels && discoveredAssets.pixels.length > 0 && (
            <Collapsible 
              open={expandedSections.pixels}
              onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, pixels: open }))}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/50 hover:bg-muted">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-sm">פיקסלים</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedAssets.pixels.length}/{discoveredAssets.pixels.length}
                  </Badge>
                </div>
                {expandedSections.pixels ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                {filterAssets(discoveredAssets.pixels).map(pixel => (
                  <label
                    key={pixel.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedAssets.pixels.includes(pixel.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Checkbox
                      checked={selectedAssets.pixels.includes(pixel.id)}
                      onCheckedChange={() => toggleAsset('pixels', pixel.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{pixel.name}</span>
                        {pixel.is_created_by_business && (
                          <Badge variant="outline" className="text-[10px]">עסקי</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>ID: {pixel.id}</span>
                        {pixel.last_fired_time && (
                          <span>• אחרון: {new Date(pixel.last_fired_time).toLocaleDateString('he-IL')}</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Catalogs */}
          {discoveredAssets.catalogs && discoveredAssets.catalogs.length > 0 && (
            <Collapsible 
              open={expandedSections.catalogs}
              onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, catalogs: open }))}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg bg-muted/50 hover:bg-muted">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  <span className="font-medium text-sm">קטלוגים</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedAssets.catalogs.length}/{discoveredAssets.catalogs.length}
                  </Badge>
                </div>
                {expandedSections.catalogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                {filterAssets(discoveredAssets.catalogs).map(catalog => (
                  <label
                    key={catalog.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedAssets.catalogs.includes(catalog.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Checkbox
                      checked={selectedAssets.catalogs.includes(catalog.id)}
                      onCheckedChange={() => toggleAsset('catalogs', catalog.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm truncate">{catalog.name}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>ID: {catalog.id}</span>
                        {catalog.product_count !== undefined && (
                          <span>• {formatNumber(catalog.product_count)} מוצרים</span>
                        )}
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
            setSelectedAssets({ adAccounts: [], pages: [], instagramAccounts: [], pixels: [], catalogs: [] });
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
