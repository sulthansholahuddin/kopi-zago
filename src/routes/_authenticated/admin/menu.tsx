import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminMenuQuery } from "@/lib/admin";
import { LANDING_DRINKS, FALLBACK_DRINK_IMAGE } from "@/lib/assets";
import { formatRupiah, sizePrice } from "@/lib/jago";
import { AdminHeader, EmptyRow, TableCard, td, th } from "@/components/jago/AdminUi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  head: () => ({ meta: [{ title: "Menu & Products — Admin Kopi Jago" }] }),
  component: AdminMenu,
});

type Draft = {
  id?: number;
  name: string;
  category_id: number;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  is_available: boolean;
  is_featured: boolean;
};

function AdminMenu() {
  const queryClient = useQueryClient();
  const menu = useQuery(adminMenuQuery);
  const [draft, setDraft] = useState<Draft | null>(null);
  const items = menu.data?.items ?? [];
  const cats = menu.data?.categories ?? [];
  const catName = (id: number) => cats.find((c) => c.id === id)?.name ?? "-";

  async function toggle(id: number, field: "is_available" | "is_featured", value: boolean) {
    const { error } = await supabase.from("menu_items").update(field === "is_available" ? { is_available: value } : { is_featured: value }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Menu updated");
    queryClient.invalidateQueries();
  }

  async function save(d: Draft) {
    if (!d.name.trim()) { toast.warning("Nama produk wajib diisi"); return; }
    if (!(d.price > 0)) { toast.warning("Harga harus lebih dari 0"); return; }
    const row = {
      name: d.name.trim(),
      category_id: d.category_id,
      description: d.description.trim() || null,
      price: d.price,
      stock: Math.max(0, Math.floor(d.stock)),
      image_url: d.image_url || null,
      is_available: d.is_available,
      is_featured: d.is_featured,
    };
    const { error } = d.id ? await supabase.from("menu_items").update(row).eq("id", d.id) : await supabase.from("menu_items").insert(row);
    if (error) { toast.error(error.message); return; }
    toast.success(d.id ? "Produk diperbarui" : "Produk ditambahkan");
    setDraft(null);
    queryClient.invalidateQueries();
  }

  return (
    <>
      <AdminHeader
        title="Menu & Products"
        subtitle={`${items.length} products`}
        actions={
          <Button variant="jago" onClick={() => setDraft({ name: "", category_id: cats[0]?.id ?? 1, description: "", price: 8000, stock: 100, image_url: "", is_available: true, is_featured: false })}>
            <Plus /> Add Product
          </Button>
        }
      />
      <TableCard>
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              <th className={th}>Product</th><th className={th}>Category</th><th className={th}>Price (S / M / L)</th>
              <th className={th}>Stock</th><th className={th}>Available</th><th className={th}>Featured</th><th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.length === 0 ? (
              <EmptyRow cols={7} text={menu.isLoading ? "Memuat..." : "Belum ada produk."} />
            ) : (
              items.map((m) => (
                <tr key={m.id} className="hover:bg-muted/40">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <img src={m.image_url ?? FALLBACK_DRINK_IMAGE} alt="" className="h-10 w-10 rounded object-contain" />
                      <div>
                        <p className="font-semibold">{m.name}</p>
                        <p className="max-w-xs truncate text-xs text-muted-foreground">{m.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className={td}>{catName(m.category_id)}</td>
                  <td className={td}>
                    {(["small", "medium", "large"] as const)
                      .map((s) => formatRupiah(m.menu_sizes.find((x) => x.size === s)?.price ?? sizePrice(Number(m.price), s)))
                      .join(" / ")}
                  </td>
                  <td className={td}>{m.stock}</td>
                  <td className={td}><Switch checked={m.is_available} onCheckedChange={(v) => toggle(m.id, "is_available", v)} aria-label="Available" /></td>
                  <td className={td}><Switch checked={m.is_featured} onCheckedChange={(v) => toggle(m.id, "is_featured", v)} aria-label="Featured" /></td>
                  <td className={td}>
                    <Button
                      size="sm"
                      variant="jagoOutline"
                      onClick={() =>
                        setDraft({
                          id: m.id,
                          name: m.name,
                          category_id: m.category_id,
                          description: m.description ?? "",
                          price: Number(m.price),
                          stock: m.stock,
                          image_url: m.image_url ?? "",
                          is_available: m.is_available,
                          is_featured: m.is_featured,
                        })
                      }
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableCard>

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          {draft && (
            <>
              <DialogHeader><DialogTitle>{draft.id ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  save(draft);
                }}
              >
                <div className="space-y-1.5"><Label htmlFor="mn">Nama</Label><Input id="mn" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="mc">Kategori</Label>
                    <select id="mc" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={draft.category_id} onChange={(e) => setDraft({ ...draft, category_id: Number(e.target.value) })}>
                      {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5"><Label htmlFor="mp">Harga Medium (Rp)</Label><Input id="mp" type="number" min={0} value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} /></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Small {formatRupiah(sizePrice(draft.price, "small"))} · Medium {formatRupiah(draft.price)} · Large {formatRupiah(sizePrice(draft.price, "large"))}
                </p>
                <div className="space-y-1.5"><Label htmlFor="md">Deskripsi</Label><Textarea id="md" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label htmlFor="ms">Stok</Label><Input id="ms" type="number" min={0} value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} /></div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mi">Foto</Label>
                    <select id="mi" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}>
                      <option value="">Logo Jago</option>
                      {LANDING_DRINKS.map((d) => <option key={d.image} value={d.image}>{d.name}</option>)}
                      {draft.image_url && !LANDING_DRINKS.some((d) => d.image === draft.image_url) && <option value={draft.image_url}>Foto saat ini</option>}
                    </select>
                  </div>
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm"><Switch checked={draft.is_available} onCheckedChange={(v) => setDraft({ ...draft, is_available: v })} /> Tersedia</label>
                  <label className="flex items-center gap-2 text-sm"><Switch checked={draft.is_featured} onCheckedChange={(v) => setDraft({ ...draft, is_featured: v })} /> Unggulan</label>
                </div>
                <Button type="submit" variant="jago" className="h-11 w-full">Simpan</Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
