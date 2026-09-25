"use client";

import { AppMessage, Text, UiText } from "@/components/i18n/Text";

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
        supabase.from("profiles").select("*", { count: "exact", head: true }),

        supabase.from("items").select("*", { count: "exact", head: true }),

        supabase.from("claims").select("*", { count: "exact", head: true }),

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
            <Text id="Loading dashboard..." />
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
          <AppMessage text={message} />
        </div>
      )}

      <section>
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--heading)]">
              <Text id="System overview" />
            </h2>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              <Text id="Current record counts available to the Admin role." />
            </p>
          </div>

          <p className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
            <Text id="Live records" />
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <div
              key={card.label}
              data-accent={card.label === "Safety Incidents" ? "safety" : undefined}
              className="ui-card group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground-muted)]">
                    <UiText text={card.label} />
                  </p>

                  <p className="mt-3 text-3xl font-bold tracking-tight text-[var(--foreground)]">
                    {card.value}
                  </p>
                </div>

                <div
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-soft)] text-sm font-bold text-[var(--heading)]"
                >
                  {card.label.charAt(0)}
                </div>
              </div>

              <div className="mt-5 h-1 w-10 rounded-full bg-[var(--heading)] opacity-70 transition-all duration-200 group-hover:w-16" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
            <Text id="Quick access" />
          </p>

          <h2 className="mt-1 text-lg font-semibold text-[var(--heading)]">
            <Text id="Administration tools" />
          </h2>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            <Text id="Manage system-level records and administrative workflows." />
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="ui-card group block p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)] hover:shadow-md sm:p-6"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold text-[var(--heading)]">
                  <UiText text={tool.title} />
                </h3>

                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-sm text-[var(--foreground-muted)] transition duration-200 group-hover:translate-x-1 group-hover:border-[var(--border-strong)] group-hover:text-[var(--foreground)]"
                >
                  &gt;
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
                <UiText text={tool.description} />
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
