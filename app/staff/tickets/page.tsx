import { Text } from "@/components/i18n/Text";
import TicketManagementCard from "@/components/staff/TicketManagementCard";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ComponentProps } from "react";

type Ticket = ComponentProps<typeof TicketManagementCard>["ticket"];

export default async function StaffTicketsPage() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_tickets")
    .select(
      "id, requester_id, claim_id, ticket_type, subject, description, status, assigned_to, staff_note, created_at, updated_at"
    )
    .in("status", ["OPEN", "IN_PROGRESS", "RESOLVED"])
    .order("created_at", {
      ascending: false,
    });

  const tickets = (data ?? []) as Ticket[];

  const openCount = tickets.filter(
    (ticket) => ticket.status === "OPEN"
  ).length;

  const progressCount = tickets.filter(
    (ticket) => ticket.status === "IN_PROGRESS"
  ).length;

  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-5xl">
          <header className="page-header mb-7">
            <p className="page-eyebrow"><Text id="Staff Operations" /></p>

            <h1 className="page-title"><Text id="Service Tickets" /></h1>

            <p className="page-description">
              <Text id="Process user service requests and track them from opening through resolution." />
            </p>
          </header>

          {error ? (
            <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)]">
              <Text id="Unable to load tickets:" /> {error.message}
            </div>
          ) : tickets.length === 0 ? (
            <div className="ui-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-[var(--heading)]">
                <Text id="No service tickets" />
              </h2>

              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                <Text id="There are currently no service tickets to process." />
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="ui-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                    <Text id="Open" />
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[var(--warning)]">
                    {openCount}
                  </p>
                </div>

                <div className="ui-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                    <Text id="In progress" />
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[var(--info)]">
                    {progressCount}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {tickets.map((ticket) => (
                  <TicketManagementCard
                    key={ticket.id}
                    ticket={ticket}
                    staffId={staff.id}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}