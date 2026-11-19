import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, errorMessage } from "@/lib/auth";
import { wishlistQuery } from "@/lib/queries";
import { addToCart } from "@/lib/cart";
import { formatRupiah } from "@/lib/jago";
import { FALLBACK_DRINK_IMAGE } from "@/lib/assets";
import { CustomerShell, EmptyState, LoadingBlock } from "@/components/jago/CustomerShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist Saya — Kopi Jago" },
      { name: "description", content: "Minuman favoritmu yang disimpan." },
      { property: "og:title", content: "Wishlist Saya — Kopi Jago" },
      { property: "og:description", content: "Minuman favoritmu yang disimpan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const list = useQuery(wishlistQuery(userId));

  async function remove(menuId: number) {
    const { error } = await supabase.from("wishlist").delete().eq("user_id", userId!).eq("menu_id", menuId);
    if (error) { toast.error(error.message); return; }
    toast("Dihapus dari wishlist");
    queryClient.invalidateQueries({ queryKey: ["wishlist"] });
  }
  async function toCart(menuId: number, name: string) {
    try {
      await addToCart(userId!, menuId, "medium");
      toast.success(`${name} (Medium) ditambahkan ke keranjang`);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const rows = list.data ?? [];
  return (
    <CustomerShell title="Wishlist Saya" subtitle="Minuman favoritmu yang disimpan">
      {list.isLoading ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="💝"
          title="Wishlist Kosong"
          message="Tekan ikon hati di menu untuk menyimpan minuman favoritmu."
          action={<Button asChild variant="jago" size="lg"><Link to="/home" hash="menu">Lihat Menu</Link></Button>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((w) => {
            const m = w.menu_items;
            if (!m) return null;
            const available = m.is_available && m.stock > 0;
            return (
              <div key={w.menu_id} className="jago-card jago-lift overflow-hidden">
                <div className="relative flex h-52 items-center justify-center">
                  <img src={m.image_url ?? FALLBACK_DRINK_IMAGE} alt={m.name} className="h-44 w-44 object-contain" />
                  <button onClick={() => remove(w.menu_id)} aria-label={`Hapus ${m.name} dari wishlist`} className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card">
                    <Heart className="h-5 w-5 fill-primary text-primary" />
                  </button>
                </div>
                <div className="p-5">
                  <h3 className="text-base text-ink">{m.name}</h3>
                  {m.description && <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-lg font-black text-primary">{formatRupiah(m.price)}</span>
                    <Button variant="jago" size="sm" disabled={!available} onClick={() => toCart(m.id, m.name)}>
                      {available ? "+ Keranjang" : "Habis"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CustomerShell>
  );
}
