import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ImpersonatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  clientId?: string;
  clientName?: string;
}

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonatedUser: ImpersonatedUser | null;
  startImpersonation: (userId: string) => Promise<void>;
  stopImpersonation: () => void;
  canImpersonate: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { user, role } = useAuth();
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);

  // Only super_admin and admin can impersonate
  const canImpersonate = role === 'super_admin' || role === 'admin';

  const startImpersonation = useCallback(async (targetUserId: string) => {
    if (!canImpersonate || !user) {
      toast.error('אין לך הרשאה להתחזות למשתמש אחר');
      return;
    }

    try {
      // Log the impersonation action
      await supabase.from('user_impersonation_log').insert({
        admin_user_id: user.id,
        target_user_id: targetUserId,
        reason: 'Admin impersonation'
      });

      // Fetch target user info
      const { data: userData, error: userError } = await supabase
        .from('authorized_emails')
        .select('email, name, role')
        .eq('id', targetUserId)
        .single();

      if (userError || !userData) {
        toast.error('לא נמצא משתמש');
        return;
      }

      // Check for client access
      const { data: clientAccess } = await supabase
        .from('client_user_access')
        .select('client_id, clients(name)')
        .eq('user_id', targetUserId)
        .limit(1)
        .maybeSingle();

      setImpersonatedUser({
        id: targetUserId,
        email: userData.email,
        name: userData.name || userData.email,
        role: userData.role,
        clientId: clientAccess?.client_id || undefined,
        clientName: (clientAccess?.clients as { name: string } | null)?.name || undefined,
      });

      toast.success(`התחזות למשתמש: ${userData.name || userData.email}`);
    } catch (error) {
      console.error('Error starting impersonation:', error);
      toast.error('שגיאה בהתחזות');
    }
  }, [canImpersonate, user]);

  const stopImpersonation = useCallback(async () => {
    if (impersonatedUser && user) {
      // Update the log with ended_at
      await supabase
        .from('user_impersonation_log')
        .update({ ended_at: new Date().toISOString() })
        .eq('admin_user_id', user.id)
        .eq('target_user_id', impersonatedUser.id)
        .is('ended_at', null);
    }

    setImpersonatedUser(null);
    toast.info('יצאת ממצב התחזות');
  }, [impersonatedUser, user]);

  return (
    <ImpersonationContext.Provider value={{
      isImpersonating: !!impersonatedUser,
      impersonatedUser,
      startImpersonation,
      stopImpersonation,
      canImpersonate,
    }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
