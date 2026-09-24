import { Text } from "@/components/i18n/Text";
import TicketForm from "@/components/tickets/TicketForm";

type Props = {
  searchParams: Promise<{
    claim?: string;
  }>;
};

export default async function NewTicketPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="page-header">
          <h1 className="page-title">
            <Text id="Create Service Ticket" />
          </h1>

          <p className="page-description">
            <Text id="Contact Staff about an unresolved issue." />
          </p>
        </header>

        <div className="mt-6">
          <TicketForm
            initialClaimId={params.claim ?? ""}
          />
        </div>
      </div>
    </main>
  );
}