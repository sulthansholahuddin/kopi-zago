import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cartQuery, notificationsQuery } from "@/lib/queries";
import { ASSETS } from "@/lib/assets";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/jago";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function SiteNavbar({ overlay = false }: { overlay?: boolean }) {
  const { session, isAdmin, displayName, signOut } = useAuth();
  const userId = session?.user.id;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: cart } = useQuery(cartQuery(userId));
  const cartCount = (cart ?? []).reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !overlay || scrolled || open;
  const links = [
    { to: "/home", label: "Home", hash: undefined },
    { to: "/home", label: "Menu", hash: "menu" },
    { to: "/cart", label: `Keranjang (${cartCount})`, hash: undefined },
    { to: "/wishlist", label: "Wishlist", hash: undefined },
    { to: "/orders", label: "Pesanan", hash: undefined },
    { to: "/energy", label: "Energy", hash: undefined },
  ] as const;

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solid ? "bg-primary py-3 shadow-lg" : "bg-transparent py-5",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
        <Link to="/home" className="shrink-0">
          <img src={ASSETS.logo} alt="Jago Coffee" className="h-9 w-auto" />
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <li key={l.label}>
              <Link to={l.to} {...(l.hash ? { hash: l.hash } : {})} className="jago-nav-link" activeOptions={{ exact: true, includeHash: true }}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 lg:flex">
          {session ? (
            <>
              <span className="text-sm font-semibold text-primary-foreground">Halo, {displayName}</span>
              {isAdmin && (
                <Link to="/admin" className="jago-nav-link rounded-full border-2 border-primary-foreground px-3 py-1">
                  Admin
                </Link>
              )}
              <NotificationBell userId={userId!} />
              <Link to="/checkout" title="Checkout" aria-label="Checkout" className="rounded-full bg-primary-foreground p-1">
                <img src={ASSETS.checkoutIcon} alt="" className="h-7 w-7" />
              </Link>
              <button onClick={signOut} className="jago-nav-link">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="jago-nav-link">
                Login
              </Link>
              <Link
                to="/login"
                search={{ mode: "register" }}
                className="jago-nav-link rounded-full border-2 border-primary-foreground px-5 py-2"
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        <button
          className="text-primary-foreground lg:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-primary-foreground/20 px-5 pb-5 pt-3 lg:hidden">
          <ul className="flex flex-col gap-4">
            {links.map((l) => (
              <li key={l.label}>
                <Link to={l.to} {...(l.hash ? { hash: l.hash } : {})} className="jago-nav-link" onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
            {session ? (
              <>
                <li>
                  <Link to="/profile" className="jago-nav-link" onClick={() => setOpen(false)}>
                    Profil ({displayName})
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link to="/admin" className="jago-nav-link">
                      Admin
                    </Link>
                  </li>
                )}
                <li>
                  <button onClick={signOut} className="jago-nav-link">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/login" className="jago-nav-link">
                  Login / Daftar
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}

function NotificationBell({ userId }: { userId: string }) {
  const { data, refetch } = useQuery(notificationsQuery(userId));
  const unread = (data ?? []).filter((n) => !n.read_at);

  async function markAllRead() {
    if (!unread.length) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in(
        "id",
        unread.map((n) => n.id),
      );
    refetch();
  }

  return (
    <Popover onOpenChange={(o) => o && markAllRead()}>
      <PopoverTrigger className="relative text-primary-foreground" aria-label="Notifikasi">
        <Bell className="h-6 w-6" />
        {unread.length > 0 && (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-jago-yellow px-1 text-[10px] font-bold text-ink">
            {unread.length}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="jago-label border-b px-4 py-3 text-xs">Notifikasi</div>
        <div className="max-h-96 overflow-y-auto">
          {(data ?? []).length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Belum ada notifikasi.</p>
          ) : (
            data!.map((n) => (
              <div key={n.id} className="border-b px-4 py-3 last:border-0">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
