import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Role } from "@/services/authService";
import { supabase } from "@/lib/supabase";
import {
  login as authLogin,
  logout as authLogout,
} from "@/services/authService";

const IMPERSONATION_KEY = "recruitflow_impersonation";

interface ImpersonationData {
  id: string;
  email: string;
}

function readImpersonation(): ImpersonationData | null {
  try {
    const s = localStorage.getItem(IMPERSONATION_KEY);
    return s ? (JSON.parse(s) as ImpersonationData) : null;
  } catch {
    return null;
  }
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: Role | null;
  loading: boolean;
  impersonatedUserId: string | null;
  impersonatedUserEmail: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  impersonate: (id: string | null, email?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const stored = readImpersonation();
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(
    stored?.id ?? null,
  );
  const [impersonatedUserEmail, setImpersonatedUserEmail] = useState<
    string | null
  >(stored?.email ?? null);

  useEffect(() => {
    let isMounted = true;

    // onAuthStateChange ska INTE ha async awaits inuti — det kan deadlocka
    // auth-tokensystemet i Supabase v2. Sätt bara session/user synkront.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setRole(null);
        setLoading(false);
      }
    });

    // Hämta initial session direkt
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Hämta roll separat när user ändras — aldrig inuti onAuthStateChange
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data: profile }) => {
        if (!isMounted) return;
        setRole((profile?.role as Role | null) ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    // onAuthStateChange handles setting user/session/role
  };

  const signOut = async () => {
    await authLogout();
    setRole(null);
    localStorage.removeItem(IMPERSONATION_KEY);
    setImpersonatedUserId(null);
    setImpersonatedUserEmail(null);
  };

  const impersonate = (id: string | null, email?: string) => {
    if (id) {
      localStorage.setItem(
        IMPERSONATION_KEY,
        JSON.stringify({ id, email: email ?? "" }),
      );
    } else {
      localStorage.removeItem(IMPERSONATION_KEY);
    }
    setImpersonatedUserId(id);
    setImpersonatedUserEmail(id ? (email ?? null) : null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        role,
        loading,
        impersonatedUserId,
        impersonatedUserEmail,
        signIn,
        signOut,
        impersonate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
