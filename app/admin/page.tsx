import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-6xl">
          <header className="mb-7">
            <p className="page-eyebrow">Administration</p>

            <h1 className="page-title">Admin Dashboard</h1>

            <p className="page-description">
              Monitor system-level information and access administrative
              tools for users, notifications, and activity logs.
            </p>
          </header>

          <AdminDashboard />
        </div>
      </div>
    </main>
  );
}