import type { ReactNode } from "react";
import { SiteNavbar } from "./SiteNavbar";
import { SiteFooter } from "./SiteFooter";

export function CustomerShell({ title, subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-warm">
      <SiteNavbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-28 md:px-8">
        {title && (
          <div className="mb-8">
            <h1 className="text-3xl text-ink md:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: string; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="jago-card flex flex-col items-center px-6 py-16 text-center">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-4 text-xl">{title}</h3>
      <p className="mt-2 max-w-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
    </div>
  );
}
