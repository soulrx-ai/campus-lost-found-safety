import { Text } from "@/components/i18n/Text";
import SafetyReportForm from "@/components/safety/SafetyReportForm";

export default function SafetyReportPage() {
  return (
    <main className="min-h-screen bg-stone-50 dark:bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <header className="page-header">
          <p className="page-eyebrow">
            <Text id="Campus Safety" />
          </p>

          <h1 className="page-title">
            <Text id="Report Safety Incident" />
          </h1>

          <p className="page-description">
            <Text id="Report a safety issue or incident that occurred on campus." />
          </p>
        </header>

        <div className="mt-6">
          <SafetyReportForm />
        </div>
      </div>
    </main>
  );
}