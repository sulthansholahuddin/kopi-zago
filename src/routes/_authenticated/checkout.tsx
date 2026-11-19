import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Landmark, QrCode } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, errorMessage } from "@/lib/auth";
import { cartQuery } from "@/lib/queries";
import { BANKS, dummyVaNumber, energyForOrder, formatRupiah, SIZE_LABELS, type BankCode } from "@/lib/jago";
import { FALLBACK_DRINK_IMAGE } from "@/lib/assets";
import { CustomerShell, EmptyState, LoadingBlock } from "@/components/jago/CustomerShell";
import { Receipt, type ReceiptOrder } from "@/components/jago/Receipt";
import { QrisPayment } from "@/components/jago/QrisPayment";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Kopi Jago" },
      { name: "description", content: "Pilih metode pembayaran dan selesaikan pesananmu." },
      { property: "og:title", content: "Checkout — Kopi Jago" },
      { property: "og:description", content: "Pilih metode pembayaran dan selesaikan pesananmu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

type PlacedOrder = ReceiptOrder & { id: number };

function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const cart = useQuery(cartQuery(session?.user.id));
  const items = cart.data ?? [];
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);

  const [method, setMethod] = useState<"bank_transfer" | "qris" | null>(null);
  const [bank, setBank] = useState<BankCode | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [va, setVa] = useState<string | null>(null);
  const [qrisDone, setQrisDone] = useState<"paid" | "expired" | null>(null);

  const ready = method === "qris" || (method === "bank_transfer" && bank !== null);

  async function submit() {
    if (!ready || submitting) return;
    setSubmitting(true);
    const code = method === "qris" ? "qris" : bank!;
    const vaNumber = method === "bank_transfer" ? dummyVaNumber(bank!) : null;
    const { data, error } = await supabase.rpc("place_order", { p_payment_method: code });
    setSubmitting(false);
    if (error) { toast.error("Gagal memproses pesanan: " + errorMessage(error)); return; }
    const o = data as unknown as PlacedOrder & { items: ReceiptOrder["items"] };
    setVa(vaNumber);
    setPlaced(o);
    queryClient.invalidateQueries();
  }

  async function refreshPlaced() {
    if (!placed) return;
    const { data } = await supabase.from("orders").select("*").eq("id", placed.id).maybeSingle();
    if (data) setPlaced({ ...placed, ...data, items: placed.items });
    queryClient.invalidateQueries();
  }

  useEffect(() => {
    if (qrisDone) refreshPlaced();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrisDone]);

  if (!cart.isLoading && items.length === 0 && !placed) {
    return (
      <CustomerShell title="Checkout">
        <EmptyState
          icon="🛒"
          title="Keranjang Kosong"
          message="Tambahkan minuman ke keranjang dulu sebelum checkout."
          action={<Button asChild variant="jago" size="lg"><Link to="/home" hash="menu">Lihat Menu</Link></Button>}
        />
      </CustomerShell>
    );
  }

  const bankName = BANKS.find((b) => b.code === bank)?.name;

  return (
    <CustomerShell title="Checkout">
      {cart.isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="jago-card p-7">
            <h2 className="text-lg text-ink">Detail Pesanan</h2>
            <ul className="mt-4 divide-y">
              {items.map((item) => (
                <li key={`${item.menu_id}-${item.size}`} className="flex items-center gap-4 py-3">
                  <img src={item.image_url ?? FALLBACK_DRINK_IMAGE} alt={item.name} className="h-16 w-16 rounded-lg object-contain" />
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{SIZE_LABELS[item.size]} · x{item.qty}</p>
                  </div>
                  <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-lg text-ink">Metode Pembayaran</h2>
            <div className="mt-4 space-y-3">
              <MethodButton
                active={method === "bank_transfer"}
                onClick={() => setMethod("bank_transfer")}
                icon={<Landmark className="h-6 w-6" />}
                title="Transfer Bank"
                desc="Transfer ke rekening bank (BCA, BNI, BRI, Mandiri, BSI, SeaBank)"
              />
              {method === "bank_transfer" && (
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-3 sm:grid-cols-3">
                  {BANKS.map((b) => (
                    <button
                      key={b.code}
                      onClick={() => setBank(b.code)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border-2 bg-card px-3 py-3 text-sm font-semibold transition-colors",
                        bank === b.code ? "border-primary text-primary" : "border-transparent hover:border-border",
                      )}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs text-ink-foreground">{b.name[0]}</span>
                      {b.name}
                      {bank === b.code && <Check className="ml-auto h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
              <MethodButton
                active={method === "qris"}
                onClick={() => { setMethod("qris"); setBank(null); }}
                icon={<QrCode className="h-6 w-6" />}
                title="QRIS"
                desc="Scan QR Code dengan aplikasi e-wallet atau banking (batas bayar 2 menit)"
              />
            </div>
          </div>

          <aside className="jago-card h-fit p-7">
            <h2 className="text-lg text-ink">Ringkasan Pesanan</h2>
            <dl className="mt-4 space-y-2 text-sm">
              {items.map((i) => (
                <div key={`${i.menu_id}-${i.size}`} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{i.name} ({SIZE_LABELS[i.size]}) x{i.qty}</dt>
                  <dd>{formatRupiah(i.subtotal)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t pt-3"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-semibold">{formatRupiah(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Ongkir</dt><dd className="font-semibold text-success">GRATIS</dd></div>
              <div className="flex justify-between border-t pt-3 font-display text-lg font-black"><dt>Total</dt><dd className="text-primary">{formatRupiah(subtotal)}</dd></div>
            </dl>
            <p className="mt-3 rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
              ⚡ Dapatkan {energyForOrder(subtotal)} Energy saat pesanan selesai.
            </p>
            <Button asChild variant="jagoOutline" className="mt-5 h-12 w-full">
              <Link to="/orders">Cek Detail Pesanan</Link>
            </Button>
            <Button variant="jago" className="mt-3 h-12 w-full" disabled={!ready || submitting} onClick={submit}>
              {submitting ? "Memproses..." : "Lanjut Ke Pembayaran"}
            </Button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">Mode demo: tidak ada transaksi uang sungguhan.</p>
          </aside>
        </div>
      )}

      <Dialog open={placed !== null} onOpenChange={(o) => { if (!o) navigate({ to: "/orders" }); }}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Struk Digital</DialogTitle>
          </DialogHeader>
          {placed && (
            <div className="space-y-5">
              {placed.payment_method === "qris" && placed.payment_status === "pending" && placed.status === "pending" && !qrisDone && (
                <QrisPayment
                  orderId={placed.id}
                  createdAt={placed.created_at}
                  total={placed.total_amount}
                  onPaid={() => setQrisDone("paid")}
                  onExpired={() => setQrisDone("expired")}
                />
              )}
              {va && (
                <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm">
                  <span>VA {bankName}: <strong className="font-mono">{va}</strong></span>
                  <button aria-label="Salin nomor VA" onClick={() => { navigator.clipboard?.writeText(va); toast("Nomor VA disalin"); }}>
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              )}
              <Receipt
                order={placed}
                success={
                  va
                    ? `Berhasil membayar ${bankName} via VA ${va}`
                    : qrisDone === "paid"
                      ? "Pembayaran QRIS berhasil (simulasi)"
                      : undefined
                }
              />
              <Button variant="jago" className="h-11 w-full" onClick={() => navigate({ to: "/orders" })}>
                Lihat Pesanan Saya
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </CustomerShell>
  );
}

function MethodButton({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors",
        active ? "border-primary bg-accent" : "border-border hover:border-primary/40",
      )}
    >
      <span className={cn("flex h-11 w-11 items-center justify-center rounded-full", active ? "bg-primary text-primary-foreground" : "bg-muted")}>{icon}</span>
      <span className="flex-1">
        <span className="jago-label block text-sm">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
      {active && <Check className="h-5 w-5 text-primary" />}
    </button>
  );
}
