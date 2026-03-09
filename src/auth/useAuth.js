import { useState, useEffect } from 'react';
import { auth } from '../lib/supabase';

export function useAuth() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session on mount
    auth.getSession().then(async session => {
      if (session?.user) {
        setUser(session.user);
        const p = await auth.getProfile(session.user.id);
        setProfile(p);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = auth.onAuthChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const p = await auth.getProfile(session.user.id);
        setProfile(p);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.role === 'admin';
  const isMember = profile?.role === 'member';

  return { user, profile, loading, signOut, isAdmin, isMember };
}
