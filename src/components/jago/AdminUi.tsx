import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, tone = "red" }: { label: string; value: ReactNode; hint?: string; icon: ReactNode; tone?: "red" | "blue" | "orange" | "green" }) {
  const tones = {
    red: "bg-danger-soft text-primary",
    blue: "bg-info-soft text-info",
    orange: "bg-warning-soft text-warning",
    green: "bg-success-soft text-success",
  };
  return (
    <div className="jago-card p-6">
      <div className="flex items-start justify-between">
        <span className="jago-label text-xs text-muted-foreground">{label}</span>
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tones[tone])}>{icon}</span>
      </div>
      <p className="font-display mt-4 text-3xl font-black text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TableCard({ title, actions, children }: { title?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="jago-card overflow-hidden">
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
          {title && <h3 className="text-base">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function FilterPills<T extends string>({ value, options, onChange }: { value: T; options: { key: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "jago-label rounded-full px-3 py-1.5 text-[11px] transition-colors",
            value === o.key ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-accent",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const th = "jago-label whitespace-nowrap px-6 py-3 text-left text-[11px] text-muted-foreground";
export const td = "whitespace-nowrap px-6 py-3 text-sm";

export function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-6 py-12 text-center text-sm text-muted-foreground">{text}</td>
    </tr>
  );
}
