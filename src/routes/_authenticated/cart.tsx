import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, errorMessage } from "@/lib/auth";
import { cartQuery } from "@/lib/queries";
import { removeFromCart, setCartQty } from "@/lib/cart";
import { formatRupiah, SIZE_LABELS, type DrinkSize } from "@/lib/jago";
import { FALLBACK_DRINK_IMAGE } from "@/lib/assets";
import { CustomerShell, EmptyState, LoadingBlock } from "@/components/jago/CustomerShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({
    meta: [
      { title: "Keranjang — Kopi Jago" },
      { name: "description", content: "Cek minuman di keranjangmu sebelum checkout." },
      { property: "og:title", content: "Keranjang — Kopi Jago" },
      { property: "og:description", content: "Cek minuman di keranjangmu sebelum checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const cart = useQuery(cartQuery(userId));
  const items = cart.data ?? [];
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);

  async function change(menuId: number, size: DrinkSize, qty: number) {
    try {
      await setCartQty(userId!, menuId, size, qty);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  async function remove(menuId: number, size: DrinkSize, name: string) {
    try {
      await removeFromCart(userId!, menuId, size);
      toast(`${name} dihapus dari keranjang`);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <CustomerShell title="Keranjang Saya" subtitle="Minuman yang siap kamu pesan">
      {cart.isLoading ? (
        <LoadingBlock />
      ) : items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Keranjang Kosong"
          message="Belum ada minuman di keranjangmu. Yuk pilih kopi favoritmu!"
          action={<Button asChild variant="jago" size="lg"><Link to="/home" hash="menu">Lihat Menu</Link></Button>}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={`${item.menu_id}-${item.size}`} className="jago-card flex items-center gap-4 p-4">
                <img src={item.image_url ?? FALLBACK_DRINK_IMAGE} alt={item.name} className="h-20 w-20 rounded-lg object-contain" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base text-ink">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{SIZE_LABELS[item.size]} · {formatRupiah(item.price)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button aria-label="Kurangi" onClick={() => change(item.menu_id, item.size, item.qty - 1)} className="flex h-8 w-8 items-center justify-center rounded-full border hover:border-primary hover:text-primary">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.qty}</span>
                    <button aria-label="Tambah" onClick={() => change(item.menu_id, item.size, item.qty + 1)} className="flex h-8 w-8 items-center justify-center rounded-full border hover:border-primary hover:text-primary">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <span className="font-display font-black text-primary">{formatRupiah(item.subtotal)}</span>
                  <button aria-label={`Hapus ${item.name}`} onClick={() => remove(item.menu_id, item.size, item.name)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <aside className="jago-card h-fit p-6">
            <h3 className="text-lg">Ringkasan</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal ({items.reduce((s, i) => s + i.qty, 0)} item)</dt><dd className="font-semibold">{formatRupiah(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Ongkir</dt><dd className="font-semibold text-success">GRATIS</dd></div>
              <div className="flex justify-between border-t pt-3 font-display text-base font-black"><dt>Total</dt><dd className="text-primary">{formatRupiah(subtotal)}</dd></div>
            </dl>
            <Button asChild variant="jago" className="mt-6 h-12 w-full">
              <Link to="/checkout">Checkout</Link>
            </Button>
            <Link to="/home" hash="menu" className="mt-3 block text-center text-sm text-primary hover:underline">Tambah minuman lain</Link>
          </aside>
        </div>
      )}
    </CustomerShell>
  );
}
