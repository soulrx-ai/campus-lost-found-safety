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
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

const TICKET_STEPS = [
  {
    step: 1,
    key: "OPEN",
    title: "Submitted",
    desc: "รอเจ้าหน้าที่รับเรื่อง",
  },
  {
    step: 2,
    key: "IN_PROGRESS",
    title: "In Progress",
    desc: "เจ้าหน้าที่กำลังตรวจสอบ",
  },
  {
    step: 3,
    key: "RESOLVED",
    title: "Resolved",
    desc: "ดำเนินการแก้ไขเสร็จสิ้น",
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

function getTicketTypeLabel(type: string) {
  switch (type) {
    case "NOT_RECEIVED":
      return "Item Not Received (ยังไม่ได้รับของที่เคลม)";
    case "SYSTEM_PROBLEM":
      return "System Problem (ปัญหาระบบ/การใช้งาน)";
    case "GENERAL":
      return "General Inquiry (เรื่องทั่วไป)";
    default:
      return type.replaceAll("_", " ");
  }
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

      const { data, error } = await supabase
        .from("service_tickets")
        .select(
          "id, claim_id, ticket_type, subject, description, status, resolved_at, created_at, updated_at"
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
    <div className="space-y-6">
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
          className="ui-card overflow-hidden shadow-sm transition hover:shadow-md"
        >
          {/* Header */}
          <div className="flex flex-col gap-3 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                <span>Ticket #{ticket.id.slice(0, 8)}</span>
                <span>•</span>
                <span>{getTicketTypeLabel(ticket.ticket_type)}</span>
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
              {ticket.status.replaceAll("_", " ")}
            </span>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {/* 1. ขั้นตอนการดำเนินงาน (Progress Stepper) */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                  ขั้นตอนการดำเนินงาน (Status Progress)
                </p>
                <p className="text-xs font-medium text-[var(--foreground-muted)]">
                  {ticket.status === "OPEN" && "รอเจ้าหน้าที่รับเรื่อง"}
                  {ticket.status === "IN_PROGRESS" && "กำลังดำเนินการแก้ไข"}
                  {ticket.status === "RESOLVED" && "เสร็จสิ้นเรียบร้อย"}
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
                        {s.title}
                      </p>

                      <p className="mt-0.5 hidden text-[11px] text-[var(--foreground-muted)] sm:block">
                        {s.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. สิ่งที่แจ้งไป (Reported Details) */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                รายละเอียดเรื่องที่แจ้ง (Reported Details)
              </p>

              <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-relaxed text-[var(--foreground)]">
                <p className="whitespace-pre-wrap break-words">
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* ข้อมูลสรุปเพิ่มเติม */}
            <div className="grid gap-3 border-t border-[var(--border)] pt-4 text-xs text-[var(--foreground-muted)] sm:grid-cols-2">
              <div>
                <span className="font-semibold text-[var(--foreground)]">
                  ประเภทเรื่อง:{" "}
                </span>
                <span>{getTicketTypeLabel(ticket.ticket_type)}</span>
              </div>

              {ticket.claim_id && (
                <div>
                  <span className="font-semibold text-[var(--foreground)]">
                    รหัสเคลมที่เกี่ยวข้อง:{" "}
                  </span>
                  <span className="rounded bg-[var(--surface-soft)] px-1.5 py-0.5 font-mono text-[var(--foreground)]">
                    {ticket.claim_id}
                  </span>
                </div>
              )}

              <div>
                <span className="font-semibold text-[var(--foreground)]">
                  วันที่แจ้งเรื่อง:{" "}
                </span>
                <span>{formatDateTime(ticket.created_at)}</span>
              </div>

              {ticket.resolved_at ? (
                <div>
                  <span className="font-semibold text-[var(--success)]">
                    เสร็จสิ้นเมื่อ:{" "}
                  </span>
                  <span>{formatDateTime(ticket.resolved_at)}</span>
                </div>
              ) : (
                <div>
                  <span className="font-semibold text-[var(--foreground)]">
                    อัปเดตล่าสุด:{" "}
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