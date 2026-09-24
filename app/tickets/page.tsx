import { Text } from "@/components/i18n/Text";
import Link from "next/link";
import MyTickets from "@/components/tickets/MyTickets";

export default function TicketsPage() {
  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-4xl">
          <header className="page-header mb-7">
            <h1 className="page-title"><Text id="My Service Tickets" /></h1>

            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <p className="page-description">
                <Text id="Track service requests you have submitted to Staff and follow their current progress." />
              </p>

              <Link
                href="/tickets/new"
                className="ui-button-primary shrink-0"
              >
                <Text id="+ Create Ticket" />
              </Link>
            </div>
          </header>

          <MyTickets />
        </div>
      </div>
    </main>
  );
}