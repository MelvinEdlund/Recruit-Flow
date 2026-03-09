import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Role } from "@/services/authService";
import {
  getSessionWithProfile,
  listenToAuthChanges,
  login as authLogin,
  logout as authLogout,
} from "@/services/authService";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: Role | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const state = await getSessionWithProfile();
        if (!isMounted) return;
        setSession(state.session);
        setUser(state.user);
        setRole(state.role);
      } catch (error) {
        console.error("Failed to fetch session/profile", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    const subscription = listenToAuthChanges((state) => {
      if (!isMounted) return;
      setSession(state.session);
      setUser(state.user);
      setRole(state.role);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await authLogin(email, password);
  };

  const signOut = async () => {
    await authLogout();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
