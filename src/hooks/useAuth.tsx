import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Role } from "@/services/authService";
import {
  getSessionWithProfile,
  listenToAuthChanges,
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

    // Fallback: om Supabase inte svarar inom 5s, visa appen ändå
    const fallback = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 5000);

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
        clearTimeout(fallback);
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
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    await authLogin(email, password);
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
