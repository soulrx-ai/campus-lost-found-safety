import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";

type AppRole = "USER" | "STAFF" | "ADMIN";

type Props = {
  fullName: string;
  role: AppRole;
};

export default function AppNavigation({
  fullName,
  role,
}: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="app-container">
        <div className="flex min-h-16 items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <Link
              href="/"
              className="block truncate text-lg font-bold tracking-tight text-[var(--foreground)] transition hover:opacity-75"
            >
              Campus Lost &amp; Found
            </Link>

            <p className="mt-0.5 truncate text-xs text-[var(--foreground-muted)]">
              {fullName} · {role}
            </p>
          </div>

          <div className="shrink-0">
            <LogoutButton />
          </div>
        </div>

        <nav
          aria-label="Main navigation"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          <NavLink href="/">Home</NavLink>
          <NavLink href="/search">Search</NavLink>
          <NavLink href="/matching">Find Matches</NavLink>
          <NavLink href="/lost/report">Report Lost</NavLink>
          <NavLink href="/found/report">Report Found</NavLink>
          <NavLink href="/claims">My Claims</NavLink>
          <NavLink href="/safety">Safety</NavLink>
          <NavLink href="/tickets">Tickets</NavLink>

          {role === "STAFF" && (
            <>
              <NavLink href="/staff/items">Review Items</NavLink>
              <NavLink href="/staff/claims">Review Claims</NavLink>
              <NavLink href="/staff/safety">Review Safety</NavLink>
              <NavLink href="/staff/tickets">Manage Tickets</NavLink>
            </>
          )}

          {role === "ADMIN" && (
            <>
              <NavLink href="/admin">Admin</NavLink>
              <NavLink href="/admin/users">Users</NavLink>
              <NavLink href="/admin/notifications">
                Notifications
              </NavLink>
              <NavLink href="/admin/logs">Activity Logs</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="shrink-0 whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-medium text-[var(--foreground-muted)] transition hover:border-[var(--border-strong)] hover:bg-[var(--primary-soft)] hover:text-[var(--foreground)]"
    >
      {children}
    </Link>
  );
}