import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, ShoppingCart, Users, Wallet } from "lucide-react";
import { adminCustomersQuery, adminOrdersQuery, isToday } from "@/lib/admin";
import { formatDate, formatRupiah, PAYMENT_STATUS_LABEL, type PaymentStatus } from "@/lib/jago";
import { AdminHeader, EmptyRow, StatCard, TableCard, td, th } from "@/components/jago/AdminUi";
import { StatusBadge } from "@/components/jago/Receipt";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Admin Kopi Jago" }] }),
  component: Dashboard,
});

function Dashboard() {
  const orders = useQuery(adminOrdersQuery);
  const customers = useQuery(adminCustomersQuery);
  const all = orders.data ?? [];
  const today = all.filter((o) => isToday(o.created_at));
  const pending = all.filter((o) => o.status === "pending");
  const revenueToday = today.filter((o) => o.status === "completed").reduce((s, o) => s + o.total_amount, 0);

  return (
    <>
      <AdminHeader title="Dashboard" subtitle="Real-time operational overview" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Orders Today" value={today.length} hint={`${all.length} total orders`} icon={<ShoppingCart className="h-5 w-5" />} tone="blue" />
        <StatCard label="Pending Orders" value={pending.length} hint="Awaiting confirmation" icon={<Clock className="h-5 w-5" />} tone="orange" />
        <StatCard label="Revenue Today" value={formatRupiah(revenueToday)} hint="From completed orders" icon={<Wallet className="h-5 w-5" />} tone="green" />
        <StatCard label="Customers" value={customers.data?.length ?? 0} hint="Registered users" icon={<Users className="h-5 w-5" />} tone="red" />
      </div>
      <div className="mt-8">
        <TableCard
          title="Recent Orders"
          actions={<Button asChild variant="ghost" size="sm" className="jago-label"><Link to="/admin/orders">View All</Link></Button>}
        >
          <table className="w-full">
            <thead className="bg-muted/60">
              <tr>
                <th className={th}>Order #</th><th className={th}>Customer</th><th className={th}>Total</th>
                <th className={th}>Order Status</th><th className={th}>Payment</th><th className={th}>Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {all.length === 0 ? (
                <EmptyRow cols={6} text={orders.isLoading ? "Memuat..." : "No orders yet. Orders will appear here once customers start placing them."} />
              ) : (
                all.slice(0, 10).map((o) => (
                  <tr key={o.id} className="hover:bg-muted/40">
                    <td className={td}><Link to="/admin/orders" search={{ id: o.id }} className="font-semibold hover:text-primary">{o.order_number}</Link></td>
                    <td className={td}>{o.customer_name}</td>
                    <td className={td}>{formatRupiah(o.total_amount)}</td>
                    <td className={td}><StatusBadge status={o.status} /></td>
                    <td className={td}><StatusBadge status={o.payment_status} label={PAYMENT_STATUS_LABEL[o.payment_status as PaymentStatus]} /></td>
                    <td className={td}>{formatDate(o.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableCard>
      </div>
    </>
  );
}
