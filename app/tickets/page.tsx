import MyTickets from "@/components/tickets/MyTickets";

export default function TicketsPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-stone-900">
          My Service Tickets
        </h1>

        <p className="mt-2 text-stone-600">
          Track issues you have reported to Staff.
        </p>

        <div className="mt-6">
          <MyTickets />
        </div>
      </div>
    </main>
  );
}