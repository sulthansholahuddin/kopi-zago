import { Heart, Plus } from "lucide-react";
import type { MenuItem } from "@/lib/queries";
import { formatRupiah } from "@/lib/jago";
import { FALLBACK_DRINK_IMAGE } from "@/lib/assets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProductCard({
  item,
  inWishlist,
  showWishlist,
  onAdd,
  onToggleWishlist,
}: {
  item: MenuItem;
  inWishlist: boolean;
  showWishlist: boolean;
  onAdd: () => void;
  onToggleWishlist: () => void;
}) {
  const available = item.is_available && item.stock > 0;
  const medium = item.sizes.find((s) => s.size === "medium")?.price ?? item.price;
  return (
    <div className={cn("jago-card jago-lift flex flex-col overflow-hidden", !available && "opacity-70")}>
      <div className="relative flex h-56 items-center justify-center bg-card">
        <img src={item.image_url ?? FALLBACK_DRINK_IMAGE} alt={item.name} className="h-48 w-48 object-contain" />
        {!available && (
          <span className="jago-label absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-[10px] text-ink-foreground">Habis</span>
        )}
        {showWishlist && (
          <button
            onClick={onToggleWishlist}
            aria-label={inWishlist ? "Hapus dari wishlist" : "Tambah ke wishlist"}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-card"
          >
            <Heart className={cn("h-5 w-5", inWishlist ? "fill-primary text-primary" : "text-muted-foreground")} />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base text-ink">{item.name}</h3>
        {item.description && <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            {item.sizes.length > 1 && <span className="block text-xs text-muted-foreground">Mulai dari</span>}
            <span className="font-display text-lg font-black text-primary">{formatRupiah(medium)}</span>
          </div>
          {available ? (
            <Button variant="jago" size="sm" onClick={onAdd} className="px-4">
              <Plus /> Keranjang
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Tidak Tersedia
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
