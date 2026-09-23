"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: string;
};

const navItems: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    description: "System overview",
    icon: "D",
  },
  {
    href: "/admin/users",
    label: "Users & Roles",
    description: "Manage users and roles",
    icon: "U",
  },
  {
    href: "/admin/notifications",
    label: "Announcements",
    description: "Notifications and announcements",
    icon: "N",
  },
  {
    href: "/admin/logs",
    label: "Activity Logs",
    description: "Review system activity",
    icon: "L",
  },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <aside className="w-full">
      <div className="mb-6 px-1">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)] text-xl font-bold text-white shadow-sm">
            A
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              ADMIN
            </p>

            <p className="text-xs text-[var(--foreground-muted)]">
              System Administration
            </p>
          </div>
        </div>
      </div>

      <nav aria-label="Admin navigation">
        <div className="space-y-1.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex items-center gap-3 rounded-xl px-3 py-3 transition",
                  isActive
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-semibold",
                    isActive
                      ? "bg-white/15 text-white"
                      : "bg-[var(--surface)] text-[var(--foreground-muted)] group-hover:bg-[var(--primary-soft)]",
                  ].join(" ")}
                >
                  {item.icon}
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>

                  <span
                    className={[
                      "mt-0.5 block truncate text-xs",
                      isActive
                        ? "text-white/75"
                        : "text-[var(--foreground-muted)]",
                    ].join(" ")}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="my-6 border-t border-[var(--border)]" />

        <Link
          href="/"
          className="group flex items-center gap-3 rounded-xl px-3 py-3 text-[var(--foreground-muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-base">
            &lt;
          </span>

          <span>
            <span className="block text-sm font-semibold">Back to Home</span>

            <span className="mt-0.5 block text-xs text-[var(--foreground-muted)]">
              Return to the main system
            </span>
          </span>
        </Link>
      </nav>
    </aside>
  );
}
