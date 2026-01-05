import { useImpersonation } from '@/hooks/useImpersonation';
import { Button } from '@/components/ui/button';
import { Eye, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUser, stopImpersonation } = useImpersonation();

  if (!isImpersonating || !impersonatedUser) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5" />
          <span className="font-medium">מצב התחזות פעיל</span>
          <Badge variant="secondary" className="bg-amber-600 text-white">
            {impersonatedUser.name}
          </Badge>
          {impersonatedUser.clientName && (
            <Badge variant="outline" className="border-amber-700 text-amber-950">
              {impersonatedUser.clientName}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={stopImpersonation}
          className="text-amber-950 hover:bg-amber-600/20"
        >
          <X className="h-4 w-4 ml-2" />
          יציאה מהתחזות
        </Button>
      </div>
    </div>
  );
}
