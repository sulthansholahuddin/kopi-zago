import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DrinkSize } from "@/lib/jago";

export type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  stock: number;
  category_id: number;
  category: string;
  sizes: { size: DrinkSize; price: number }[];
};

const SIZE_ORDER: DrinkSize[] = ["small", "medium", "large"];

export const menuQuery = queryOptions({
  queryKey: ["menu"],
  queryFn: async (): Promise<MenuItem[]> => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*, menu_categories(name), menu_sizes(size, price)")
      .eq("is_available", true)
      .order("is_featured", { ascending: false })
      .order("name");
    if (error) throw error;
    return (data ?? []).map((m) => ({
      ...m,
      price: Number(m.price),
      category: m.menu_categories?.name ?? "",
      sizes: [...(m.menu_sizes ?? [])]
        .map((s) => ({ size: s.size as DrinkSize, price: Number(s.price) }))
        .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)),
    }));
  },
});

export type CartLine = {
  menu_id: number;
  size: DrinkSize;
  qty: number;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  subtotal: number;
};

export function cartQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["cart", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<CartLine[]> => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("menu_id, size, qty, created_at, menu_items(name, description, image_url, price, is_available, menu_sizes(size, price))")
        .order("created_at");
      if (error) throw error;
      return (data ?? [])
        .filter((c) => c.menu_items?.is_available)
        .map((c) => {
          const m = c.menu_items!;
          const sized = m.menu_sizes?.find((s) => s.size === c.size);
          const price = Number(sized?.price ?? m.price);
          return {
            menu_id: c.menu_id,
            size: c.size as DrinkSize,
            qty: c.qty,
            name: m.name,
            description: m.description,
            image_url: m.image_url,
            price,
            subtotal: price * c.qty,
          };
        });
    },
  });
}

export function wishlistQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["wishlist", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select("menu_id, created_at, menu_items(id, name, description, price, image_url, is_available, stock)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type OrderWithItems = {
  id: number;
  order_number: string;
  user_id: string | null;
  status: string;
  fulfillment_type: string;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  order_items: { id: number; menu_id: number | null; name: string; size: string; qty: number; price: number }[];
};

export async function fetchOrders(): Promise<OrderWithItems[]> {
  await supabase.rpc("cancel_expired_qris_orders");
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(id, menu_id, name, size, qty, price)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as OrderWithItems[];
}

export function ordersQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["orders", userId],
    enabled: Boolean(userId),
    queryFn: fetchOrders,
  });
}

export function profileQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function energyQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["energy", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("energy_transactions")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const balance = rows.reduce((s, r) => s + r.amount, 0);
      return { balance, history: rows.slice(0, 50) };
    },
  });
}

export const rewardsQuery = queryOptions({
  queryKey: ["rewards"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("energy_rewards")
      .select("*, menu_items(name, image_url)")
      .eq("is_active", true)
      .order("energy_cost");
    if (error) throw error;
    return data ?? [];
  },
});

export function redemptionsQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["redemptions", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("energy_redemptions")
        .select("*, energy_rewards(name, description, reward_type, reward_value)")
        .eq("user_id", userId!)
        .order("redeemed_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function notificationsQuery(userId: string | undefined) {
  return queryOptions({
    queryKey: ["notifications", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });
}
