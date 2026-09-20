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
    return <p>Loading tickets...</p>;
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg bg-white p-4 text-sm">
          {message}
        </div>
      )}

      {!message && tickets.length === 0 && (
        <div className="rounded-lg bg-white p-4">
          You have no service tickets.
        </div>
      )}

      {tickets.map((ticket) => (
        <article
          key={ticket.id}
          className="rounded-2xl bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-stone-500">
                {ticket.ticket_type}
              </p>

              <h2 className="mt-1 text-lg font-semibold">
                {ticket.subject}
              </h2>
            </div>

            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs">
              {ticket.status}
            </span>
          </div>

          <p className="mt-3 text-sm text-stone-700">
            {ticket.description}
          </p>

          {ticket.claim_id && (
            <p className="mt-3 text-xs text-stone-500">
              Related claim: {ticket.claim_id}
            </p>
          )}

          <p className="mt-2 text-xs text-stone-500">
            Created{" "}
            {new Date(ticket.created_at).toLocaleString()}
          </p>
        </article>
      ))}
    </div>
  );
}