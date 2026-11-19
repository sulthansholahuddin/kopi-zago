import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  displayName: string;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function syncAccount(): Promise<boolean> {
  // Links old-system data for a verified email and returns whether the user is an admin.
  const { data } = await supabase.rpc("claim_account");
  return Boolean((data as { is_admin?: boolean } | null)?.is_admin);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) setIsAdmin(await syncAccount());
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_OUT") {
        setIsAdmin(false);
        router.invalidate();
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Defer Supabase calls out of the auth callback.
        setTimeout(async () => {
          setIsAdmin(await syncAccount());
          router.invalidate();
          queryClient.invalidateQueries();
        }, 0);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router, queryClient]);

  const meta = session?.user.user_metadata ?? {};
  const displayName =
    (meta["name"] as string) || (meta["full_name"] as string) || session?.user.email?.split("@")[0] || "";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/login", replace: true });
  }

  return (
    <AuthContext.Provider value={{ session, loading, isAdmin, displayName, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return "Terjadi kesalahan. Silakan coba lagi.";
}

// Google sign-in returns to the site's start page (the only local address Google accepts is
// http://127.0.0.1:8080 itself), so remember where the user was heading before leaving.
const GOOGLE_RETURN_KEY = "jago:after-google-login";

export function rememberGoogleReturn(path: string | null) {
  try {
    sessionStorage.setItem(GOOGLE_RETURN_KEY, path ?? "");
  } catch {
    /* storage unavailable: user simply lands on the start page */
  }
}

/** Returns the saved destination ("" = default) once, or null when no Google sign-in is pending. */
export function takeGoogleReturn(): string | null {
  try {
    const value = sessionStorage.getItem(GOOGLE_RETURN_KEY);
    if (value !== null) sessionStorage.removeItem(GOOGLE_RETURN_KEY);
    return value;
  } catch {
    return null;
  }
}
