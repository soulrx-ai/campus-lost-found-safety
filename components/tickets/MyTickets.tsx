"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Ticket = {
  id: string;
  claim_id: string | null;
  ticket_type: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function statusClass(status: string) {
  switch (status) {
    case "RESOLVED":
      return "bg-[var(--success-soft)] text-[var(--success)]";

    case "IN_PROGRESS":
      return "bg-[var(--info-soft)] text-[var(--info)]";

    default:
      return "bg-[var(--warning-soft)] text-[var(--warning)]";
  }
}

export default function MyTickets() {
  const supabase = createClient();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTickets() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please login to view your tickets.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("service_tickets")
        .select(
          "id, claim_id, ticket_type, subject, description, status, created_at, updated_at"
        )
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
      } else {
        setTickets((data ?? []) as Ticket[]);
      }

      setLoading(false);
    }

    loadTickets();
  }, [supabase]);

  if (loading) {
    return (
      <div className="ui-card p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--primary)]" />
          <p className="text-sm text-[var(--foreground-muted)]">
            Loading tickets...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="ui-card p-4 text-sm text-[var(--foreground)]">
          {message}
        </div>
      )}

      {!message && tickets.length === 0 && (
        <div className="ui-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            No service tickets
          </h2>

          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            You have not submitted any service tickets.
          </p>
        </div>
      )}

      {tickets.map((ticket) => (
        <article
          key={ticket.id}
          className="ui-card overflow-hidden"
        >
          <div className="flex flex-col gap-3 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                {ticket.ticket_type.replaceAll("_", " ")}
              </p>

              <h2 className="mt-1 break-words text-lg font-semibold text-[var(--foreground)]">
                {ticket.subject}
              </h2>
            </div>

            <span
              className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                ticket.status
              )}`}
            >
              {ticket.status.replaceAll("_", " ")}
            </span>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--foreground)]">
              {ticket.description}
            </p>

            {ticket.claim_id && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                  Related claim
                </p>

                <p className="mt-1 break-all text-sm text-[var(--foreground)]">
                  {ticket.claim_id}
                </p>
              </div>
            )}

            <div className="border-t border-[var(--border)] pt-4 text-xs text-[var(--foreground-muted)]">
              Created {formatDateTime(ticket.created_at)}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}