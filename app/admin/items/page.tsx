import { Text } from "@/components/i18n/Text";
import AdminItemManager from "@/components/admin/AdminItemManager";

export default function AdminItemsPage() {
  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-6xl">
          <header className="mb-7 rounded-[28px] border border-[#ddcce8] border-l-4 border-l-[#7e42a4] bg-[#f7f3f9] px-6 py-7 shadow-sm sm:px-10 sm:py-8 dark:border-[#554264] dark:border-l-[#b887d3] dark:bg-[#241e28]">
            <p className="text-sm font-medium text-[#77409d] dark:text-[#c99ae4]">
              <Text id="Administration" />
            </p>

            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-[#77409d] sm:text-[2.75rem] dark:text-[#c99ae4]">
              <Text id="Item Management" />
            </h1>

            <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--foreground-muted)] sm:text-lg">
              <Text id="Manage lost and found item reports." />
            </p>
          </header>

          <AdminItemManager />
        </div>
      </div>
    </main>
  );
}
