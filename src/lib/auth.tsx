
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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
  try {
    const { data, error } = await supabase.rpc("claim_account");

    if (error) {
      console.error("Gagal memeriksa role akun:", error.message);
      return false;
    }

    return Boolean(
      (data as { is_admin?: boolean } | null)?.is_admin
    );
  } catch (error) {
    console.error("Kesalahan sinkronisasi akun:", error);
    return false;
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    let requestNumber = 0;

    async function initializeSession() {
      const currentRequest = ++requestNumber;

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!active || currentRequest !== requestNumber) return;

        const currentSession = data.session;

        setSession(currentSession);

        if (!currentSession) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const admin = await syncAccount();

        if (!active || currentRequest !== requestNumber) return;

        setIsAdmin(admin);
        setLoading(false);

        router.invalidate();
        queryClient.invalidateQueries();
      } catch (error) {
        console.error("Gagal memuat sesi:", error);

        if (!active) return;

        setSession(null);
        setIsAdmin(false);
        setLoading(false);
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!active) return;

      const currentRequest = ++requestNumber;

      setSession(newSession);

      if (!newSession) {
        setIsAdmin(false);
        setLoading(false);

        if (event === "SIGNED_OUT") {
          queryClient.clear();
          router.invalidate();
        }

        return;
      }

      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        setLoading(true);

        // Hindari menjalankan query Supabase langsung di callback auth.
        setTimeout(async () => {
          const admin = await syncAccount();

          if (!active || currentRequest !== requestNumber) return;

          setIsAdmin(admin);
          setLoading(false);

          router.invalidate();
          queryClient.invalidateQueries();
        }, 0);
      }
    });

    initializeSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router, queryClient]);

  const meta = session?.user.user_metadata ?? {};

  const displayName =
    (meta["name"] as string) ||
    (meta["full_name"] as string) ||
    session?.user.email?.split("@")[0] ||
    "";

  async function signOut() {
    try {
      await queryClient.cancelQueries();
      queryClient.clear();

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Gagal logout:", error.message);
        return;
      }

      setSession(null);
      setIsAdmin(false);
      setLoading(false);

      await router.navigate({
        to: "/login",
        replace: true,
      });
    } catch (error) {
      console.error("Kesalahan logout:", error);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        isAdmin,
        displayName,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export function errorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error
  ) {
    return String((error as { message: unknown }).message);
  }

  return "Terjadi kesalahan. Silakan coba lagi.";
}

// Menyimpan tujuan halaman sebelum login Google.
const GOOGLE_RETURN_KEY = "jago:after-google-login";

export function rememberGoogleReturn(path: string | null) {
  try {
    sessionStorage.setItem(GOOGLE_RETURN_KEY, path ?? "");
  } catch {
    // Storage tidak tersedia.
  }
}

// Mengambil tujuan halaman setelah login Google.
export function takeGoogleReturn(): string | null {
  try {
    const value = sessionStorage.getItem(GOOGLE_RETURN_KEY);

    if (value !== null) {
      sessionStorage.removeItem(GOOGLE_RETURN_KEY);
    }

    return value;
  } catch {
    return null;
  }
}
