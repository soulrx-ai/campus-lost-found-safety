import Link from "next/link";
import AdminNavigation from "@/components/admin/AdminNavigation";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="app-container flex min-h-20 items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">
              Campus Lost & Safety System
            </p>

            <p className="truncate text-xs text-[var(--foreground-muted)]">
              Lost & Found · Safety Incident · Service Ticket
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/admin/notifications"
              aria-label="Notifications"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
            >
              ♢
            </Link>

            <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary)]">
                A
              </span>

              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  Admin
                </p>

                <p className="text-[11px] text-[var(--foreground-muted)]">
                  Administrator
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="app-container">
        <div className="grid gap-8 py-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:py-8">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <AdminNavigation />
          </div>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
