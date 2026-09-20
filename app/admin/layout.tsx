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
      <div className="bg-stone-50 px-4 pt-6">
        <div className="mx-auto max-w-6xl">
          <AdminNavigation />
        </div>
      </div>

      {children}
    </>
  );
}