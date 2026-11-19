import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/auth";
import { adminOrdersQuery, type AdminOrder } from "@/lib/admin";
import {
  formatDate,
  formatRupiah,
  NEXT_STATUSES,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  paymentMethodLabel,
  SIZE_LABELS,
  type DrinkSize,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/jago";
import { AdminHeader, EmptyRow, FilterPills, TableCard, td, th } from "@/components/jago/AdminUi";
import { StatusBadge } from "@/components/jago/Receipt";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  validateSearch: z.object({ id: z.number().optional() }),
  head: () => ({ meta: [{ title: "Orders — Admin Kopi Jago" }] }),
  component: AdminOrders,
});

type Filter = "all" | OrderStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  ...(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => ({ key: s, label: s.replace("_", " ") })),
];

function AdminOrders() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orders = useQuery(adminOrdersQuery);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const all = orders.data ?? [];
  const list = all
    .filter((o) => filter === "all" || o.status === filter)
    .filter((o) => !q || `${o.order_number} ${o.customer_name} ${o.customer_email}`.toLowerCase().includes(q.toLowerCase()));
  const detail = all.find((o) => o.id === search.id);

  function open(id?: number) {
    navigate({ to: "/admin/orders", search: id ? { id } : {}, replace: true });
  }

  return (
    <>
      <AdminHeader title="Orders" subtitle={`${list.length} of ${all.length} orders`} />
      <TableCard
        actions={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <FilterPills value={filter} options={FILTERS} onChange={setFilter} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari order / customer..."
              className="h-9 w-60 rounded-md border bg-background px-3 text-sm"
            />
          </div>
        }
      >
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <th className={th}>Order #</th><th className={th}>Customer</th><th className={th}>Items</th><th className={th}>Total</th>
              <th className={th}>Status</th><th className={th}>Payment</th><th className={th}>Date</th><th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 ? (
              <EmptyRow cols={8} text={orders.isLoading ? "Memuat..." : "No orders match this filter."} />
            ) : (
              list.map((o) => (
                <tr key={o.id} className="hover:bg-muted/40">
                  <td className={`${td} font-semibold`}>{o.order_number}</td>
                  <td className={td}>{o.customer_name}</td>
                  <td className={td}>{o.order_items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td className={td}>{formatRupiah(o.total_amount)}</td>
                  <td className={td}><StatusBadge status={o.status} /></td>
                  <td className={td}><StatusBadge status={o.payment_status} label={PAYMENT_STATUS_LABEL[o.payment_status as PaymentStatus]} /></td>
                  <td className={td}>{formatDate(o.created_at)}</td>
                  <td className={td}><Button size="sm" variant="jagoOutline" onClick={() => open(o.id)}>View</Button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableCard>

      <Dialog open={detail !== undefined} onOpenChange={(o) => !o && open()}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {detail && <OrderDetail order={detail} onChanged={() => queryClient.invalidateQueries()} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function OrderDetail({ order, onChanged }: { order: AdminOrder; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const next = NEXT_STATUSES[order.status as OrderStatus] ?? [];

  async function setStatus(status: OrderStatus) {
    setBusy(true);
    const { error } =
      status === "cancelled"
        ? await supabase.rpc("cancel_order", { p_order_id: order.id })
        : await supabase.rpc("admin_set_order_status", { p_order_id: order.id, p_status: status });
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success(`Order ${order.order_number} → ${ORDER_STATUS_LABEL[status]}`);
    onChanged();
  }
  async function setPayment(status: PaymentStatus) {
    const { error } = await supabase.rpc("admin_set_payment_status", { p_order_id: order.id, p_status: status });
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success("Payment status updated");
    onChanged();
  }

  return (
    <>
      <DialogHeader><DialogTitle>{order.order_number}</DialogTitle></DialogHeader>
      <div className="space-y-5 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <Info label="Customer" value={order.customer_name} />
          <Info label="Email" value={order.customer_email ?? "-"} />
          <Info label="Telepon" value={order.customer_phone ?? "-"} />
          <Info label="Tanggal" value={formatDate(order.created_at)} />
          <Info label="Tipe" value={order.fulfillment_type === "delivery" ? "Delivery" : "Pickup"} />
          <Info label="Metode Bayar" value={paymentMethodLabel(order.payment_method)} />
        </div>
        <div className="rounded-lg border">
          {order.order_items.map((i) => (
            <div key={i.id} className="flex justify-between border-b px-4 py-2 last:border-0">
              <span>{i.name} ({SIZE_LABELS[i.size as DrinkSize] ?? i.size}) × {i.qty}</span>
              <span className="font-semibold">{formatRupiah(Number(i.price) * i.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between bg-muted/60 px-4 py-2 font-display font-black">
            <span>TOTAL</span><span className="text-primary">{formatRupiah(order.total_amount)}</span>
          </div>
        </div>
        <div>
          <p className="jago-label text-xs text-muted-foreground">Order Status</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            {next.length > 0 && <span className="text-muted-foreground">→</span>}
            {next.map((s) => (
              <Button key={s} size="sm" variant={s === "cancelled" ? "outline" : "jago"} disabled={busy} onClick={() => setStatus(s)}>
                {ORDER_STATUS_LABEL[s]}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <p className="jago-label text-xs text-muted-foreground">Payment Status</p>
          <select
            value={order.payment_status}
            onChange={(e) => setPayment(e.target.value as PaymentStatus)}
            className="mt-2 h-10 w-full rounded-md border bg-background px-3"
          >
            {(Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[]).map((s) => (
              <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
