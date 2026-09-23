import Link from "next/link";
import MyTickets from "@/components/tickets/MyTickets";

export default function TicketsPage() {
  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-4xl">
          <header className="mb-7">
            <h1 className="page-title">My Service Tickets</h1>

            <div className="flex items-center justify-between gap-4">
              <p className="page-description">
                Track service requests you have submitted to Staff and follow
                their current progress.
              </p>

              <Link
                href="/tickets/new"
                className="shrink-0 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-contrast)] shadow-sm transition hover:bg-[var(--primary-hover)]"
              >
                + Create Ticket
              </Link>
            </div>
          </header>

          <MyTickets />
        </div>
      </div>
    </main>
  );
}