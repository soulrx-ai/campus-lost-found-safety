"use client";

import { AppMessage, DisplayValue, Text, UiText } from "@/components/i18n/Text";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Ticket = {
  id: string;
  claim_id: string | null;
  ticket_type: string;
  subject: string;
  description: string;
  status: string;
  staff_note?: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

const TICKET_STEPS = [
  {
    step: 1,
    key: "OPEN",
    title: "Submitted",
    desc: "Waiting for Staff to respond",
  },
  {
    step: 2,
    key: "IN_PROGRESS",
    title: "In Progress",
    desc: "Staff are reviewing your request",
  },
  {
    step: 3,
    key: "RESOLVED",
    title: "Resolved",
    desc: "The issue has been resolved",
  },
];

function getStepState(currentStatus: string, stepIndex: number) {
  if (currentStatus === "RESOLVED") {
    return "completed";
  }
  if (currentStatus === "IN_PROGRESS") {
    if (stepIndex === 0) return "completed";
    if (stepIndex === 1) return "current";
    return "upcoming";
  }
  // OPEN
  if (stepIndex === 0) return "current";
  return "upcoming";
}

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
      return "bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20";

    case "IN_PROGRESS":
      return "bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info)]/20";

    default:
      return "bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/20";
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

      let { data, error } = await supabase
        .from("service_tickets")
        .select(
          "id, claim_id, ticket_type, subject, description, status, staff_note, resolved_at, created_at, updated_at"
        )
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false });

      let loadedTickets: Ticket[] = [];

      if (error && (error.message?.includes("staff_note") || error.code === "42703")) {
        const fallback = await supabase
          .from("service_tickets")
          .select(
            "id, claim_id, ticket_type, subject, description, status, resolved_at, created_at, updated_at"
          )
          .eq("requester_id", user.id)
          .order("created_at", { ascending: false });
        loadedTickets = (fallback.data ?? []).map((t) => ({ ...t, staff_note: null })) as Ticket[];
        error = fallback.error;
      } else if (data) {
        loadedTickets = data as Ticket[];
      }

      if (error) {
        setMessage(error.message);
      } else {
        setTickets(loadedTickets);
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
            <Text id="Loading tickets..." />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="ui-card p-4 text-sm text-[var(--foreground)]">
          <AppMessage text={message} />
        </div>
      )}

      {!message && tickets.length === 0 && (
        <div className="ui-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            <Text id="No service tickets" />
          </h2>

          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            <Text id="You have not submitted any service tickets." />
          </p>
        </div>
      )}

      {tickets.map((ticket) => (
        <article
          key={ticket.id}
          className="ui-card overflow-hidden shadow-sm transition hover:shadow-md"
        >
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                <span><Text id="Ticket #" />{ticket.id.slice(0, 8)}</span>
                <span>•</span>
                <span><DisplayValue value={ticket.ticket_type} /></span>
              </div>

              <h2 className="mt-1.5 break-words text-xl font-bold text-[var(--foreground)]">
                {ticket.subject}
              </h2>
            </div>

            <span
              className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                ticket.status
              )}`}
            >
              <DisplayValue value={ticket.status} />
            </span>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {/* 1. ขั้นตอนการดำเนินงาน (Progress Stepper) */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                  <Text id="Status progress" />
                </p>
                <p className="text-xs font-medium text-[var(--foreground-muted)]">
                  {ticket.status === "OPEN" && <Text id="Waiting for Staff to respond" />}
                  {ticket.status === "IN_PROGRESS" && <Text id="Resolving the issue" />}
                  {ticket.status === "RESOLVED" && <Text id="Completed successfully" />}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center sm:gap-4">
                {TICKET_STEPS.map((s, idx) => {
                  const state = getStepState(ticket.status, idx);
                  const isCompleted = state === "completed";
                  const isCurrent = state === "current";

                  return (
                    <div key={s.key} className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all sm:h-9 sm:w-9 ${
                          isCompleted
                            ? "bg-[var(--success)] text-[var(--primary-contrast)] shadow-sm"
                            : isCurrent
                            ? "border-2 border-[var(--primary)] bg-[var(--surface)] text-[var(--primary)] ring-4 ring-[var(--primary-soft)]"
                            : "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground-muted)]"
                        }`}
                      >
                        {isCompleted ? "✓" : s.step}
                      </div>

                      <p
                        className={`mt-2 text-xs font-semibold sm:text-sm ${
                          isCurrent
                            ? "text-[var(--primary)] font-bold"
                            : isCompleted
                            ? "text-[var(--success)]"
                            : "text-[var(--foreground-muted)]"
                        }`}
                      >
                        <UiText text={s.title} />
                      </p>

                      <p className="mt-0.5 hidden text-[11px] text-[var(--foreground-muted)] sm:block">
                        <UiText text={s.desc} />
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. สิ่งที่แจ้งไป (Reported Details) */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                <Text id="Reported details" />
              </p>

              <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-relaxed text-[var(--foreground)]">
                <p className="whitespace-pre-wrap break-words">
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* 3. คำแนะนำและวิธีแก้ปัญหาจากเจ้าหน้าที่ (Staff Resolution Note) */}
            {ticket.staff_note && (
              <div>
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-[var(--primary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                    <Text id="Resolution advice from Staff" />
                  </p>
                </div>

                <div className="mt-2 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-soft)]/30 p-4 text-sm leading-relaxed text-[var(--foreground)]">
                  <p className="whitespace-pre-wrap break-words font-medium">
                    {ticket.staff_note}
                  </p>
                </div>
              </div>
            )}

            {/* ข้อมูลสรุปเพิ่มเติม */}
            <div className="grid gap-3 border-t border-[var(--border)] pt-4 text-xs text-[var(--foreground-muted)] sm:grid-cols-2">
              <div>
                <span className="font-semibold text-[var(--foreground)]">
                  <Text id="Ticket type:" />{" "}
                </span>
                <span><DisplayValue value={ticket.ticket_type} /></span>
              </div>

              {ticket.claim_id && (
                <div>
                  <span className="font-semibold text-[var(--foreground)]">
                    <Text id="Related claim ID:" />{" "}
                  </span>
                  <span className="rounded bg-[var(--surface-soft)] px-1.5 py-0.5 font-mono text-[var(--foreground)]">
                    {ticket.claim_id}
                  </span>
                </div>
              )}

              <div>
                <span className="font-semibold text-[var(--foreground)]">
                  <Text id="Submitted on:" />{" "}
                </span>
                <span>{formatDateTime(ticket.created_at)}</span>
              </div>

              {ticket.resolved_at ? (
                <div>
                  <span className="font-semibold text-[var(--success)]">
                    <Text id="Completed on:" />{" "}
                  </span>
                  <span>{formatDateTime(ticket.resolved_at)}</span>
                </div>
              ) : (
                <div>
                  <span className="font-semibold text-[var(--foreground)]">
                    <Text id="Last updated:" />{" "}
                  </span>
                  <span>{formatDateTime(ticket.updated_at || ticket.created_at)}</span>
                </div>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}