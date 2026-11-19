import { useState, type ReactElement } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminOrdersQuery, aggregateProducts } from "@/lib/admin";
import { formatRupiah, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/jago";
import { AdminHeader, FilterPills } from "@/components/jago/AdminUi";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Admin Kopi Jago" }] }),
  component: Analytics,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--ink)", "var(--muted-foreground)"];

function Analytics() {
  const orders = useQuery(adminOrdersQuery);
  const [period, setPeriod] = useState<"7" | "30" | "90">("7");
  const days = Number(period);
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days + 1);
  const list = (orders.data ?? []).filter((o) => new Date(o.created_at) >= cutoff);
  const completed = list.filter((o) => o.status === "completed");
  const revenue = completed.reduce((s, o) => s + o.total_amount, 0);

  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(cutoff);
    d.setDate(d.getDate() + i);
    const key = d.toDateString();
    const dayOrders = list.filter((o) => new Date(o.created_at).toDateString() === key);
    return {
      label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      revenue: dayOrders.filter((o) => o.status === "completed").reduce((s, o) => s + o.total_amount, 0),
      orders: dayOrders.length,
    };
  });
  const top = aggregateProducts(list.filter((o) => o.status !== "cancelled")).slice(0, 6);
  const statusData = (Object.keys(ORDER_STATUS_LABEL) as OrderStatus[])
    .map((s) => ({ name: ORDER_STATUS_LABEL[s], value: list.filter((o) => o.status === s).length }))
    .filter((d) => d.value > 0);

  return (
    <>
      <AdminHeader
        title="Analytics"
        subtitle="Sales performance and trends"
        actions={<FilterPills value={period} onChange={setPeriod} options={[{ key: "7", label: "7 Days" }, { key: "30", label: "30 Days" }, { key: "90", label: "90 Days" }]} />}
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label={`Total Revenue (${days}d)`} value={formatRupiah(revenue)} />
        <Summary label="Total Orders" value={String(list.length)} />
        <Summary label="Avg Order Value" value={formatRupiah(completed.length ? revenue / completed.length : 0)} />
        <Summary label="Unique Customers" value={String(new Set(list.map((o) => o.user_id)).size)} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard title="Revenue">
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" fontSize={11} />
            <YAxis fontSize={11} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip formatter={(v: number) => formatRupiah(v)} />
            <Line type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={3} dot={false} />
          </LineChart>
        </ChartCard>
        <ChartCard title="Orders">
          <BarChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" fontSize={11} />
            <YAxis fontSize={11} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="orders" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Top Products">
          <BarChart data={top} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" fontSize={11} allowDecimals={false} />
            <YAxis type="category" dataKey="name" fontSize={11} width={120} />
            <Tooltip />
            <Bar dataKey="qty" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>
        <ChartCard title="Order Status">
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" isAnimationActive={false} innerRadius={60} outerRadius={100} label={(d) => d.name}>
              {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ChartCard>
      </div>
    </>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="jago-card p-6">
      <p className="font-display text-2xl font-black text-ink">{value}</p>
      <p className="jago-label mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactElement }) {
  return (
    <div className="jago-card p-6">
      <h3 className="mb-4 text-base">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </div>
  );
}
