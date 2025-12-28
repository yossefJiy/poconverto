import { Globe, Instagram, Facebook, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// TikTok icon component
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

interface ClientLinksCardProps {
  website?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
}

export function ClientLinksCard({ website, instagram_url, facebook_url, tiktok_url }: ClientLinksCardProps) {
  const hasLinks = website || instagram_url || facebook_url || tiktok_url;
  
  if (!hasLinks) return null;

  return (
    <Card className="glass border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="w-4 h-4 text-primary" />
          קישורים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {website && (
          <a 
            href={website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
          >
            <Globe className="w-4 h-4 text-primary" />
            <span className="flex-1 truncate">{website.replace(/^https?:\/\//, "")}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        )}
        
        {instagram_url && (
          <a 
            href={instagram_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-colors text-sm"
          >
            <Instagram className="w-4 h-4 text-pink-500" />
            <span className="flex-1">Instagram</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        )}
        
        {facebook_url && (
          <a 
            href={facebook_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 rounded-lg bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-colors text-sm"
          >
            <Facebook className="w-4 h-4 text-[#1877F2]" />
            <span className="flex-1">Facebook</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        )}
        
        {tiktok_url && (
          <a 
            href={tiktok_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-colors text-sm"
          >
            <TikTokIcon className="w-4 h-4" />
            <span className="flex-1">TikTok</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
