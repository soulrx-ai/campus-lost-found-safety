import NotificationForm from "@/components/admin/NotificationForm";

export default function AdminNotificationsPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">
          Send Notification
        </h1>

        <p className="mt-2 text-stone-600">
          Send a system notification to a user.
        </p>

        <div className="mt-6">
          <NotificationForm />
        </div>
      </div>
    </main>
  );
}