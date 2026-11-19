import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, QrCode, Zap } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, errorMessage } from "@/lib/auth";
import { energyQuery, redemptionsQuery, rewardsQuery } from "@/lib/queries";
import { formatDate, formatRupiah } from "@/lib/jago";
import { CustomerShell, LoadingBlock } from "@/components/jago/CustomerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/energy")({
  validateSearch: z.object({ code: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Energy Rewards — Kopi Jago" },
      { name: "description", content: "Kumpulkan Energy dari setiap pesanan dan tukar dengan minuman gratis serta merchandise." },
      { property: "og:title", content: "Energy Rewards — Kopi Jago" },
      { property: "og:description", content: "Kumpulkan Energy dan tukar dengan minuman gratis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EnergyPage,
});

const REWARD_TYPE: Record<string, string> = {
  free_drink: "Minuman Gratis",
  discount: "Diskon",
  merchandise: "Merchandise",
  voucher: "Voucher",
};

function EnergyPage() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const energy = useQuery(energyQuery(userId));
  const rewards = useQuery(rewardsQuery);
  const redemptions = useQuery(redemptionsQuery(userId));
  const [code, setCode] = useState(search.code ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const balance = energy.data?.balance ?? 0;

  useEffect(() => {
    if (search.code) setCode(search.code);
  }, [search.code]);

  async function scan(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { toast.warning("Masukkan kode QR"); return; }
    setBusy("scan");
    const { data, error } = await supabase.rpc("scan_qr", { p_token: code.trim() });
    setBusy(null);
    if (error) { toast.error(errorMessage(error)); return; }
    const r = data as { energy_awarded: number };
    toast.success(`QR berhasil di-scan! +${r.energy_awarded} Energy`);
    setCode("");
    queryClient.invalidateQueries();
  }

  async function redeem(id: number, name: string) {
    if (!window.confirm(`Tukar Energy untuk ${name}?`)) return;
    setBusy(`r${id}`);
    const { error } = await supabase.rpc("redeem_reward", { p_reward_id: id });
    setBusy(null);
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success("Reward berhasil ditukar!");
    queryClient.invalidateQueries();
  }

  return (
    <CustomerShell title="Energy Rewards" subtitle="Kumpulkan Energy dari setiap pesanan, tukar dengan hadiah">
      <div className="relative overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground shadow-red">
        <Zap className="absolute -right-6 -top-6 h-44 w-44 opacity-15" />
        <p className="jago-label text-xs opacity-90">Saldo Energy Kamu</p>
        <p className="font-display mt-2 text-6xl font-black">{energy.isLoading ? "…" : balance}</p>
        <p className="mt-2 text-sm opacity-90">1 Energy untuk setiap Rp1.000 belanja (minimal 10 per pesanan selesai).</p>
      </div>

      <form onSubmit={scan} className="jago-card mt-6 flex flex-col gap-3 p-6 sm:flex-row sm:items-center">
        <QrCode className="hidden h-10 w-10 text-primary sm:block" />
        <div className="flex-1">
          <h3 className="text-base">Scan QR dari Jagoan</h3>
          <p className="text-sm text-muted-foreground">Masukkan kode yang tertera di bawah QR code untuk mendapat Energy.</p>
        </div>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="JAGO-XXXXXXXX-XXXXXXXX" className="h-11 sm:w-72" />
        <Button type="submit" variant="jago" className="h-11" disabled={busy === "scan"}>
          {busy === "scan" ? "Memproses..." : "Klaim"}
        </Button>
      </form>

      <h2 className="mt-10 text-2xl text-ink">Tukar Reward</h2>
      {rewards.isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(rewards.data ?? []).map((r) => {
            const enough = balance >= r.energy_cost;
            const outOfStock = r.stock !== null && r.stock < 1;
            return (
              <div key={r.id} className="jago-card flex flex-col p-6">
                <div className="flex items-start justify-between">
                  <span className="jago-label rounded-full bg-accent px-3 py-1 text-[10px] text-accent-foreground">{REWARD_TYPE[r.reward_type] ?? r.reward_type}</span>
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-base text-ink">{r.name}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{r.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-display font-black text-primary">⚡ {r.energy_cost}</span>
                  <Button
                    variant="jago"
                    size="sm"
                    disabled={!enough || outOfStock || busy === `r${r.id}`}
                    onClick={() => redeem(r.id, r.name)}
                  >
                    {outOfStock ? "Habis" : enough ? "Tukar" : `Kurang ${r.energy_cost - balance}`}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="jago-card p-6">
          <h3 className="text-base">Reward Saya</h3>
          {(redemptions.data ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Belum ada reward yang ditukar.</p>
          ) : (
            <ul className="mt-4 divide-y text-sm">
              {redemptions.data!.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold">{r.energy_rewards?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Ditukar {formatDate(r.redeemed_at, false)} · berlaku s.d. {formatDate(r.expires_at, false)}
                      {r.energy_rewards?.reward_value ? ` · ${formatRupiah(r.energy_rewards.reward_value)}` : ""}
                    </p>
                  </div>
                  <span className="jago-label rounded-full bg-success-soft px-3 py-1 text-[10px] text-success">{r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="jago-card p-6">
          <h3 className="text-base">Riwayat Energy</h3>
          {(energy.data?.history ?? []).length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Belum ada riwayat. Selesaikan pesanan pertamamu untuk dapat Energy!</p>
          ) : (
            <ul className="mt-4 divide-y text-sm">
              {energy.data!.history.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold">{t.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(t.created_at)}</p>
                  </div>
                  <span className={cn("font-display font-black", t.amount > 0 ? "text-success" : "text-destructive")}>
                    {t.amount > 0 ? "+" : ""}{t.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </CustomerShell>
  );
}
