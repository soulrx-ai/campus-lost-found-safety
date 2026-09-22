import ActivityLogTable from "@/components/admin/ActivityLogTable";

export default function AdminLogsPage() {
  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-6xl">
          <header className="mb-7">
            <p className="page-eyebrow">Administration</p>

            <h1 className="page-title">Activity Logs</h1>

            <p className="page-description">
              Review recent system activity recorded for administrative
              auditing.
            </p>
          </header>

          <ActivityLogTable />
        </div>
      </div>
    </main>
  );
}