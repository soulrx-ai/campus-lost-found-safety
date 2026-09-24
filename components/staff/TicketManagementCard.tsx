"use client";

import { AppMessage, DisplayValue, Text, UiText } from "@/components/i18n/Text";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import {
  formatTicketWithResolution,
  parseTicketContent,
} from "@/lib/tickets/content";

type TicketUpdate = Database["public"]["Tables"]["service_tickets"]["Update"];

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
  staffId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const { userDescription, staffResolution } = parseTicketContent(
    ticket.description,
    ticket.staff_note
  );

  const [staffNote, setStaffNote] = useState(staffResolution ?? "");
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

      const noteToSave = staffNote.trim();
      const combinedDescription = noteToSave
        ? formatTicketWithResolution(userDescription, noteToSave)
        : userDescription;

      const updateData: TicketUpdate =
        newStatus === "RESOLVED"
          ? {
              status: newStatus,
              assigned_to: staffId,
              resolved_at: new Date().toISOString(),
              description: combinedDescription,
              staff_note: noteToSave || null,
            }
          : {
              status: newStatus,
              assigned_to: staffId,
              resolved_at: null,
            };

      let { data, error } = await supabase
        .from("service_tickets")
        .update(updateData)
        .eq("id", ticket.id)
        .eq("status", expectedStatus)
        .select("id")
        .maybeSingle();

      if (
        error &&
        (error.message.includes("staff_note") ||
          error.message.includes("schema cache") ||
          error.code === "42703")
      ) {
        // Fallback if staff_note column is not yet present in Supabase table
        const fallbackUpdate: TicketUpdate = {
          status: updateData.status,
          assigned_to: updateData.assigned_to,
          resolved_at: updateData.resolved_at,
          description: combinedDescription,
        };
        const retry = await supabase
          .from("service_tickets")
          .update(fallbackUpdate)
          .eq("id", ticket.id)
          .eq("status", expectedStatus)
          .select("id")
          .maybeSingle();

        if (retry.error) {
          setErrorMessage(retry.error.message);
          return;
        }
        data = retry.data;
      } else if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (!data) {
        setErrorMessage(
          "This ticket has already been updated. Refresh the page and try again."
        );
        return;
      }

      if (newStatus === "RESOLVED") {
        try {
          await supabase.from("notifications").insert({
            user_id: ticket.requester_id,
            title: `Service Ticket Resolved: ${ticket.subject}`,
            message:
              noteToSave ||
              "Your service ticket has been resolved by staff.",
            type: "INFO",
            is_read: false,
          });
        } catch {
          // ignore notification error
        }
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

  async function saveResolvedNote() {
    setLoading(true);
    setErrorMessage("");

    try {
      const noteToSave = staffNote.trim();
      const combinedDescription = noteToSave
        ? formatTicketWithResolution(userDescription, noteToSave)
        : userDescription;

      const updateData: TicketUpdate = {
        description: combinedDescription,
        staff_note: noteToSave || null,
      };

      let { data, error } = await supabase
        .from("service_tickets")
        .update(updateData)
        .eq("id", ticket.id)
        .select("id")
        .maybeSingle();

      if (
        error &&
        (error.message.includes("staff_note") ||
          error.message.includes("schema cache") ||
          error.code === "42703")
      ) {
        const retry = await supabase
          .from("service_tickets")
          .update({ description: combinedDescription })
          .eq("id", ticket.id)
          .select("id")
          .maybeSingle();

        if (retry.error) {
          setErrorMessage(retry.error.message);
          return;
        }
        data = retry.data;
      } else if (error) {
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
      setErrorMessage("Unable to save note. Please try again.");
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

          <h2 className="mt-1 break-words text-lg font-semibold text-[var(--foreground)]">
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
            {userDescription}
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
                  rows={4}
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  placeholder="ระบุคำแนะนำ วิธีแก้ปัญหาเบื้องต้น หรือข้อความตอบกลับผู้แจ้งเรื่อง..."
                  className="ui-input mt-2 min-h-24 resize-y"
                />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => updateTicket("RESOLVED")}
                className="ui-button-primary w-full sm:w-auto"
              >
                {loading ? <Text id="Processing..." /> : <Text id="Resolve ticket" />}
              </button>
            </div>
          )}

          {ticket.status === "RESOLVED" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--success)]/20 bg-[var(--success-soft)] p-4">
                <p className="text-sm font-semibold text-[var(--success)]">
                  <Text id="Ticket resolved" />
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <label
                  htmlFor={`resolved-note-${ticket.id}`}
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]"
                >
                  <Text id="Resolution notes sent to user" />
                </label>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  <Text id="Provide initial troubleshooting instructions or advice for the user before resolving." />
                </p>

                <textarea
                  id={`resolved-note-${ticket.id}`}
                  rows={3}
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  placeholder="ระบุคำแนะนำหรือวิธีแก้ไขปัญหาเบื้องต้นสำหรับผู้แจ้งเรื่อง..."
                  className="ui-input mt-2 min-h-20 resize-y"
                />

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={saveResolvedNote}
                    className="ui-button-primary w-full text-xs sm:w-auto"
                  >
                    {loading ? <Text id="Processing..." /> : <Text id="Save resolution note" />}
                  </button>
                </div>
              </div>
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