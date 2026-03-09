import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Role = "admin" | "customer";

export type AuthState = {
  session: Session | null;
  user: User | null;
  role: Role | null;
};

export async function getSessionWithProfile(): Promise<AuthState> {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  const user = session?.user ?? null;

  if (!user) {
    return { session: null, user: null, role: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    session,
    user,
    role: (profile?.role as Role | null) ?? null,
  };
}

export function listenToAuthChanges(onChange: (state: AuthState) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (_event, session) => {
    const user = session?.user ?? null;

    if (!user) {
      onChange({ session: null, user: null, role: null });
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    onChange({
      session,
      user,
      role: (profile?.role as Role | null) ?? null,
    });
  });

  return subscription;
}

export async function login(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function logout() {
  await supabase.auth.signOut();
}

