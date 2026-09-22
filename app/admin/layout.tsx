import AdminNavigation from "@/components/admin/AdminNavigation";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdmin();

  return (
    <>
      <div className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="app-container pt-6">
          <AdminNavigation />
        </div>
      </div>

      {children}
    </>
  );
}