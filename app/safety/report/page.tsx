import SafetyReportForm from "@/components/safety/SafetyReportForm";

export default function SafetyReportPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-medium text-red-600">
          Campus Safety
        </p>

        <h1 className="mt-1 text-3xl font-bold text-stone-900">
          Report Safety Incident
        </h1>

        <p className="mt-2 text-stone-600">
          Report a safety issue or incident that occurred on campus.
        </p>

        <div className="mt-6">
          <SafetyReportForm />
        </div>
      </div>
    </main>
  );
}