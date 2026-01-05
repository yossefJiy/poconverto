import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonation } from '@/hooks/useImpersonation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Eye, Search, User } from 'lucide-react';
import { ROLE_LABELS } from '@/hooks/useAuth';

interface UserForImpersonation {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function UserImpersonationSelector() {
  const { canImpersonate, startImpersonation, isImpersonating } = useImpersonation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserForImpersonation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('authorized_emails')
        .select('id, email, name, role')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleImpersonate = async (userId: string) => {
    await startImpersonation(userId);
    setOpen(false);
  };

  if (!canImpersonate || isImpersonating) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          התחזות למשתמש
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>בחר משתמש להתחזות</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם או אימייל..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">טוען...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">לא נמצאו משתמשים</div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleImpersonate(user.id)}
                  className="w-full p-3 rounded-lg border hover:bg-accent transition-colors text-right flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{user.name || user.email}</div>
                    {user.name && (
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
