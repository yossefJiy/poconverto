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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      
      setLoading(false);
    });

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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
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
