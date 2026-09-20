import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-medium text-stone-500">
          Administration
        </p>

        <h1 className="mt-1 text-3xl font-bold text-stone-900">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-stone-600">
          Manage users and monitor system activity.
        </p>

        <div className="mt-8">
          <AdminDashboard />
        </div>
      </div>
    </main>
  );
}