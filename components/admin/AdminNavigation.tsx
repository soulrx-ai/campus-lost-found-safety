import Link from "next/link";

export default function AdminNavigation() {
  return (
    <nav className="mb-8 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <AdminLink href="/admin">
          Dashboard
        </AdminLink>

        <AdminLink href="/admin/users">
          Users
        </AdminLink>

        <AdminLink href="/admin/notifications">
          Notifications
        </AdminLink>

        <AdminLink href="/admin/logs">
          Activity Logs
        </AdminLink>

        <AdminLink href="/">
          Back to Home
        </AdminLink>
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
      className="rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
    >
      {children}
    </Link>
  );
}