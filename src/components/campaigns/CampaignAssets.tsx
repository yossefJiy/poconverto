import { useState } from "react";
import { ChevronDown, ChevronUp, Users, Image, Video, FileText, Target, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdSet {
  id: string;
  name: string;
  status?: string;
  targeting?: string;
  budget?: number;
  impressions?: number;
  clicks?: number;
}

interface Ad {
  id: string;
  name: string;
  status?: string;
  creative_type?: string;
  impressions?: number;
  clicks?: number;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  url?: string;
}

interface CampaignAssetsProps {
  adSets?: AdSet[];
  ads?: Ad[];
  assets?: Asset[];
  audiences?: string[];
  platform: 'google_ads' | 'facebook_ads' | 'internal';
}

export function CampaignAssets({ adSets = [], ads = [], assets = [], audiences = [], platform }: CampaignAssetsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasContent = adSets.length > 0 || ads.length > 0 || assets.length > 0 || audiences.length > 0;
  
  if (!hasContent) return null;

  const getAssetIcon = (type?: string) => {
    switch ((type || '').toLowerCase()) {
      case 'image':
      case 'square_marketing_image':
      case 'marketing_image':
        return <Image className="w-3.5 h-3.5" />;
      case 'video':
      case 'youtube_video':
        return <Video className="w-3.5 h-3.5" />;
      case 'text':
      case 'headline':
      case 'description':
        return <FileText className="w-3.5 h-3.5" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>נכסי קמפיין</span>
          <div className="flex items-center gap-2 mr-auto">
            {adSets.length > 0 && (
              <Badge variant="secondary" className="text-xs py-0 h-5">
                {adSets.length} {platform === 'facebook_ads' ? 'סדרות מודעות' : 'קבוצות מודעות'}
              </Badge>
            )}
            {ads.length > 0 && (
              <Badge variant="secondary" className="text-xs py-0 h-5">
                {ads.length} מודעות
              </Badge>
            )}
            {assets.length > 0 && (
              <Badge variant="secondary" className="text-xs py-0 h-5">
                {assets.length} נכסים
              </Badge>
            )}
            {audiences.length > 0 && (
              <Badge variant="secondary" className="text-xs py-0 h-5">
                {audiences.length} קהלים
              </Badge>
            )}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-3 space-y-4">
          {/* Ad Sets / Ad Groups */}
          {adSets.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                {platform === 'facebook_ads' ? 'סדרות מודעות' : 'קבוצות מודעות'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {adSets.slice(0, 6).map((adSet) => (
                  <div 
                    key={adSet.id} 
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                  >
                    <span className="truncate flex-1">{adSet.name}</span>
                    {adSet.status && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs py-0 h-5 mr-2",
                          adSet.status === 'ENABLED' || adSet.status === 'ACTIVE' 
                            ? "bg-success/10 text-success" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {adSet.status === 'ENABLED' || adSet.status === 'ACTIVE' ? 'פעיל' : 'מושהה'}
                      </Badge>
                    )}
                  </div>
                ))}
                {adSets.length > 6 && (
                  <div className="text-xs text-muted-foreground p-2">
                    +{adSets.length - 6} נוספים...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ads */}
          {ads.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5" />
                מודעות
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ads.slice(0, 6).map((ad) => (
                  <div 
                    key={ad.id} 
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                  >
                    <span className="truncate flex-1">{ad.name}</span>
                    <div className="flex items-center gap-2">
                      {ad.creative_type && (
                        <span className="text-xs text-muted-foreground">{ad.creative_type}</span>
                      )}
                      {ad.status && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs py-0 h-5",
                            ad.status === 'ENABLED' || ad.status === 'ACTIVE' 
                              ? "bg-success/10 text-success" 
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {ad.status === 'ENABLED' || ad.status === 'ACTIVE' ? 'פעיל' : 'מושהה'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {ads.length > 6 && (
                  <div className="text-xs text-muted-foreground p-2">
                    +{ads.length - 6} נוספות...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assets */}
          {assets.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                נכסים
              </h4>
              <div className="flex flex-wrap gap-2">
                {assets.slice(0, 10).map((asset) => (
                  <Badge 
                    key={asset.id} 
                    variant="outline" 
                    className="text-xs py-1 px-2 flex items-center gap-1"
                  >
                    {getAssetIcon(asset.type)}
                    <span className="truncate max-w-[120px]">{asset.name || asset.type}</span>
                  </Badge>
                ))}
                {assets.length > 10 && (
                  <Badge variant="secondary" className="text-xs py-1 px-2">
                    +{assets.length - 10} נוספים
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Audiences */}
          {audiences.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                קהלים
              </h4>
              <div className="flex flex-wrap gap-2">
                {audiences.slice(0, 8).map((audience, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs py-1 px-2"
                  >
                    {audience}
                  </Badge>
                ))}
                {audiences.length > 8 && (
                  <Badge variant="secondary" className="text-xs py-1 px-2">
                    +{audiences.length - 8} נוספים
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
