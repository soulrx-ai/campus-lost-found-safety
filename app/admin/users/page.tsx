import UserTable from "@/components/admin/UserTable";

export default function AdminUsersPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">
          User Management
        </h1>

        <p className="mt-2 text-stone-600">
          Manage user roles and account status.
        </p>

        <div className="mt-6">
          <UserTable />
        </div>
      </div>
    </main>
  );
}