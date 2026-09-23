import { Text } from "@/components/i18n/Text";
import ActivityLogTable from "@/components/admin/ActivityLogTable";

export default function AdminLogsPage() {
  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-6xl">
          <header className="mb-7">
            <p className="page-eyebrow"><Text id="Administration" /></p>

            <h1 className="page-title"><Text id="Activity Logs" /></h1>

            <p className="page-description">
              <Text id="Review recent system activity recorded for administrative auditing." />
            </p>
          </header>

          <ActivityLogTable />
        </div>
      </div>
    </main>
  );
}