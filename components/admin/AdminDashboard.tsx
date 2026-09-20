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
    return <p>Loading dashboard...</p>;
  }

  const cards = [
    { label: "Users", value: counts.users },
    { label: "Items", value: counts.items },
    { label: "Claims", value: counts.claims },
    { label: "Safety Incidents", value: counts.incidents },
    { label: "Service Tickets", value: counts.tickets },
  ];

  return (
    <div>
      {message && (
        <div className="mb-5 rounded-lg bg-white p-4 text-sm">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-stone-500">
              {card.label}
            </p>

            <p className="mt-2 text-3xl font-bold">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/users"
          className="rounded-2xl bg-white p-6 shadow-sm hover:bg-stone-100"
        >
          <h2 className="font-semibold">User Management</h2>
          <p className="mt-2 text-sm text-stone-600">
            Manage user roles and account status.
          </p>
        </Link>

        <Link
          href="/admin/notifications"
          className="rounded-2xl bg-white p-6 shadow-sm hover:bg-stone-100"
        >
          <h2 className="font-semibold">
            Notifications
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Send system notifications to users.
          </p>
        </Link>

        <Link
          href="/admin/logs"
          className="rounded-2xl bg-white p-6 shadow-sm hover:bg-stone-100"
        >
          <h2 className="font-semibold">
            Activity Logs
          </h2>
          <p className="mt-2 text-sm text-stone-600">
            Review important system activity.
          </p>
        </Link>
      </div>
    </div>
  );
}