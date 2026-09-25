import { Text } from "@/components/i18n/Text";

export default function StaffLoading() {
  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="ui-card mx-auto max-w-6xl p-6" role="status">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--heading)]" />
            <p className="text-sm text-[var(--foreground-muted)]"><Text id="Loading Staff dashboard..." /></p>
          </div>
        </div>
      </div>
    </main>
  );
}
