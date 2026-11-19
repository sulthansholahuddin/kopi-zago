import { Link } from "@tanstack/react-router";
import { ASSETS } from "@/lib/assets";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4 md:px-8">
        <div>
          <img src={ASSETS.logo} alt="Jago Coffee" className="h-9 w-auto" />
          <p className="mt-4 text-sm leading-relaxed text-ink-foreground/70">
            Kopi berkualitas premium dari 100% Arabica, diantar langsung ke lokasimu. Cepat, segar, terjangkau.
          </p>
        </div>
        <div>
          <h4 className="jago-label text-sm">Menu</h4>
          <ul className="mt-4 space-y-3 text-sm text-ink-foreground/70">
            <li><Link to="/home" className="hover:text-primary">Home</Link></li>
            <li><Link to="/home" hash="menu" className="hover:text-primary">Menu</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="jago-label text-sm">Account</h4>
          <ul className="mt-4 space-y-3 text-sm text-ink-foreground/70">
            <li><Link to="/orders" className="hover:text-primary">My Orders</Link></li>
            <li><Link to="/cart" className="hover:text-primary">Cart</Link></li>
            <li><Link to="/energy" className="hover:text-primary">Energy Rewards</Link></li>
            <li><Link to="/profile" className="hover:text-primary">Profile</Link></li>
          </ul>
        </div>
        <div className="rounded-xl bg-primary p-6 text-center text-primary-foreground">
          <span className="jago-label rounded-full bg-primary-foreground/20 px-3 py-1 text-[10px]">Special</span>
          <h3 className="mt-3 text-2xl">Free Delivery</h3>
          <p className="mt-2 text-sm text-primary-foreground/90">Never a delivery fee when you order from Jago Coffee!</p>
          <Link
            to="/home"
            hash="menu"
            className="jago-label mt-4 inline-block rounded bg-primary-foreground px-5 py-2 text-xs text-primary"
          >
            Order Now
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-ink-foreground/10 px-6 py-6 text-center text-sm text-ink-foreground/50">
        © 2026 Kopi Jago. Minuman favorit, diantar dengan jago.
      </div>
    </footer>
  );
}
