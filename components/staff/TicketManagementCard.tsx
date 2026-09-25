"use client";

import { AppMessage, DisplayValue, Text, UiText } from "@/components/i18n/Text";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  staff_note?: string | null;
  created_at: string;
};

type Props = {
  ticket: Ticket;
  staffId: string;
};

function statusClass(status: TicketStatus) {
  switch (status) {
    case "OPEN":
      return "bg-[var(--warning-soft)] text-[var(--warning)]";
    case "IN_PROGRESS":
      return "bg-[var(--info-soft)] text-[var(--info)]";
    case "RESOLVED":
      return "bg-[var(--success-soft)] text-[var(--success)]";
  }
}

export default function TicketManagementCard({
  ticket,
}: Props) {
  const router = useRouter();

  const [staffNote, setStaffNote] = useState(ticket.staff_note ?? "");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function updateTicket(
    newStatus: TicketStatus
  ) {
    const note = staffNote.trim();
    if (newStatus === "RESOLVED" && !note) {
      setErrorMessage("A Staff Note is required before resolving a ticket.");
      return;
    }
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/staff/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, staff_note: note }),
      });
      const result = await response.json();
      if (!response.ok) {
        setErrorMessage(typeof result.error === "string" ? result.error : "Unable to update ticket. Please try again.");
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
    <article className="ui-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            <DisplayValue value={ticket.ticket_type} />
          </p>

          <h2 className="mt-1 break-words text-lg font-semibold text-[var(--heading)]">
            {ticket.subject}
          </h2>

          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            <Text id="Created" /> {formatDateTime(ticket.created_at)}
          </p>
        </div>

        <span
          className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
            ticket.status
          )}`}
        >
          <DisplayValue value={ticket.status} />
        </span>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            <Text id="Description" />
          </p>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--foreground)]">
            {ticket.description}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <InfoField
            label="Requester ID"
            value={ticket.requester_id}
          />

          <InfoField
            label="Related claim"
            value={ticket.claim_id || "None"}
          />
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]"
          >
            <AppMessage text={errorMessage} />
          </div>
        )}

        <div className="border-t border-[var(--border)] pt-5">
          {ticket.status === "OPEN" && (
            <button
              type="button"
              disabled={loading}
              onClick={() => updateTicket("IN_PROGRESS")}
              className="ui-button-primary w-full sm:w-auto"
            >
              {loading ? <Text id="Processing..." /> : <Text id="Start processing" />}
            </button>
          )}

          {ticket.status === "IN_PROGRESS" && (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor={`solution-${ticket.id}`}
                  className="block text-sm font-semibold text-[var(--foreground)]"
                >
                  <Text id="Initial troubleshooting / Solution instructions" />
                </label>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  <Text id="Provide initial troubleshooting instructions or advice for the user before resolving." />
                </p>

                <textarea
                  id={`solution-${ticket.id}`}
                  required
                  rows={4}
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  placeholder="ระบุคำแนะนำ วิธีแก้ปัญหาเบื้องต้น หรือข้อความตอบกลับผู้แจ้งเรื่อง..."
                  className="ui-input mt-2 min-h-24 resize-y"
                />
              </div>

              <button
                type="button"
                disabled={loading || !staffNote.trim()}
                onClick={() => updateTicket("RESOLVED")}
                className="ui-button-primary w-full sm:w-auto"
              >
                {loading ? <Text id="Processing..." /> : <Text id="Resolve ticket" />}
              </button>
            </div>
          )}

          {ticket.status === "RESOLVED" && (
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--success)]/20 bg-[var(--success-soft)] p-4">
                <p className="text-sm font-semibold text-[var(--success)]">
                  <Text id="Ticket resolved" />
                </p>
              </div>

              {ticket.staff_note && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                    <Text id="Resolution notes sent to user" />
                  </p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm text-[var(--foreground)]">
                    {ticket.staff_note}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
        <UiText text={label} />
      </p>

      <p className="mt-1 break-all text-sm text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}