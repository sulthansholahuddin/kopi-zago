import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/auth";
import { formatDate } from "@/lib/jago";
import { AdminHeader, EmptyRow, TableCard, td, th } from "@/components/jago/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/qr")({
  head: () => ({ meta: [{ title: "Energy QR — Admin Kopi Jago" }] }),
  component: QrGenerator,
});

const tokensQuery = queryOptions({
  queryKey: ["admin", "qr_tokens"],
  queryFn: async () => {
    const { data, error } = await supabase.from("qr_tokens").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return data ?? [];
  },
});

function randomBlock() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function QrGenerator() {
  const queryClient = useQueryClient();
  const tokens = useQuery(tokensQuery);
  const [energy, setEnergy] = useState(10);
  const [limit, setLimit] = useState(1);
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState<{ code: string; url: string; image: string } | null>(null);

  async function generate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const code = `JAGO-${randomBlock()}-${randomBlock()}`;
    const { error } = await supabase.rpc("admin_create_qr_token", { p_token: code, p_energy: energy, p_scan_limit: limit, p_hours: hours });
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    const url = `${window.location.origin}/energy?code=${encodeURIComponent(code)}`;
    const image = await QRCode.toDataURL(url, { width: 320, margin: 2 });
    setGenerated({ code, url, image });
    toast.success("QR code dibuat");
    queryClient.invalidateQueries({ queryKey: tokensQuery.queryKey });
  }

  return (
    <>
      <AdminHeader title="Energy QR Generator" subtitle="Buat QR code yang memberi Energy points saat di-scan customer" />
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={generate} className="jago-card space-y-4 p-6">
          <div className="space-y-1.5"><Label htmlFor="qe">Energy per scan (1–100)</Label><Input id="qe" type="number" min={1} max={100} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label htmlFor="ql">Batas scan</Label><Input id="ql" type="number" min={1} value={limit} onChange={(e) => setLimit(Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label htmlFor="qh">Berlaku (jam)</Label><Input id="qh" type="number" min={1} value={hours} onChange={(e) => setHours(Number(e.target.value))} /></div>
          <Button type="submit" variant="jago" className="h-11 w-full" disabled={busy}><QrCode /> {busy ? "Membuat..." : "Generate QR"}</Button>
        </form>
        <div className="jago-card flex flex-col items-center justify-center p-6 text-center">
          {generated ? (
            <>
              <img src={generated.image} alt="Energy QR code" className="h-64 w-64" />
              <p className="font-display mt-3 text-lg font-black tracking-wider">{generated.code}</p>
              <p className="mt-1 text-xs text-muted-foreground">Simpan kode ini sekarang — kode hanya ditampilkan sekali.</p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(generated.code); toast.success("Kode disalin"); }}><Copy /> Copy Code</Button>
                <Button asChild variant="jagoOutline" size="sm"><a href={generated.image} download={`${generated.code}.png`}>Download PNG</a></Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">QR code yang dibuat akan tampil di sini.</p>
          )}
        </div>
      </div>
      <div className="mt-8">
        <TableCard title="Recent QR Codes">
          <table className="w-full">
            <thead className="bg-muted/60"><tr><th className={th}>ID</th><th className={th}>Energy</th><th className={th}>Scans</th><th className={th}>Expires</th><th className={th}>Created</th></tr></thead>
            <tbody className="divide-y">
              {(tokens.data ?? []).length === 0 ? <EmptyRow cols={5} text={tokens.isLoading ? "Memuat..." : "Belum ada QR code."} /> : tokens.data!.map((t) => (
                <tr key={t.id}>
                  <td className={td}>#{t.id}</td>
                  <td className={td}>+{t.energy_amount}</td>
                  <td className={td}>{t.scan_count} / {t.scan_limit}</td>
                  <td className={td}>{new Date(t.expires_at) < new Date() ? "Expired" : formatDate(t.expires_at)}</td>
                  <td className={td}>{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </div>
    </>
  );
}
