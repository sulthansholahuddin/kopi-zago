import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchOrders, type OrderWithItems } from "@/lib/queries";

export type AdminOrder = OrderWithItems & { customer_name: string; customer_email: string | null; customer_phone: string | null };

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  created_at: string;
  is_active: boolean;
};

export const adminCustomersQuery = queryOptions({
  queryKey: ["admin", "customers"],
  queryFn: async (): Promise<Customer[]> => {
    const [{ data: profiles, error }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (error) throw error;
    const admins = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
    return (profiles ?? []).filter((p) => !admins.has(p.id));
  },
});

export const adminOrdersQuery = queryOptions({
  queryKey: ["admin", "orders"],
  queryFn: async (): Promise<AdminOrder[]> => {
    const [orders, { data: profiles }] = await Promise.all([
      fetchOrders(),
      supabase.from("profiles").select("id, name, email, phone"),
    ]);
    const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
    return orders.map((o) => {
      const p = o.user_id ? byId.get(o.user_id) : undefined;
      return {
        ...o,
        subtotal: Number(o.subtotal),
        total_amount: Number(o.total_amount),
        customer_name: p?.name || "Unknown",
        customer_email: p?.email ?? null,
        customer_phone: p?.phone ?? null,
      };
    });
  },
  refetchInterval: 30_000,
});

export const adminMenuQuery = queryOptions({
  queryKey: ["admin", "menu"],
  queryFn: async () => {
    const [{ data: items, error }, { data: cats }] = await Promise.all([
      supabase.from("menu_items").select("*, menu_sizes(size, price)").order("id"),
      supabase.from("menu_categories").select("*").order("id"),
    ]);
    if (error) throw error;
    return { items: items ?? [], categories: cats ?? [] };
  },
});

export function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function aggregateProducts(orders: AdminOrder[]) {
  const map = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders)
    for (const i of o.order_items) {
      const r = map.get(i.name) ?? { name: i.name, qty: 0, revenue: 0 };
      r.qty += i.qty;
      r.revenue += Number(i.price) * i.qty;
      map.set(i.name, r);
    }
  return [...map.values()].sort((a, b) => b.qty - a.qty);
}

