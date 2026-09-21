"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED";

type Ticket = {
  id: string;
  requester_id: string;
  claim_id: string | null;
  ticket_type:
    | "NOT_RECEIVED"
    | "SYSTEM_PROBLEM"
    | "GENERAL";
  subject: string;
  description: string;
  status: TicketStatus;
  assigned_to: string | null;
  created_at: string;
};

type Props = {
  ticket: Ticket;
  staffId: string;
};

export default function TicketManagementCard({
  ticket,
  staffId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

async function updateTicket(
  newStatus: TicketStatus
) {
  setLoading(true);
  setErrorMessage("");

  try {
    const expectedStatus =
      newStatus === "IN_PROGRESS"
        ? "OPEN"
        : "IN_PROGRESS";

    const updateData =
      newStatus === "RESOLVED"
        ? {
            status: newStatus,
            assigned_to: staffId,
            resolved_at: new Date().toISOString(),
          }
        : {
            status: newStatus,
            assigned_to: staffId,
            resolved_at: null,
          };

    const { data, error } = await supabase
      .from("service_tickets")
      .update(updateData)
      .eq("id", ticket.id)
      .eq("status", expectedStatus)
      .select("id")
      .maybeSingle();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (!data) {
      setErrorMessage(
        "This ticket has already been updated. Refresh the page and try again."
      );
      return;
    }

    router.refresh();
  } catch {
    setErrorMessage(
      "Unable to update ticket. Please try again."
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-500">
            {ticket.ticket_type.replaceAll("_", " ")}
          </p>

          <h2 className="mt-1 text-lg font-semibold text-stone-900">
            {ticket.subject}
          </h2>

          <p className="mt-1 text-sm text-stone-500">
            Created{" "}
            {formatDateTime(ticket.created_at)}
          </p>
        </div>

        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
          {ticket.status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-stone-700">
          Description
        </p>

        <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">
          {ticket.description}
        </p>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="font-medium text-stone-700">
            Requester ID
          </p>
          <p className="break-all text-stone-600">
            {ticket.requester_id}
          </p>
        </div>

        <div>
          <p className="font-medium text-stone-700">
            Related Claim
          </p>
          <p className="break-all text-stone-600">
            {ticket.claim_id || "None"}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {ticket.status === "OPEN" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => updateTicket("IN_PROGRESS")}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Start Processing"}
          </button>
        )}

        {ticket.status === "IN_PROGRESS" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => updateTicket("RESOLVED")}
            className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Resolve Ticket"}
          </button>
        )}

        {ticket.status === "RESOLVED" && (
          <p className="rounded-xl bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
            Ticket resolved
          </p>
        )}
      </div>
    </article>
  );
}