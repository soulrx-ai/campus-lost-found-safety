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
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-lg font-bold text-stone-900"
            >
              Campus Lost & Found
            </Link>

            <p className="text-xs text-stone-500">
              {fullName} · {role}
            </p>
          </div>

          <LogoutButton />
        </div>

        <nav className="mt-4 flex flex-wrap gap-2">
          <NavLink href="/">Home</NavLink>

          <NavLink href="/search">
            Search
          </NavLink>

          <NavLink href="/matching">
            Find Matches
          </NavLink>

          <NavLink href="/lost/report">
            Report Lost
          </NavLink>

          <NavLink href="/found/report">
            Report Found
          </NavLink>

          <NavLink href="/claims">
            My Claims
          </NavLink>

          <NavLink href="/safety">
            Safety
          </NavLink>

          <NavLink href="/tickets">
            Tickets
          </NavLink>

          {role === "STAFF" && (
            <>
              <NavLink href="/staff/items">
                Review Items
              </NavLink>

              <NavLink href="/staff/claims">
                Review Claims
              </NavLink>

              <NavLink href="/staff/safety">
                Review Safety
              </NavLink>

              <NavLink href="/staff/tickets">
                Manage Tickets
              </NavLink>
            </>
          )}

          {role === "ADMIN" && (
            <>
              <NavLink href="/admin">
                Admin
              </NavLink>

              <NavLink href="/admin/users">
                Users
              </NavLink>

              <NavLink href="/admin/notifications">
                Notifications
              </NavLink>

              <NavLink href="/admin/logs">
                Activity Logs
              </NavLink>
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
      className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-900"
    >
      {children}
    </Link>
  );
}