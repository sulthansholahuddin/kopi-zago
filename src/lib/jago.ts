// Shared Kopi Jago rules used by the UI. The database functions apply the same rules.

export type DrinkSize = "small" | "medium" | "large";

export const SIZE_LABELS: Record<DrinkSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

/** Size price from the base (medium) price: small 80%, medium 100%, large 130%, rounded. */
export function sizePrice(base: number, size: DrinkSize): number {
  if (size === "small") return Math.round(base * 0.8);
  if (size === "large") return Math.round(base * 1.3);
  return base;
}

/** Energy points earned when an order completes: 1 per Rp1.000, minimum 10. */
export function energyForOrder(total: number): number {
  return Math.max(Math.floor(total / 1000), 10);
}

export const QRIS_TIMEOUT_MS = 2 * 60 * 1000;

export const BANKS = [
  { code: "bca", name: "BCA", vaPrefix: "3901" },
  { code: "bni", name: "BNI", vaPrefix: "8808" },
  { code: "bri", name: "BRI", vaPrefix: "8810" },
  { code: "mandiri", name: "Mandiri", vaPrefix: "8950" },
  { code: "bsi", name: "BSI", vaPrefix: "7000" },
  { code: "seabank", name: "SeaBank", vaPrefix: "9099" },
] as const;

export type BankCode = (typeof BANKS)[number]["code"];

/** Dummy virtual-account number for the demo bank transfer. */
export function dummyVaNumber(bank: BankCode, rand: () => number = Math.random): string {
  const prefix = BANKS.find((b) => b.code === bank)?.vaPrefix ?? "8810";
  return prefix + String(Math.floor(1_000_000_000 + rand() * 9_000_000_000));
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
  | "on_delivery"
  | "completed"
  | "cancelled";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Menunggu Pembayaran",
  confirmed: "Dikonfirmasi",
  processing: "Diproses",
  ready: "Siap",
  on_delivery: "Dikirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["ready", "cancelled"],
  ready: ["on_delivery", "completed"],
  on_delivery: ["completed"],
  completed: [],
  cancelled: [],
};

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Belum Dibayar",
  paid: "Lunas",
  failed: "Gagal",
  refunded: "Dikembalikan",
};

export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "-";
  const bank = BANKS.find((b) => b.code === method);
  if (bank) return `Transfer ${bank.name}`;
  const map: Record<string, string> = {
    cash: "Tunai (COD)",
    qris: "QRIS",
    bank_transfer: "Transfer Bank",
    ewallet: "E-Wallet",
  };
  return map[method] ?? method;
}

export function formatRupiah(amount: number | string | null | undefined): string {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(value: string | null | undefined, withTime = true): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: withTime ? "long" : "short",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}
