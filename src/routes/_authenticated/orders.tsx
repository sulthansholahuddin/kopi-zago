import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, errorMessage } from "@/lib/auth";
import { ordersQuery, type OrderWithItems } from "@/lib/queries";
import { formatDate, formatRupiah, PAYMENT_STATUS_LABEL, SIZE_LABELS, type DrinkSize, type PaymentStatus } from "@/lib/jago";
import { CustomerShell, EmptyState, LoadingBlock } from "@/components/jago/CustomerShell";
import { Receipt, StatusBadge } from "@/components/jago/Receipt";
import { QrisPayment } from "@/components/jago/QrisPayment";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "Pesanan Saya — Kopi Jago" },
      { name: "description", content: "Pantau status pesanan, pembayaran, dan struk digitalmu." },
      { property: "og:title", content: "Pesanan Saya — Kopi Jago" },
      { property: "og:description", content: "Pantau status pesanan dan struk digitalmu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

const TABS = [
  { key: "all", label: "Semua", empty: "Anda belum memiliki pesanan." },
  { key: "payment_process", label: "Proses Pembayaran", empty: "Tidak ada pesanan yang menunggu pembayaran." },
  { key: "completed", label: "Selesai", empty: "Belum ada pesanan yang selesai." },
  { key: "cancelled", label: "Dibatalkan", empty: "Tidak ada pesanan yang dibatalkan." },
  { key: "history", label: "Riwayat", empty: "Belum ada riwayat pembelian. Riwayat muncul setelah pembayaran lunas." },
] as const;

function filterByTab(orders: OrderWithItems[], tab: string) {
  switch (tab) {
    case "payment_process":
      return orders.filter((o) => o.status !== "cancelled" && o.status !== "completed" && o.payment_status !== "paid");
    case "completed":
      return orders.filter((o) => o.status === "completed");
    case "cancelled":
      return orders.filter((o) => o.status === "cancelled");
    case "history":
      return orders.filter((o) => o.payment_status === "paid");
    default:
      return orders;
  }
}

function toReceipt(o: OrderWithItems) {
  return { ...o, items: o.order_items };
}

function OrdersPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const orders = useQuery(ordersQuery(session?.user.id));
  const [tab, setTab] = useState<string>("all");
  const [receiptId, setReceiptId] = useState<number | null>(null);
  const [payId, setPayId] = useState<number | null>(null);

  const all = orders.data ?? [];
  const list = filterByTab(all, tab);
  const receiptOrder = all.find((o) => o.id === receiptId);
  const payOrder = all.find((o) => o.id === payId);

  async function cancel(o: OrderWithItems) {
    if (!window.confirm(`Batalkan pesanan ${o.order_number}?`)) return;
    const { error } = await supabase.rpc("cancel_order", { p_order_id: o.id });
    if (error) { toast.error(errorMessage(error)); return; }
    toast("Pesanan dibatalkan");
    queryClient.invalidateQueries();
  }

  return (
    <CustomerShell title="Pesanan Saya" subtitle="Pantau status pesanan dan pembayaranmu">
      <div className="scrollbar-none -mx-1 mb-6 flex gap-2 overflow-x-auto px-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "jago-label shrink-0 rounded-full px-4 py-2 text-xs transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-accent",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {orders.isLoading ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Tidak Ada Pesanan"
          message={TABS.find((t) => t.key === tab)?.empty ?? "Tidak ada pesanan."}
          action={<Button asChild variant="jago" size="lg"><Link to="/home" hash="menu">Lihat Menu</Link></Button>}
        />
      ) : (
        <div className="space-y-4">
          {list.map((o) => {
            const visible = o.order_items.slice(0, 3);
            const more = o.order_items.length - visible.length;
            const qrisPending = o.payment_method === "qris" && o.payment_status === "pending" && o.status === "pending";
            return (
              <div key={o.id} className="jago-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base text-ink">{o.order_number}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={o.status} />
                    <span className="jago-label text-[10px] text-muted-foreground">
                      {PAYMENT_STATUS_LABEL[o.payment_status as PaymentStatus] ?? o.payment_status}
                    </span>
                  </div>
                </div>
                <ul className="mt-4 space-y-1 text-sm">
                  {visible.map((i) => (
                    <li key={i.id} className="flex justify-between">
                      <span>{i.name} <span className="text-muted-foreground">({SIZE_LABELS[i.size as DrinkSize] ?? i.size})</span></span>
                      <span className="text-muted-foreground">{i.qty}x {formatRupiah(i.price)}</span>
                    </li>
                  ))}
                  {more > 0 && <li className="text-xs text-muted-foreground">+{more} item lainnya</li>}
                </ul>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <span className="font-display font-black">Total: <span className="text-primary">{formatRupiah(o.total_amount)}</span></span>
                  <div className="flex flex-wrap gap-2">
                    {qrisPending && <Button variant="jago" size="sm" onClick={() => setPayId(o.id)}>Bayar QRIS</Button>}
                    {(o.status === "pending" || o.status === "confirmed") && (
                      <Button variant="outline" size="sm" onClick={() => cancel(o)}>Batalkan</Button>
                    )}
                    <Button variant="jagoOutline" size="sm" onClick={() => setReceiptId(o.id)}>Lihat Struk</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={receiptOrder !== undefined} onOpenChange={(o) => !o && setReceiptId(null)}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader><DialogTitle>Struk Digital</DialogTitle></DialogHeader>
          {receiptOrder && <Receipt order={toReceipt(receiptOrder)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={payOrder !== undefined} onOpenChange={(o) => !o && setPayId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Bayar dengan QRIS</DialogTitle></DialogHeader>
          {payOrder && (
            <QrisPayment
              orderId={payOrder.id}
              createdAt={payOrder.created_at}
              total={payOrder.total_amount}
              onPaid={() => { setPayId(null); queryClient.invalidateQueries(); }}
              onExpired={() => queryClient.invalidateQueries()}
            />
          )}
        </DialogContent>
      </Dialog>
    </CustomerShell>
  );
}
