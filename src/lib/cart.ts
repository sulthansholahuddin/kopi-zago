import { supabase } from "@/integrations/supabase/client";
import type { DrinkSize } from "@/lib/jago";

export async function addToCart(userId: string, menuId: number, size: DrinkSize) {
  const { data: existing } = await supabase
    .from("cart_items")
    .select("qty")
    .eq("user_id", userId)
    .eq("menu_id", menuId)
    .eq("size", size)
    .maybeSingle();
  const qty = Math.min(99, (existing?.qty ?? 0) + 1);
  const { error } = await supabase.from("cart_items").upsert({ user_id: userId, menu_id: menuId, size, qty });
  if (error) throw error;
}

export async function setCartQty(userId: string, menuId: number, size: DrinkSize, qty: number) {
  if (qty < 1) return removeFromCart(userId, menuId, size);
  const { error } = await supabase
    .from("cart_items")
    .update({ qty: Math.min(99, qty) })
    .eq("user_id", userId)
    .eq("menu_id", menuId)
    .eq("size", size);
  if (error) throw error;
}

export async function removeFromCart(userId: string, menuId: number, size: DrinkSize) {
  const { error } = await supabase.from("cart_items").delete().eq("user_id", userId).eq("menu_id", menuId).eq("size", size);
  if (error) throw error;
}
