import ActivityLogTable from "@/components/admin/ActivityLogTable";

export default function AdminLogsPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">
          Activity Logs
        </h1>

        <p className="mt-2 text-stone-600">
          Review recorded system activity.
        </p>

        <div className="mt-6">
          <ActivityLogTable />
        </div>
      </div>
    </main>
  );
}