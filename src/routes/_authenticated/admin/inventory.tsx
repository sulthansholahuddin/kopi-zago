import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Boxes, PackageX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminMenuQuery } from "@/lib/admin";
import { AdminHeader, EmptyRow, FilterPills, StatCard, TableCard, td, th } from "@/components/jago/AdminUi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Admin Kopi Jago" }] }),
  component: Inventory,
});

type StockStatus = "in" | "low" | "out";
const stockStatus = (n: number): StockStatus => (n <= 0 ? "out" : n < 10 ? "low" : "in");
const STATUS_LABEL: Record<StockStatus, string> = { in: "In Stock", low: "Low Stock", out: "Out of Stock" };
const STATUS_CLS: Record<StockStatus, string> = {
  in: "bg-success-soft text-success",
  low: "bg-warning-soft text-warning",
  out: "bg-danger-soft text-destructive",
};

function Inventory() {
  const queryClient = useQueryClient();
  const menu = useQuery(adminMenuQuery);
  const [filter, setFilter] = useState<"all" | StockStatus>("all");
  const [adjust, setAdjust] = useState<{ id: number; name: string; stock: number } | null>(null);
  const [mode, setMode] = useState<"add" | "remove" | "set">("add");
  const [amount, setAmount] = useState(10);
  const items = menu.data?.items ?? [];
  const list = items.filter((i) => filter === "all" || stockStatus(i.stock) === filter);

  async function submit() {
    if (!adjust) return;
    const next = mode === "add" ? adjust.stock + amount : mode === "remove" ? adjust.stock - amount : amount;
    if (next < 0) { toast.warning("Stok tidak boleh negatif"); return; }
    const { error } = await supabase.from("menu_items").update({ stock: Math.floor(next) }).eq("id", adjust.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Stok ${adjust.name} sekarang ${next}`);
    setAdjust(null);
    queryClient.invalidateQueries();
  }

  return (
    <>
      <AdminHeader title="Inventory" subtitle="Pantau dan sesuaikan stok minuman" />
      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <StatCard label="Total Products" value={items.length} icon={<Boxes className="h-5 w-5" />} tone="blue" />
        <StatCard label="Low Stock (<10)" value={items.filter((i) => stockStatus(i.stock) === "low").length} icon={<AlertTriangle className="h-5 w-5" />} tone="orange" />
        <StatCard label="Out of Stock" value={items.filter((i) => i.stock <= 0).length} icon={<PackageX className="h-5 w-5" />} tone="red" />
      </div>
      <TableCard
        actions={
          <FilterPills
            value={filter}
            onChange={setFilter}
            options={[{ key: "all", label: "All" }, { key: "in", label: "In Stock" }, { key: "low", label: "Low" }, { key: "out", label: "Out" }]}
          />
        }
      >
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr><th className={th}>Product</th><th className={th}>Stock</th><th className={th}>Level</th><th className={th}>Status</th><th className={th}></th></tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 ? (
              <EmptyRow cols={5} text={menu.isLoading ? "Memuat..." : "Tidak ada produk."} />
            ) : (
              list.map((i) => {
                const s = stockStatus(i.stock);
                return (
                  <tr key={i.id} className="hover:bg-muted/40">
                    <td className={`${td} font-semibold`}>{i.name}</td>
                    <td className={td}>{i.stock}</td>
                    <td className={td}>
                      <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", s === "in" ? "bg-success" : s === "low" ? "bg-warning" : "bg-destructive")} style={{ width: `${Math.min(100, i.stock)}%` }} />
                      </div>
                    </td>
                    <td className={td}><span className={cn("jago-label rounded-full px-3 py-1 text-[10px]", STATUS_CLS[s])}>{STATUS_LABEL[s]}</span></td>
                    <td className={td}><Button size="sm" variant="jagoOutline" onClick={() => { setAdjust({ id: i.id, name: i.name, stock: i.stock }); setMode("add"); setAmount(10); }}>Adjust</Button></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </TableCard>

      <Dialog open={adjust !== null} onOpenChange={(o) => !o && setAdjust(null)}>
        <DialogContent className="max-w-sm">
          {adjust && (
            <>
              <DialogHeader><DialogTitle>Adjust Stock — {adjust.name}</DialogTitle></DialogHeader>
              <p className="text-sm text-muted-foreground">Stok saat ini: <strong>{adjust.stock}</strong></p>
              <FilterPills value={mode} onChange={setMode} options={[{ key: "add", label: "Tambah" }, { key: "remove", label: "Kurangi" }, { key: "set", label: "Set" }]} />
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              <Button variant="jago" className="h-11 w-full" onClick={submit}>Simpan</Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
