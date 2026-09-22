"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Counts = {
  users: number;
  items: number;
  claims: number;
  incidents: number;
  tickets: number;
};

export default function AdminDashboard() {
  const supabase = createClient();

  const [counts, setCounts] = useState<Counts>({
    users: 0,
    items: 0,
    claims: 0,
    incidents: 0,
    tickets: 0,
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const [
        usersResult,
        itemsResult,
        claimsResult,
        incidentsResult,
        ticketsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("items")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("claims")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("security_incidents")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("service_tickets")
          .select("*", { count: "exact", head: true }),
      ]);

      const error =
        usersResult.error ||
        itemsResult.error ||
        claimsResult.error ||
        incidentsResult.error ||
        ticketsResult.error;

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setCounts({
        users: usersResult.count ?? 0,
        items: itemsResult.count ?? 0,
        claims: claimsResult.count ?? 0,
        incidents: incidentsResult.count ?? 0,
        tickets: ticketsResult.count ?? 0,
      });

      setLoading(false);
    }

    loadDashboard();
  }, [supabase]);

  if (loading) {
    return (
      <div className="ui-card p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--primary)]" />

          <p className="text-sm text-[var(--foreground-muted)]">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Users", value: counts.users },
    { label: "Items", value: counts.items },
    { label: "Claims", value: counts.claims },
    {
      label: "Safety Incidents",
      value: counts.incidents,
    },
    {
      label: "Service Tickets",
      value: counts.tickets,
    },
  ];

  const tools = [
    {
      href: "/admin/users",
      title: "User Management",
      description: "Manage user roles and account status.",
    },
    {
      href: "/admin/notifications",
      title: "Notifications",
      description: "Send system notifications to users.",
    },
    {
      href: "/admin/logs",
      title: "Activity Logs",
      description: "Review important recorded system activity.",
    },
  ];

  return (
    <div>
      {message && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]"
        >
          {message}
        </div>
      )}

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            System overview
          </h2>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Current record counts available to the Admin role.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <div key={card.label} className="ui-card p-5">
              <p className="text-sm font-medium text-[var(--foreground-muted)]">
                {card.label}
              </p>

              <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)]">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Administration tools
          </h2>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Manage system-level configuration and records.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="ui-card group p-5 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)] sm:p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-[var(--foreground)]">
                  {tool.title}
                </h3>

                <span
                  aria-hidden="true"
                  className="text-lg text-[var(--foreground-muted)] transition group-hover:translate-x-1"
                >
                  →
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}