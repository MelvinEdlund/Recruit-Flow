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

    (async () => {
      // Steg 1: Hämta session från localStorage – snabb, ingen nätverksanrop
      // om token är giltig. Sätter loading=false direkt när vi vet user-status.
      try {
        const {
          data: { session },
        } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<any>((resolve) =>
            setTimeout(() => resolve({ data: { session: null } }), 4000),
          ),
        ]);
        if (!isMounted) return;
        const user = session?.user ?? null;
        setSession(session);
        setUser(user);
        setLoading(false); // Visa appen direkt

        // Steg 2: Hämta roll i bakgrunden (blockar inte UI)
        if (user) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", user.id)
              .maybeSingle();
            if (isMounted) setRole((profile?.role as Role | null) ?? null);
          } catch {
            // roll förblir null
          }
        }
      } catch {
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Sätt state direkt så ProtectedRoute ser user omedelbart vid navigate
    setSession(data.session);
    setUser(data.user ?? null);
    // Roll hämtas i bakgrunden av listenToAuthChanges
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
