import { CheckCircle2 } from "lucide-react";
import {
  formatDate,
  formatRupiah,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  paymentMethodLabel,
  SIZE_LABELS,
  type DrinkSize,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/jago";
import { cn } from "@/lib/utils";

export type ReceiptOrder = {
  order_number: string;
  created_at: string;
  fulfillment_type: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number | string;
  discount_amount?: number | string;
  shipping_cost?: number | string;
  total_amount: number | string;
  items: { name: string; size: string; qty: number; price: number | string }[];
};

export function statusTone(status: string) {
  if (status === "completed" || status === "paid") return "bg-success-soft text-success";
  if (status === "cancelled" || status === "failed") return "bg-danger-soft text-destructive";
  if (status === "pending") return "bg-warning-soft text-warning";
  return "bg-info-soft text-info";
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn("jago-label inline-block rounded-full px-3 py-1 text-[10px]", statusTone(status))}>
      {label ?? ORDER_STATUS_LABEL[status as OrderStatus] ?? PAYMENT_STATUS_LABEL[status as PaymentStatus] ?? status}
    </span>
  );
}

export function Receipt({ order, success }: { order: ReceiptOrder; success?: string | undefined }) {
  const discount = Number(order.discount_amount ?? 0);
  const shipping = Number(order.shipping_cost ?? 0);
  return (
    <div className="font-sans">
      {success && (
        <div className="mb-5 flex flex-col items-center text-center">
          <CheckCircle2 className="animate-check-pop h-16 w-16 text-success" />
          <p className="jago-label mt-3 text-sm text-success">Pembayaran Berhasil</p>
          <p className="mt-1 text-xs text-muted-foreground">{success}</p>
        </div>
      )}
      <div className="text-center">
        <p className="font-display text-2xl font-black italic text-primary">KOPI JAGO</p>
        <p className="text-xs text-muted-foreground">Minuman favorit, diantar dengan jago.</p>
      </div>
      <dl className="mt-5 space-y-2 text-sm">
        <Row label="No. Pesanan" value={order.order_number} />
        <Row label="Tanggal" value={formatDate(order.created_at)} />
        <Row label="Tipe" value={order.fulfillment_type === "delivery" ? "Delivery" : "Pickup"} />
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Status Pesanan</dt>
          <dd><StatusBadge status={order.status} /></dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Pembayaran</dt>
          <dd><StatusBadge status={order.payment_status} label={PAYMENT_STATUS_LABEL[order.payment_status as PaymentStatus]} /></dd>
        </div>
        <Row label="Metode Bayar" value={paymentMethodLabel(order.payment_method)} />
      </dl>
      <div className="my-4 border-t border-dashed" />
      <ul className="space-y-3 text-sm">
        {order.items.map((i, idx) => (
          <li key={idx} className="flex justify-between gap-3">
            <div>
              <p className="font-semibold">
                {i.name} <span className="font-normal text-muted-foreground">({SIZE_LABELS[i.size as DrinkSize] ?? i.size})</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {i.qty} x {formatRupiah(i.price)}
              </p>
            </div>
            <span className="font-semibold">{formatRupiah(Number(i.price) * i.qty)}</span>
          </li>
        ))}
      </ul>
      <div className="my-4 border-t border-dashed" />
      <dl className="space-y-2 text-sm">
        <Row label="Subtotal" value={formatRupiah(order.subtotal)} />
        {discount > 0 && <Row label="Diskon" value={`-${formatRupiah(discount)}`} />}
        <Row label="Ongkir" value={shipping > 0 ? formatRupiah(shipping) : "GRATIS"} />
        <div className="flex justify-between border-t pt-3 font-display text-base font-black">
          <dt>TOTAL</dt>
          <dd className="text-primary">{formatRupiah(order.total_amount)}</dd>
        </div>
      </dl>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Terima kasih telah memesan di Kopi Jago.
        <br />
        Struk ini dibuat otomatis oleh sistem.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
