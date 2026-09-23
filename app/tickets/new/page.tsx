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
        <h1 className="text-3xl font-bold text-stone-900 dark:text-[var(--foreground)]">
          <Text id="Create Service Ticket" />
        </h1>

        <p className="mt-2 text-stone-600 dark:text-[var(--foreground-muted)]">
          <Text id="Contact Staff about an unresolved issue." />
        </p>

        <div className="mt-6">
          <TicketForm
            initialClaimId={params.claim ?? ""}
          />
        </div>
      </div>
    </main>
  );
}