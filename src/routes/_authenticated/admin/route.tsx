import { useState } from "react";
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Boxes, CreditCard, FileText, Home, LayoutGrid, Menu as MenuIcon, QrCode, ShoppingCart, Users, UtensilsCrossed, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { adminMenuQuery, adminOrdersQuery } from "@/lib/admin";
import { ASSETS } from "@/lib/assets";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const userId = (context as { user?: { id: string } }).user?.id;
    if (!userId) throw redirect({ to: "/login" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/home" });
  },
  head: () => ({
    meta: [
      { title: "Admin — Kopi Jago" },
      { name: "description", content: "Panel admin Kopi Jago untuk pesanan, menu, stok, pelanggan, dan laporan." },
      { property: "og:title", content: "Admin — Kopi Jago" },
      { property: "og:description", content: "Panel admin Kopi Jago." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: "pending" },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/menu", label: "Menu & Products", icon: UtensilsCrossed },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes, badge: "lowstock" },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/reports", label: "Reports", icon: FileText },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/qr", label: "Energy QR", icon: QrCode },
] as const;

function AdminLayout() {
  const { displayName, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const orders = useQuery(adminOrdersQuery);
  const menu = useQuery(adminMenuQuery);
  const pending = (orders.data ?? []).filter((o) => o.status === "pending").length;
  const lowStock = (menu.data?.items ?? []).filter((i) => i.stock < 10).length;

  return (
    <div className="min-h-screen bg-muted">
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b bg-card px-5">
        <div className="flex items-center gap-4">
          <button className="lg:hidden" aria-label="Toggle sidebar" onClick={() => setOpen((v) => !v)}>
            {open ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
          <Link to="/admin" className="rounded-md bg-primary px-3 py-1.5">
            <img src={ASSETS.logo} alt="Jago Coffee" className="h-6 w-auto" />
          </Link>
          <span className="jago-label hidden text-xs text-muted-foreground sm:inline">Admin Panel</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold">{displayName || "Admin"}</span>
          <button onClick={signOut} className="jago-label text-xs hover:text-primary">Logout</button>
        </div>
      </header>

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-16 z-30 w-64 overflow-y-auto border-r bg-sidebar p-3 transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <nav className="space-y-1">
          {NAV.map((n) => {
            const count = "badge" in n ? (n.badge === "pending" ? pending : lowStock) : 0;
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: "exact" in n && n.exact }}
                className="flex items-center gap-3 rounded-lg border-l-4 border-transparent px-4 py-2.5 text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent data-[status=active]:border-primary data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground"
              >
                <n.icon className="h-5 w-5" />
                <span className="flex-1">{n.label}</span>
                {count > 0 && (
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] text-primary-foreground", "badge" in n && n.badge === "pending" ? "bg-primary" : "bg-jago-orange")}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="my-3 border-t" />
          <Link to="/home" className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-sidebar-foreground hover:bg-sidebar-accent">
            <Home className="h-5 w-5" /> View Customer Site
          </Link>
        </nav>
      </aside>

      <main className="px-5 pb-16 pt-24 lg:pl-72 lg:pr-8">
        <Outlet />
      </main>
    </div>
  );
}
