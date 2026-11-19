import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, errorMessage } from "@/lib/auth";
import { energyQuery, profileQuery } from "@/lib/queries";
import { formatDate } from "@/lib/jago";
import { CustomerShell, LoadingBlock } from "@/components/jago/CustomerShell";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profil Saya — Kopi Jago" },
      { name: "description", content: "Kelola profil dan keamanan akun Kopi Jago kamu." },
      { property: "og:title", content: "Profil Saya — Kopi Jago" },
      { property: "og:description", content: "Kelola profil dan keamanan akun Kopi Jago kamu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session, signOut } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const profile = useQuery(profileQuery(userId));
  const energy = useQuery(energyQuery(userId));
  const [editing, setEditing] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const p = profile.data;

  return (
    <CustomerShell title="Profil Saya">
      {profile.isLoading || !p ? (
        <LoadingBlock />
      ) : (
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="jago-card flex items-center gap-5 p-6">
            <div className="font-display flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-black text-primary-foreground">
              {(p.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl text-ink">{p.name || "User"}</h2>
              <p className="text-sm text-muted-foreground">{p.email}</p>
            </div>
            <Link to="/energy" className="text-right">
              <span className="font-display block text-2xl font-black text-primary">{energy.data?.balance ?? 0}</span>
              <span className="jago-label text-[10px] text-muted-foreground">Energy</span>
            </Link>
          </div>

          <div className="jago-card p-6">
            <h3 className="text-base">Informasi Pribadi</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Field label="Nama" value={p.name || "-"} />
              <Field label="Email" value={p.email || "-"} />
              <Field label="Telepon" value={p.phone || "-"} />
              <Field label="Tanggal Lahir" value={p.birth_date ? formatDate(p.birth_date, false) : "-"} />
            </dl>
            <Button variant="jagoOutline" className="mt-5" onClick={() => setEditing(true)}>Edit Profil</Button>
          </div>

          <div className="jago-card p-6">
            <h3 className="text-base">Akun & Keamanan</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="jagoOutline" onClick={() => setChangingPw(true)}>Ubah Password</Button>
              <Button variant="destructive" className="jago-label rounded-full" onClick={signOut}>Logout</Button>
            </div>
          </div>
        </div>
      )}

      {p && (
        <EditProfileDialog
          open={editing}
          onOpenChange={setEditing}
          initial={{ name: p.name, phone: p.phone ?? "" }}
          onSave={async (name, phone) => {
            const { error } = await supabase.from("profiles").update({ name, phone: phone || null }).eq("id", userId!);
            if (error) { toast.error("Gagal memperbarui profil: " + error.message); return; }
            await supabase.auth.updateUser({ data: { name } });
            toast.success("Profil berhasil diperbarui");
            setEditing(false);
            queryClient.invalidateQueries({ queryKey: ["profile"] });
          }}
        />
      )}
      <ChangePasswordDialog open={changingPw} onOpenChange={setChangingPw} email={session?.user.email ?? ""} />
    </CustomerShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-3 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function EditProfileDialog({ open, onOpenChange, initial, onSave }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: { name: string; phone: string };
  onSave: (name: string, phone: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit Profil</DialogTitle></DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) { toast.warning("Nama wajib diisi"); return; }
            onSave(name.trim(), phone.trim());
          }}
        >
          <div className="space-y-1.5"><Label htmlFor="pname">Nama</Label><Input id="pname" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="pphone">Telepon</Label><Input id="pphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <Button type="submit" variant="jago" className="h-11 w-full">Simpan</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordDialog({ open, onOpenChange, email }: { open: boolean; onOpenChange: (o: boolean) => void; email: string }) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPw || !newPw || !confirm) { toast.warning("Semua field wajib diisi"); return; }
    if (newPw !== confirm) { toast.warning("Konfirmasi password tidak cocok"); return; }
    if (newPw.length < 8) { toast.warning("Password minimal 8 karakter"); return; }
    setBusy(true);
    const check = await supabase.auth.signInWithPassword({ email, password: oldPw });
    if (check.error) {
      setBusy(false);
      { toast.error("Password lama salah"); return; }
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success("Password berhasil diubah");
    setOldPw(""); setNewPw(""); setConfirm("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Ubah Password</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5"><Label htmlFor="old">Password Lama</Label><Input id="old" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="new">Password Baru</Label><Input id="new" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="conf">Konfirmasi Password Baru</Label><Input id="conf" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
          <Button type="submit" variant="jago" className="h-11 w-full" disabled={busy}>{busy ? "Menyimpan..." : "Ubah"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
