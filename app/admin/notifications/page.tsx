import NotificationForm from "@/components/admin/NotificationForm";

export default function AdminNotificationsPage() {
  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-2xl">
          <header className="mb-7">
            <p className="page-eyebrow">Administration</p>

            <h1 className="page-title">Send Notification</h1>

            <p className="page-description">
              Send a system notification directly to a registered user.
            </p>
          </header>

          <NotificationForm />
        </div>
      </div>
    </main>
  );
}