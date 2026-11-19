import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/auth";
import { ASSETS } from "@/lib/assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Buat Password Baru — Jago Coffee" },
      { name: "description", content: "Buat password baru untuk akun Jago Coffee kamu." },
      { property: "og:title", content: "Buat Password Baru — Jago Coffee" },
      { property: "og:description", content: "Buat password baru untuk akun Jago Coffee kamu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data: s }) => s.session && setReady(true));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password minimal 8 karakter"); return; }
    if (password !== confirm) { toast.error("Konfirmasi password tidak cocok"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success("Password berhasil direset");
    navigate({ to: "/home" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <header className="bg-primary px-6 py-4">
        <Link to="/"><img src={ASSETS.logo} alt="Jago Coffee" className="h-10 w-auto" /></Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="jago-card w-full max-w-md p-8">
          <h1 className="text-2xl text-ink">Password Baru</h1>
          {!ready ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Buka halaman ini dari link reset password yang kami kirim ke emailmu.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <Input type="password" placeholder="Password baru (min. 8 karakter)" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
              <Input type="password" placeholder="Konfirmasi password baru" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" />
              <Button type="submit" variant="jago" className="h-11 w-full" disabled={busy}>
                {busy ? "Menyimpan..." : "Simpan Password"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
