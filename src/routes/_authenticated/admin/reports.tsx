import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { adminOrdersQuery, aggregateProducts, downloadCsv, type AdminOrder } from "@/lib/admin";
import { formatDate, formatRupiah, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/jago";
import { AdminHeader, EmptyRow, FilterPills, TableCard, td, th } from "@/components/jago/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Admin Kopi Jago" }] }),
  component: Reports,
});

type ReportType = "sales" | "orders" | "products" | "customers";
const iso = (d: Date) => d.toISOString().slice(0, 10);

function Reports() {
  const orders = useQuery(adminOrdersQuery);
  const today = new Date();
  const [type, setType] = useState<ReportType>("sales");
  const [start, setStart] = useState(iso(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [end, setEnd] = useState(iso(today));

  const inRange = useMemo(() => {
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T23:59:59");
    return (orders.data ?? []).filter((o) => {
      const d = new Date(o.created_at);
      return d >= s && d <= e;
    });
  }, [orders.data, start, end]);

  function quick(days: number) {
    const s = new Date();
    s.setDate(s.getDate() - days + 1);
    setStart(iso(s));
    setEnd(iso(new Date()));
  }

  const completed = inRange.filter((o) => o.status === "completed");
  const revenue = completed.reduce((s, o) => s + o.total_amount, 0);
  const products = aggregateProducts(inRange.filter((o) => o.status !== "cancelled"));
  const customers = aggregateCustomers(inRange);

  function exportCsv() {
    const name = `kopi-jago-${type}-${start}_${end}.csv`;
    if (type === "products") return downloadCsv(name, [["Product", "Qty Sold", "Revenue"], ...products.map((p) => [p.name, p.qty, p.revenue])]);
    if (type === "customers") return downloadCsv(name, [["Customer", "Email", "Orders", "Total Spent"], ...customers.map((c) => [c.name, c.email ?? "", c.orders, c.spent])]);
    const rows = type === "sales" ? completed : inRange;
    downloadCsv(name, [["Order #", "Customer", "Status", "Payment", "Total", "Date"], ...rows.map((o) => [o.order_number, o.customer_name, o.status, o.payment_status, o.total_amount, o.created_at])]);
  }

  return (
    <>
      <AdminHeader title="Reports" subtitle="Generate and export business reports" />
      <div className="jago-card mb-6 flex flex-wrap items-end gap-4 p-6">
        <div>
          <p className="jago-label mb-2 text-[11px] text-muted-foreground">Report Type</p>
          <FilterPills value={type} onChange={setType} options={[{ key: "sales", label: "Sales" }, { key: "orders", label: "Orders" }, { key: "products", label: "Products" }, { key: "customers", label: "Customers" }]} />
        </div>
        <div><p className="jago-label mb-2 text-[11px] text-muted-foreground">Start</p><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div><p className="jago-label mb-2 text-[11px] text-muted-foreground">End</p><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => quick(1)}>Today</Button>
          <Button variant="outline" size="sm" onClick={() => quick(7)}>7 Days</Button>
          <Button variant="outline" size="sm" onClick={() => quick(30)}>30 Days</Button>
        </div>
        <Button variant="jago" className="ml-auto" onClick={exportCsv}><Download /> Export CSV</Button>
      </div>

      {type === "sales" && (
        <div className="mb-6 grid gap-5 sm:grid-cols-3">
          <Metric label="Total Revenue" value={formatRupiah(revenue)} />
          <Metric label="Completed Orders" value={String(completed.length)} />
          <Metric label="Avg Order Value" value={formatRupiah(completed.length ? revenue / completed.length : 0)} />
        </div>
      )}

      <TableCard title={`${type.charAt(0).toUpperCase()}${type.slice(1)} Report (${start} – ${end})`}>
        {type === "products" ? (
          <table className="w-full">
            <thead className="bg-muted/60"><tr><th className={th}>Product</th><th className={th}>Qty Sold</th><th className={th}>Revenue</th></tr></thead>
            <tbody className="divide-y">
              {products.length === 0 ? <EmptyRow cols={3} text="Tidak ada data pada periode ini." /> : products.map((p) => (
                <tr key={p.name}><td className={`${td} font-semibold`}>{p.name}</td><td className={td}>{p.qty}</td><td className={td}>{formatRupiah(p.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        ) : type === "customers" ? (
          <table className="w-full">
            <thead className="bg-muted/60"><tr><th className={th}>Customer</th><th className={th}>Email</th><th className={th}>Orders</th><th className={th}>Total Spent</th></tr></thead>
            <tbody className="divide-y">
              {customers.length === 0 ? <EmptyRow cols={4} text="Tidak ada data pada periode ini." /> : customers.map((c) => (
                <tr key={c.name + c.email}><td className={`${td} font-semibold`}>{c.name}</td><td className={td}>{c.email}</td><td className={td}>{c.orders}</td><td className={td}>{formatRupiah(c.spent)}</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full">
            <thead className="bg-muted/60"><tr><th className={th}>Order #</th><th className={th}>Customer</th><th className={th}>Status</th><th className={th}>Total</th><th className={th}>Date</th></tr></thead>
            <tbody className="divide-y">
              {(type === "sales" ? completed : inRange).length === 0 ? <EmptyRow cols={5} text="Tidak ada data pada periode ini." /> : (type === "sales" ? completed : inRange).map((o) => (
                <tr key={o.id}><td className={`${td} font-semibold`}>{o.order_number}</td><td className={td}>{o.customer_name}</td><td className={td}>{ORDER_STATUS_LABEL[o.status as OrderStatus]}</td><td className={td}>{formatRupiah(o.total_amount)}</td><td className={td}>{formatDate(o.created_at)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="jago-card p-6">
      <p className="jago-label text-[11px] text-muted-foreground">{label}</p>
      <p className="font-display mt-2 text-2xl font-black text-primary">{value}</p>
    </div>
  );
}

function aggregateCustomers(orders: AdminOrder[]) {
  const map = new Map<string, { name: string; email: string | null; orders: number; spent: number }>();
  for (const o of orders) {
    const key = o.user_id ?? o.customer_name;
    const r = map.get(key) ?? { name: o.customer_name, email: o.customer_email, orders: 0, spent: 0 };
    r.orders += 1;
    if (o.payment_status === "paid") r.spent += o.total_amount;
    map.set(key, r);
  }
  return [...map.values()].sort((a, b) => b.spent - a.spent);
}
