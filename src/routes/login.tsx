import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { ASSETS, LANDING_DRINKS } from "@/lib/assets";
import { useAuth, errorMessage, rememberGoogleReturn } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatBubble } from "@/components/jago/ChatBubble";

const searchSchema = z.object({
  mode: z.enum(["login", "register", "forgot"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "My Account — Jago Coffee" },
      { name: "description", content: "Login atau daftar akun Jago Coffee untuk pesan kopi, kumpulkan Energy, dan pantau pesananmu." },
      { property: "og:title", content: "My Account — Jago Coffee" },
      { property: "og:description", content: "Login atau daftar akun Jago Coffee untuk pesan kopi dan kumpulkan Energy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function safeRedirect(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "forgot" | null>(search.mode ?? null);

  useEffect(() => {
    if (search.mode) setMode(search.mode);
  }, [search.mode]);

  // Already signed in: go where the user was heading.
  useEffect(() => {
    if (loading || !session) return;
    (async () => {
      const { data } = await supabase.rpc("claim_account");
      const isAdmin = Boolean((data as { is_admin?: boolean } | null)?.is_admin);
      const target = safeRedirect(search.redirect);
      if (target) navigate({ to: target, replace: true });
      else navigate({ to: isAdmin ? "/admin" : "/home", replace: true });
    })();
  }, [session, loading, navigate, search.redirect]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover">
        <source src={ASSETS.videoBackground} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-ink/60" />

      <header className="relative z-10 flex items-center justify-between bg-primary px-6 py-4 md:px-16">
        <Link to="/">
          <img src={ASSETS.logo} alt="Jago Coffee" className="h-10 w-auto" />
        </Link>
        <nav className="hidden md:block">
          <ul className="flex gap-7">
            <li><a href="/#about" className="jago-nav-link">About Us</a></li>
            <li><a href="/#menu" className="jago-nav-link">Menu</a></li>
            <li><a href="/#how-it-works" className="jago-nav-link">How It Works</a></li>
            <li><a href="/#blog" className="jago-nav-link">Blog</a></li>
          </ul>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-4xl px-5 pb-20 pt-10">
        <h1 className="text-3xl text-primary-foreground">My Account</h1>

        <div className="jago-card mt-8 flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-lg">
            <h3 className="text-lg text-ink">Enjoy Special Discounts and Stay Connected</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Dapatkan akses ke diskon eksklusif dan pantau pesanan Jagoanmu dengan mudah dalam satu tempat.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="jagoOutline" size="lg" onClick={() => setMode("login")}>Login</Button>
            <Button variant="jago" size="lg" onClick={() => setMode("register")}>Signup</Button>
          </div>
        </div>

        <div className="jago-card mt-4 flex flex-col items-center gap-6 p-8 md:flex-row">
          <div className="flex-1">
            <span className="jago-label rounded-full bg-primary px-3 py-1 text-[10px] text-primary-foreground">New Menu</span>
            <h3 className="mt-3 text-xl text-ink">A Tropical Twist In Every Sip</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Nikmati perpaduan citrus lemon yang menyegarkan dan sentuhan coconut yang lembut. Pink Coco, kesegaran tropis
              dengan cita rasa yang istimewa.
            </p>
            <Link to="/home" hash="menu" className="jago-label mt-5 inline-block rounded-full bg-primary px-6 py-3 text-xs text-primary-foreground hover:bg-primary-dark">
              Pesan Sekarang
            </Link>
          </div>
          <img src={LANDING_DRINKS[0]!.image} alt="Pink Coco" className="h-48 w-48 object-contain" />
        </div>
      </section>

      <Dialog open={mode !== null} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="max-w-md">
          {mode === "login" && <LoginForm onSwitch={setMode} />}
          {mode === "register" && <RegisterForm onSwitch={setMode} />}
          {mode === "forgot" && <ForgotForm onSwitch={setMode} />}
        </DialogContent>
      </Dialog>

      <ChatBubble />
    </div>
  );
}

type Switch = (m: "login" | "register" | "forgot") => void;

function SocialButtons() {
  const search = Route.useSearch();
  async function signInWithGoogle() {
    // Google sign-in does not accept "localhost" as a return address, but the same app
    // on 127.0.0.1 works (it must be listed in the backend's Redirect URLs). Move there first.
    const host = window.location.hostname;
    if (host === "localhost" || host === "[::1]") {
      const url = new URL(window.location.href);
      url.hostname = "127.0.0.1";
      url.searchParams.set("mode", "login");
      toast.info("Membuka http://127.0.0.1 agar login Google bisa dipakai. Klik Continue with Google sekali lagi.");
      window.location.assign(url.toString());
      return;
    }
    rememberGoogleReturn(safeRedirect(search.redirect));
    // Return to the start page: it is the address allowed for both the online site and a local run.
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error(errorMessage(result.error));
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> atau <div className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="outline" className="h-11 w-full" onClick={signInWithGoogle}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.8h5.35c-.23 1.5-1.7 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.95S8.78 6.4 12 6.4c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.85 14.55 2.9 12 2.9 6.98 2.9 2.9 6.98 2.9 12s4.08 9.1 9.1 9.1c5.25 0 8.73-3.69 8.73-8.88 0-.6-.06-1.05-.15-1.5z"/></svg>
        Continue with Google
      </Button>
    </div>
  );
}

function LoginForm({ onSwitch }: { onSwitch: Switch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) return setError("Email dan password harus diisi");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError(
        error.message.toLowerCase().includes("not confirmed")
          ? "Email belum diverifikasi. Cek kotak masuk emailmu."
          : "Email atau password salah",
      );
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">Login</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <Input type="email" placeholder="Your email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
        <Input type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
        {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="jago" className="h-11 w-full" disabled={busy}>
          {busy ? "Logging in..." : "Next"}
        </Button>
        <button type="button" onClick={() => onSwitch("forgot")} className="w-full text-center text-sm text-primary hover:underline">
          Lupa password?
        </button>
      </form>
      <SocialButtons />
      <p className="text-center text-sm text-muted-foreground">
        Don't have account?{" "}
        <button className="text-primary" onClick={() => onSwitch("register")}>
          Signup <strong>here</strong>
        </button>
      </p>
      <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
        Pernah punya akun Kopi Jago sebelumnya? Daftar ulang dengan email yang sama dan buat password baru. Setelah emailmu
        terverifikasi, profil, pesanan, dan Energy lamamu tersambung otomatis.
      </p>
    </>
  );
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function RegisterForm({ onSwitch }: { onSwitch: Switch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState("");

  const daysInMonth = useMemo(() => {
    const m = Number(month) || 1;
    const y = Number(year) || 2000;
    return new Date(y, m, 0).getDate();
  }, [month, year]);
  const thisYear = new Date().getFullYear();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password) return setError("Nama, email, dan password wajib diisi!");
    if (password.length < 8) return setError("Password minimal 8 karakter!");
    if (!day || !month || !year) return setError("Tanggal lahir harus dipilih.");
    if (Number(day) > daysInMonth) return setError("Tanggal lahir tidak valid!");
    const birthDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin + "/login",
        data: { name: name.trim(), birth_date: birthDate },
      },
    });
    setBusy(false);
    if (error) return setError(error.message.includes("already") ? "Email sudah terdaftar." : errorMessage(error));
    if (!data.session) setSentTo(email.trim());
    else toast.success("Registrasi berhasil! Selamat datang di Kopi Jago!");
  }

  if (sentTo) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-2xl">Cek Emailmu</DialogTitle>
          <DialogDescription>
            Kami mengirim link verifikasi ke <strong>{sentTo}</strong>. Klik link tersebut untuk mengaktifkan akunmu, lalu login.
          </DialogDescription>
        </DialogHeader>
        <Button variant="jago" className="h-11 w-full" onClick={() => onSwitch("login")}>Ke Login</Button>
      </>
    );
  }

  const selectCls = "h-11 flex-1 rounded-md border border-input bg-background px-2 text-sm";
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">Register</DialogTitle>
        <DialogDescription>
          Create account to be our member to earn points, get free vouchers, and hear our news earlier.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-3">
        <Input placeholder="Your Full Name*" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
        <Input type="email" placeholder="Your email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
        <Input type="password" placeholder="Password (min. 8 karakter)" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
        <div>
          <label className="jago-label text-xs">My Birthday</label>
          <div className="mt-2 flex gap-2">
            <select aria-label="Day" className={selectCls} value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="">Day</option>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select aria-label="Month" className={selectCls} value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">Bulan</option>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select aria-label="Year" className={selectCls} value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Year</option>
              {Array.from({ length: 101 }, (_, i) => thisYear - i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button type="submit" variant="jago" className="h-11 w-full" disabled={busy}>
          {busy ? "Mendaftar..." : "Create New Account"}
        </Button>
      </form>
      <SocialButtons />
      <p className="text-center text-sm text-muted-foreground">
        Already have account?{" "}
        <button className="text-primary" onClick={() => onSwitch("login")}>
          Login <strong>here</strong>
        </button>
      </p>
    </>
  );
}

function ForgotForm({ onSwitch }: { onSwitch: Switch }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/reset-password",
    });
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    setSent(true);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">Lupa Password</DialogTitle>
        <DialogDescription>
          {sent
            ? "Jika email terdaftar, link reset password telah dikirim. Cek kotak masukmu."
            : "Masukkan emailmu dan kami kirimkan link untuk membuat password baru."}
        </DialogDescription>
      </DialogHeader>
      {!sent && (
        <form onSubmit={submit} className="space-y-3">
          <Input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
          <Button type="submit" variant="jago" className="h-11 w-full" disabled={busy}>
            {busy ? "Mengirim..." : "Kirim Link Reset"}
          </Button>
        </form>
      )}
      <button onClick={() => onSwitch("login")} className="text-center text-sm text-primary hover:underline">
        Kembali ke Login
      </button>
    </>
  );
}
