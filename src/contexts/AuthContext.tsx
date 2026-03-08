import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'operacional' | 'gestor' | 'interprete';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  profile: { full_name: string; email: string | null } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, role: null, profile: null, loading: true, signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    const [{ data: roleData }, { data: profileData }] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId).limit(1).single(),
      supabase.from('profiles').select('full_name, email').eq('id', userId).single(),
    ]);
    if (roleData) setRole(roleData.role as AppRole);
    if (profileData) setProfile(profileData);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchUserData(session.user.id), 0);
      } else {
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchUserData(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, role, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
