import Link from "next/link";
import { Text } from "@/components/i18n/Text";
import { requireStaff } from "@/lib/auth/guards";
import { loadStaffDashboard, type StaffDashboardMetric } from "@/lib/staff/dashboard";
import { createClient } from "@/lib/supabase/server";

const metricDetails: Record<
  StaffDashboardMetric["key"],
  { label: Parameters<typeof Text>[0]["id"]; href: string; tone: string }
> = {
  items: {
    label: "Items pending review",
    href: "/staff/items",
    tone: "text-[var(--warning)]",
  },
  claims: {
    label: "Claims waiting for review",
    href: "/staff/claims",
    tone: "text-[var(--warning)]",
  },
  handovers: {
    label: "Approved claims waiting for handover",
    href: "/staff/claims",
    tone: "text-[var(--success)]",
  },
  safety: {
    label: "Safety incidents pending review",
    href: "/staff/safety",
    tone: "text-[var(--danger)]",
  },
  tickets: {
    label: "Tickets open or in progress",
    href: "/staff/tickets",
    tone: "text-[var(--info)]",
  },
};

const quickLinks = [
  {
    href: "/staff/items",
    title: "Review Items",
    description: "Review pending lost and found reports.",
  },
  {
    href: "/staff/claims",
    title: "Review Claims",
    description: "Review claims and manage item handovers.",
  },
  {
    href: "/staff/safety",
    title: "Review Safety",
    description: "Review pending campus safety incidents.",
  },
  {
    href: "/staff/tickets",
    title: "Manage Tickets",
    description: "Process open and in-progress service tickets.",
  },
] as const;

export default async function StaffDashboardPage() {
  await requireStaff();
  const supabase = await createClient();
  const metrics = await loadStaffDashboard(supabase);
  const hasErrors = metrics.some((metric) => metric.error);
  const totalWork = metrics.reduce(
    (total, metric) => total + (metric.count ?? 0),
    0
  );

  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="page-header">
            <p className="page-eyebrow"><Text id="Staff Operations" /></p>
            <h1 className="page-title"><Text id="Staff Dashboard" /></h1>
            <p className="page-description">
              <Text id="Review current operational workload and open each Staff workflow." />
            </p>
          </header>

          <section aria-labelledby="workload-heading">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="workload-heading" className="text-lg font-semibold text-[var(--heading)]">
                  <Text id="Current workload" />
                </h2>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  <Text id="Live records currently requiring Staff attention." />
                </p>
              </div>
              {!hasErrors && (
                <p className="text-sm font-medium text-[var(--foreground-muted)]">
                  {totalWork} <Text id="tasks requiring attention" />
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {metrics.map((metric) => {
                const details = metricDetails[metric.key];
                return (
                  <Link
                    key={metric.key}
                    href={details.href}
                    className="ui-card group flex min-h-40 flex-col justify-between p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-md"
                  >
                    <p className="text-sm font-medium leading-5 text-[var(--foreground-muted)]">
                      <Text id={details.label} />
                    </p>
                    {metric.error ? (
                      <div role="alert" className="mt-4 text-sm text-[var(--danger)]">
                        <p className="font-semibold"><Text id="Unable to load count" /></p>
                        <p className="mt-1 break-words text-xs">{metric.error}</p>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <p className={`text-4xl font-bold tracking-tight ${details.tone}`}>
                          {metric.count}
                        </p>
                        <span aria-hidden="true" className="text-[var(--foreground-muted)] transition group-hover:translate-x-1">&rarr;</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>

          {!hasErrors && totalWork === 0 && (
            <section className="ui-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-[var(--heading)]">
                <Text id="No pending Staff work" />
              </h2>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                <Text id="There are no items, claims, handovers, incidents, or tickets waiting for attention." />
              </p>
            </section>
          )}

          <section aria-labelledby="quick-links-heading">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
              <Text id="Quick access" />
            </p>
            <h2 id="quick-links-heading" className="mt-1 text-lg font-semibold text-[var(--heading)]">
              <Text id="Staff workflows" />
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="ui-card group flex min-h-32 items-center justify-between gap-5 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-soft)] hover:shadow-md sm:p-6"
                >
                  <div>
                    <h3 className="font-semibold text-[var(--heading)]"><Text id={link.title} /></h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]"><Text id={link.description} /></p>
                  </div>
                  <span aria-hidden="true" className="shrink-0 text-[var(--foreground-muted)] transition group-hover:translate-x-1">&rarr;</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
