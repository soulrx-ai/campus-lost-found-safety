import UserTable from "@/components/admin/UserTable";

export default function AdminUsersPage() {
  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-6xl">
          <header className="mb-7">
            <p className="page-eyebrow">Administration</p>

            <h1 className="page-title">User Management</h1>

            <p className="page-description">
              Review registered users and manage their system role and
              account status.
            </p>
          </header>

          <UserTable />
        </div>
      </div>
    </main>
  );
}