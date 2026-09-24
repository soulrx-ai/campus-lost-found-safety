import Link from "next/link";

export default function AdminNavigation() {
  return (
    <nav
      aria-label="Admin navigation"
      className="ui-card overflow-hidden"
    >
      <div className="border-b border-[var(--border)] px-4 py-3 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
          Administration
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto p-3 sm:flex-wrap sm:p-4">
        <AdminLink href="/admin">Dashboard</AdminLink>
        <AdminLink href="/admin/users">Users</AdminLink>
        <AdminLink href="/admin/notifications">
          Notifications
        </AdminLink>
        <AdminLink href="/admin/logs">Activity Logs</AdminLink>
        <AdminLink href="/">Back to Home</AdminLink>
      </div>
    </nav>
  );
}

function AdminLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="shrink-0 whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:bg-[var(--primary-soft)] hover:text-[var(--foreground)]"
    >
      {children}
    </Link>
  );
}