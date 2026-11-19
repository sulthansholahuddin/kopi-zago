import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/auth";
import { ASSETS } from "@/lib/assets";
import { formatRupiah, QRIS_TIMEOUT_MS } from "@/lib/jago";
import { Button } from "@/components/ui/button";

/** Demo QRIS payment: 2-minute window, then the order is cancelled automatically. */
export function QrisPayment({
  orderId,
  createdAt,
  total,
  onPaid,
  onExpired,
}: {
  orderId: number;
  createdAt: string;
  total: number | string;
  onPaid: () => void;
  onExpired: () => void;
}) {
  const expiresAt = new Date(createdAt).getTime() + QRIS_TIMEOUT_MS;
  const [left, setLeft] = useState(() => Math.max(0, expiresAt - Date.now()));
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(left <= 0);

  useEffect(() => {
    const t = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(t);
        setExpired(true);
        supabase.rpc("cancel_expired_qris_orders").then(() => onExpired());
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  async function confirm() {
    setBusy(true);
    const { error } = await supabase.rpc("confirm_qris_payment", { p_order_id: orderId });
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    toast.success("Pembayaran QRIS berhasil (simulasi)");
    onPaid();
  }

  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);

  if (expired) {
    return (
      <div className="rounded-lg bg-danger-soft p-4 text-sm font-semibold text-destructive">
        Waktu pembayaran telah habis — Order <strong>Dibatalkan</strong>.
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-5 text-center">
      <p className="jago-label text-sm">Scan untuk Membayar</p>
      <img src={ASSETS.qris} alt="QRIS" className="mx-auto mt-3 h-52 w-52 object-contain" />
      <p className="font-display mt-2 text-xl font-black text-primary">{formatRupiah(total)}</p>
      <p className="mt-1 text-xs text-muted-foreground">Tunjukkan layar ini ke kasir atau scan melalui aplikasi e-wallet.</p>
      <div className="mt-4 flex items-center justify-between gap-2 rounded-lg bg-warning-soft px-4 py-3 text-sm text-warning">
        <span>
          ⏱ Sisa waktu: <strong>{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</strong>
        </span>
        <span className="text-xs opacity-75">Auto-batalkan</span>
      </div>
      <Button variant="jago" className="mt-4 h-11 w-full" disabled={busy} onClick={confirm}>
        {busy ? "Memproses..." : "Saya Sudah Bayar (Simulasi)"}
      </Button>
      <p className="mt-2 text-[11px] text-muted-foreground">Mode demo: tidak ada transaksi uang sungguhan.</p>
    </div>
  );
}
