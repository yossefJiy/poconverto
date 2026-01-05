// Social Accounts Manager Component

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Link2, 
  Link2Off,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string | null;
  account_url: string | null;
  is_active: boolean;
  last_sync_at: string | null;
}

interface SocialAccountsManagerProps {
  accounts: SocialAccount[];
  onConnect: (platform: string) => void;
  onDisconnect: (accountId: string) => void;
  onSync: (accountId: string) => void;
}

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-tr from-purple-600 to-pink-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'bg-black' },
];

export function SocialAccountsManager({ 
  accounts, 
  onConnect, 
  onDisconnect, 
  onSync 
}: SocialAccountsManagerProps): React.JSX.Element {
  const [syncing, setSyncing] = useState<string | null>(null);

  const getAccountForPlatform = (platformId: string) => {
    return accounts.find(a => a.platform === platformId && a.is_active);
  };

  const handleSync = async (accountId: string) => {
    setSyncing(accountId);
    try {
      await onSync(accountId);
      toast.success('הנתונים סונכרנו בהצלחה');
    } catch {
      toast.error('שגיאה בסנכרון');
    } finally {
      setSyncing(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          חשבונות מחוברים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {PLATFORMS.map((platform) => {
          const account = getAccountForPlatform(platform.id);
          const Icon = platform.icon;

          return (
            <div
              key={platform.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg text-white ${platform.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{platform.name}</div>
                  {account ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      {account.account_name || 'מחובר'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <XCircle className="h-3 w-3 text-destructive" />
                      לא מחובר
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {account ? (
                  <>
                    {account.account_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(account.account_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSync(account.id)}
                      disabled={syncing === account.id}
                    >
                      <RefreshCw className={`h-4 w-4 ${syncing === account.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDisconnect(account.id)}
                    >
                      <Link2Off className="h-4 w-4 ml-1" />
                      נתק
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onConnect(platform.id)}
                  >
                    <Link2 className="h-4 w-4 ml-1" />
                    חבר
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t text-sm text-muted-foreground">
          {accounts.filter(a => a.is_active).length} חשבונות מחוברים מתוך {PLATFORMS.length}
        </div>
      </CardContent>
    </Card>
  );
}
