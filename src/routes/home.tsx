import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { menuQuery, wishlistQuery, type MenuItem } from "@/lib/queries";
import { useAuth, errorMessage } from "@/lib/auth";
import { addToCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { ASSETS } from "@/lib/assets";
import { formatRupiah, SIZE_LABELS, type DrinkSize } from "@/lib/jago";
import { SiteNavbar } from "@/components/jago/SiteNavbar";
import { SiteFooter } from "@/components/jago/SiteFooter";
import { ProductCard } from "@/components/jago/ProductCard";
import { LoadingBlock } from "@/components/jago/CustomerShell";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Menu Jago Coffee — #1 Cafe on Wheels!" },
      { name: "description", content: "Pesan Kopi Jago Signature, Americano, Pink Coco, Matcha Latte dan lainnya mulai Rp8.000. Gratis ongkir." },
      { property: "og:title", content: "Menu Jago Coffee — #1 Cafe on Wheels!" },
      { property: "og:description", content: "Kopi premium 100% Arabica mulai Rp8.000. Gratis ongkir." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const TESTIMONIALS = [
  { text: "Jago makes my life easier! Now I can quickly get my morning coffee because I can spot Jago carts in front of my office. Then when I'm feeling lazy, I can simply order via Jago app without paying the delivery fee.", name: "Kemal" },
  { text: "Honestly, I didn't have any expectations when I tried Jago for the first time. I simply tried it out of curiosity, but turned out I like it so much. The coffee suits my tastebud and not to mention, the price is super affordable for its quality!", name: "Ayu" },
  { text: "I buy Jago almost every day to the point I become besties with the Jagoans! They're so friendly and often give me recommendation. Because I buy often, I also got to redeem Energy points into free drinks, which is very nice.", name: "Rudi" },
  { text: "The cart design and the concept of cafe-on-wheels are really cool! It's giving a whole new experience for customers", name: "Sarah" },
];

// One photo per product on the menu grid (the original site showed each photo once).
function dedupeByImage(items: MenuItem[]) {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = i.image_url ?? i.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;
  const menu = useQuery(menuQuery);
  const wishlist = useQuery(wishlistQuery(userId));
  const wishIds = new Set((wishlist.data ?? []).map((w) => w.menu_id));
  const [sizeFor, setSizeFor] = useState<MenuItem | null>(null);
  const [loginPrompt, setLoginPrompt] = useState<string | null>(null);

  async function add(item: MenuItem, size: DrinkSize) {
    if (!userId) return setLoginPrompt("Login diperlukan untuk menambahkan ke keranjang. Login sekarang?");
    try {
      await addToCart(userId, item.id, size);
      toast.success(`${item.name} (${SIZE_LABELS[size]}) ditambahkan ke keranjang`);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } catch (e) {
      toast.error("Gagal menambahkan ke keranjang: " + errorMessage(e));
    }
  }

  async function toggleWishlist(item: MenuItem) {
    if (!userId) return setLoginPrompt("Login diperlukan untuk menambahkan ke wishlist. Login sekarang?");
    const inList = wishIds.has(item.id);
    const { error } = inList
      ? await supabase.from("wishlist").delete().eq("user_id", userId).eq("menu_id", item.id)
      : await supabase.from("wishlist").insert({ user_id: userId, menu_id: item.id });
    if (error) { toast.error("Gagal mengubah wishlist: " + error.message); return; }
    toast(inList ? "Dihapus dari wishlist" : "Ditambahkan ke wishlist");
    queryClient.invalidateQueries({ queryKey: ["wishlist"] });
  }

  const items = menu.data ?? [];
  const groups = [
    { title: "Kopi", items: dedupeByImage(items.filter((i) => i.category === "Kopi")) },
    { title: "Non Kopi", items: dedupeByImage(items.filter((i) => i.category === "Non Kopi")) },
  ];

  return (
    <div className="bg-background">
      <SiteNavbar overlay />

      <section className="relative flex h-screen min-h-[560px] items-center justify-center overflow-hidden bg-ink">
        <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover">
          <source src={ASSETS.videoHero} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-ink/60" />
        <div className="relative z-10 px-6 text-center text-primary-foreground">
          <h1 className="text-5xl md:text-7xl">Jago Coffee</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg">
            Kopi berkualitas premium, diantar langsung ke tempatmu.
            <br />
            Cepat, segar, dan terjangkau.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild variant="hero" size="xl">
              <a href="#menu">Pesan Sekarang</a>
            </Button>
            <Button asChild variant="heroOutline" size="xl">
              <a href="#menu">Browse Menu</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl text-ink md:text-5xl">A Cart That Grew With The People</h2>
        <img src={ASSETS.gerobak} alt="Gerobak Jago Coffee" className="mx-auto mt-10 w-full max-w-xl" />
      </section>

      <section id="menu" className="scroll-mt-20 bg-cream px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl text-ink md:text-5xl">Curious About Jago Coffee?</h2>
            <p className="font-display mt-4 text-xl font-bold uppercase text-muted-foreground">Get Yours Now!</p>
          </div>
          {menu.isLoading ? (
            <LoadingBlock />
          ) : menu.isError ? (
            <div className="mt-10 text-center">
              <p className="text-muted-foreground">Gagal memuat menu.</p>
              <Button variant="jagoOutline" className="mt-4" onClick={() => menu.refetch()}>Coba lagi</Button>
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.title} className="mt-14">
                <h3 className="text-center text-2xl text-ink md:text-3xl">{g.title}</h3>
                {g.items.length === 0 ? (
                  <p className="mt-6 text-center text-muted-foreground">Belum ada menu {g.title.toLowerCase()}</p>
                ) : (
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {g.items.map((item) => (
                      <ProductCard
                        key={item.id}
                        item={item}
                        showWishlist={Boolean(userId)}
                        inWishlist={wishIds.has(item.id)}
                        onAdd={() => (item.sizes.length > 1 ? setSizeFor(item) : add(item, "medium"))}
                        onToggleWishlist={() => toggleWishlist(item)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="bg-cream px-5 pb-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl text-ink md:text-5xl">What Our Customers Are Saying</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="jago-card jago-lift p-7">
                <p className="text-sm leading-relaxed">{t.text}</p>
                <p className="jago-label mt-5 text-xs">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <h2 className="text-3xl text-ink md:text-4xl">Ready To Get Your Jago Coffee?</h2>
        <p className="mt-3 text-muted-foreground">Find your nearest Jagoan or browse our menu to order now!</p>
        <Button asChild variant="hero" size="xl" className="mt-8">
          <a href="#menu">Browse Menu</a>
        </Button>
      </section>

      <SiteFooter />

      <Dialog open={sizeFor !== null} onOpenChange={(o) => !o && setSizeFor(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{sizeFor?.name}</DialogTitle>
            <DialogDescription>Pilih ukuran:</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {sizeFor?.sizes.map((s) => (
              <button
                key={s.size}
                onClick={() => {
                  const item = sizeFor;
                  setSizeFor(null);
                  add(item, s.size);
                }}
                className="jago-label flex w-full items-center justify-between rounded-lg border-2 border-primary px-4 py-3 text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <span>{SIZE_LABELS[s.size]}</span>
                <span>{formatRupiah(s.price)}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={loginPrompt !== null} onOpenChange={(o) => !o && setLoginPrompt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>{loginPrompt}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLoginPrompt(null)}>Nanti</Button>
            <Button variant="jago" onClick={() => navigate({ to: "/login", search: { redirect: "/home#menu" } })}>
              Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

