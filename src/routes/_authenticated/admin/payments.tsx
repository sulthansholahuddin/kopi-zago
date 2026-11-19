import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, Wallet, XCircle } from "lucide-react";
import { adminOrdersQuery } from "@/lib/admin";
import { formatDate, formatRupiah, PAYMENT_STATUS_LABEL, paymentMethodLabel, type PaymentStatus } from "@/lib/jago";
import { AdminHeader, EmptyRow, FilterPills, StatCard, TableCard, td, th } from "@/components/jago/AdminUi";
import { StatusBadge } from "@/components/jago/Receipt";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  head: () => ({ meta: [{ title: "Payments — Admin Kopi Jago" }] }),
  component: Payments,
});

function Payments() {
  const orders = useQuery(adminOrdersQuery);
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");
  const all = orders.data ?? [];
  const list = all.filter((o) => filter === "all" || o.payment_status === filter);
  const sum = (s: PaymentStatus) => all.filter((o) => o.payment_status === s);

  return (
    <>
      <AdminHeader title="Payments" subtitle="Status pembayaran semua pesanan (mode demo, tanpa uang sungguhan)" />
      <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Paid Revenue" value={formatRupiah(sum("paid").reduce((s, o) => s + o.total_amount, 0))} icon={<Wallet className="h-5 w-5" />} tone="green" />
        <StatCard label="Paid" value={sum("paid").length} icon={<CheckCircle2 className="h-5 w-5" />} tone="blue" />
        <StatCard label="Pending" value={sum("pending").length} icon={<Clock className="h-5 w-5" />} tone="orange" />
        <StatCard label="Failed / Refunded" value={sum("failed").length + sum("refunded").length} icon={<XCircle className="h-5 w-5" />} tone="red" />
      </div>
      <TableCard
        actions={
          <FilterPills
            value={filter}
            onChange={setFilter}
            options={[{ key: "all", label: "All" }, ...(Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[]).map((s) => ({ key: s, label: PAYMENT_STATUS_LABEL[s] }))]}
          />
        }
      >
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr><th className={th}>Order #</th><th className={th}>Customer</th><th className={th}>Method</th><th className={th}>Amount</th><th className={th}>Payment</th><th className={th}>Date</th><th className={th}></th></tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 ? (
              <EmptyRow cols={7} text={orders.isLoading ? "Memuat..." : "Tidak ada pembayaran."} />
            ) : (
              list.map((o) => (
                <tr key={o.id} className="hover:bg-muted/40">
                  <td className={`${td} font-semibold`}>{o.order_number}</td>
                  <td className={td}>{o.customer_name}</td>
                  <td className={td}>{paymentMethodLabel(o.payment_method)}</td>
                  <td className={td}>{formatRupiah(o.total_amount)}</td>
                  <td className={td}><StatusBadge status={o.payment_status} label={PAYMENT_STATUS_LABEL[o.payment_status as PaymentStatus]} /></td>
                  <td className={td}>{formatDate(o.created_at)}</td>
                  <td className={td}><Button asChild size="sm" variant="jagoOutline"><Link to="/admin/orders" search={{ id: o.id }}>Manage</Link></Button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableCard>
    </>
  );
}
