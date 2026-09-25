import { Text } from "@/components/i18n/Text";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="page-header">
            <p className="page-eyebrow"><Text id="Administration" /></p>

            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="page-title"><Text id="Admin Dashboard" /></h1>

                <p className="page-description">
                  <Text id="Overview of users, lost and found records, safety incidents, and service tickets across the campus system." />
                </p>
              </div>
            </div>
          </header>

          <AdminDashboard />
        </div>
      </div>
    </main>
  );
}