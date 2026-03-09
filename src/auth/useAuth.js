import { useState, useEffect } from 'react';
import { USERS } from './users';

const SESSION_KEY = 'altr_user';

export function useAuth() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from sessionStorage
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch (e) {}
    setLoading(false);
  }, []);

  const signIn = (username, password) => {
    const found = USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase().trim()
        && u.password === password
    );
    if (!found) return false;
    const u = { username: found.username, name: found.name, role: found.role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
    setUser(u);
    return true;
  };

  const signOut = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const isAdmin  = user?.role === 'admin';
  const isMember = user?.role === 'member';

  return { user, loading, signIn, signOut, isAdmin, isMember };
}
