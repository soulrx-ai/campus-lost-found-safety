import { Text } from "@/components/i18n/Text";
import NotificationForm from "@/components/admin/NotificationForm";

export default function AdminNotificationsPage() {
  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-2xl">
          <header className="mb-7">
            <p className="page-eyebrow"><Text id="Administration" /></p>

            <h1 className="page-title"><Text id="Send Notification" /></h1>

            <p className="page-description">
              <Text id="Send a system notification directly to a registered user." />
            </p>
          </header>

          <NotificationForm />
        </div>
      </div>
    </main>
  );
}