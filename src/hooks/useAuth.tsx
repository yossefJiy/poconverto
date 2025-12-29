import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = 'admin' | 'manager' | 'department_head' | 'team_lead' | 'team_member' | 'client' | 'demo';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Clean up a potentially invalid session from localStorage
 */
const cleanupInvalidSession = async () => {
  try {
    await supabase.auth.signOut();
  } catch {
    // Fallback: clear localStorage directly
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
    if (projectId) {
      try {
        localStorage.removeItem(`sb-${projectId}-auth-token`);
        localStorage.removeItem(`sb-${projectId}-auth-token-code-verifier`);
      } catch {
        // Ignore localStorage errors
      }
    }
  }
};

/**
 * Check if an error indicates an invalid session
 */
const isSessionInvalidError = (error: any): boolean => {
  if (!error) return false;
  const message = error.message || String(error);
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('session not found') ||
    lowerMessage.includes('session_not_found') ||
    lowerMessage.includes('auth session missing') ||
    lowerMessage.includes('jwt expired') ||
    lowerMessage.includes('invalid refresh token') ||
    lowerMessage.includes('refresh_token_not_found')
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Defer role fetching to avoid deadlock
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserRole(currentSession.user.id);
          }, 0);
        } else {
          setRole(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session and validate it against the server
    const initializeAuth = async () => {
      try {
        const { data: { session: localSession } } = await supabase.auth.getSession();
        
        if (localSession) {
          // Validate session against server with getUser()
          const { data: { user: validatedUser }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !validatedUser) {
            // Session exists locally but is invalid on server
            console.warn('Invalid session detected, cleaning up...');
            await cleanupInvalidSession();
            setSession(null);
            setUser(null);
            setRole(null);
          } else {
            // Session is valid
            setSession(localSession);
            setUser(validatedUser);
            fetchUserRole(validatedUser.id);
          }
        } else {
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error validating session:', error);
        if (isSessionInvalidError(error)) {
          await cleanupInvalidSession();
        }
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return;
      }

      if (data) {
        setRole(data.role as AppRole);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const signOut = async () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
    const storageKey = projectId ? `sb-${projectId}-auth-token` : null;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch {
      // Fallback: force-clear local session to prevent redirect loops/flicker if network revoke fails
      try {
        if (storageKey) {
          localStorage.removeItem(storageKey);
          localStorage.removeItem(`${storageKey}-code-verifier`);
        }
      } catch {
        // ignore
      }
    } finally {
      setUser(null);
      setSession(null);
      setRole(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper hook to check permissions
export const usePermissions = () => {
  const { role } = useAuth();
  
  const roleHierarchy: AppRole[] = ['admin', 'manager', 'department_head', 'team_lead', 'team_member', 'client', 'demo'];
  
  const hasRoleLevel = (minRole: AppRole): boolean => {
    if (!role) return false;
    const userRoleIndex = roleHierarchy.indexOf(role);
    const minRoleIndex = roleHierarchy.indexOf(minRole);
    return userRoleIndex <= minRoleIndex;
  };

  return {
    isAdmin: role === 'admin',
    isManager: hasRoleLevel('manager'),
    isDepartmentHead: hasRoleLevel('department_head'),
    isTeamLead: hasRoleLevel('team_lead'),
    isTeamMember: hasRoleLevel('team_member'),
    isClient: role === 'client',
    isDemo: role === 'demo',
    hasRoleLevel,
    role,
  };
};
