import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminCustomersQuery, adminOrdersQuery, type Customer } from "@/lib/admin";
import { formatDate, formatRupiah } from "@/lib/jago";
import { AdminHeader, EmptyRow, TableCard, td, th } from "@/components/jago/AdminUi";
import { StatusBadge } from "@/components/jago/Receipt";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Admin Kopi Jago" }] }),
  component: AdminCustomers,
});

function AdminCustomers() {
  const customers = useQuery(adminCustomersQuery);
  const orders = useQuery(adminOrdersQuery);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const stats = new Map<string, { count: number; spent: number; last: string | null }>();
  for (const o of orders.data ?? []) {
    if (!o.user_id) continue;
    const s = stats.get(o.user_id) ?? { count: 0, spent: 0, last: null };
    s.count += 1;
    if (o.payment_status === "paid") s.spent += o.total_amount;
    if (!s.last || o.created_at > s.last) s.last = o.created_at;
    stats.set(o.user_id, s);
  }
  const list = (customers.data ?? []).filter(
    (c) => !q || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q.toLowerCase()),
  );
  const custOrders = (orders.data ?? []).filter((o) => o.user_id === selected?.id);

  return (
    <>
      <AdminHeader title="Customers" subtitle={`${list.length} customers`} />
      <TableCard
        actions={
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, email, telepon..." className="h-9 w-72 rounded-md border bg-background px-3 text-sm" />
        }
      >
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <th className={th}>Name</th><th className={th}>Email</th><th className={th}>Phone</th><th className={th}>Orders</th>
              <th className={th}>Total Spent</th><th className={th}>Last Order</th><th className={th}>Joined</th><th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 ? (
              <EmptyRow cols={8} text={customers.isLoading ? "Memuat..." : "Belum ada customer."} />
            ) : (
              list.map((c) => {
                const s = stats.get(c.id);
                return (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className={`${td} font-semibold`}>{c.name || "-"}</td>
                    <td className={td}>{c.email}</td>
                    <td className={td}>{c.phone ?? "-"}</td>
                    <td className={td}>{s?.count ?? 0}</td>
                    <td className={td}>{formatRupiah(s?.spent ?? 0)}</td>
                    <td className={td}>{s?.last ? formatDate(s.last, false) : "-"}</td>
                    <td className={td}>{formatDate(c.created_at, false)}</td>
                    <td className={td}><Button size="sm" variant="jagoOutline" onClick={() => setSelected(c)}>View</Button></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableCard>

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {selected && (
            <>
              <DialogHeader><DialogTitle>{selected.name || selected.email}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Email</p><p className="font-semibold">{selected.email}</p></div>
                <div><p className="text-xs text-muted-foreground">Telepon</p><p className="font-semibold">{selected.phone ?? "-"}</p></div>
                <div><p className="text-xs text-muted-foreground">Tanggal Lahir</p><p className="font-semibold">{selected.birth_date ? formatDate(selected.birth_date, false) : "-"}</p></div>
                <div><p className="text-xs text-muted-foreground">Bergabung</p><p className="font-semibold">{formatDate(selected.created_at, false)}</p></div>
              </div>
              <h4 className="mt-2 text-sm">Riwayat Pesanan ({custOrders.length})</h4>
              <ul className="divide-y rounded-lg border text-sm">
                {custOrders.length === 0 && <li className="px-4 py-4 text-muted-foreground">Belum ada pesanan.</li>}
                {custOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between px-4 py-2">
                    <div>
                      <p className="font-semibold">{o.order_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatRupiah(o.total_amount)}</p>
                      <StatusBadge status={o.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
