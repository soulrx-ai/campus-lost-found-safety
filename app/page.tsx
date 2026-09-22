import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

type Activity = {
  id: string;
  type: "LOST" | "FOUND" | "CLAIM" | "SAFETY" | "TICKET";
  label: string;
  title: string;
  status: string;
  createdAt: string;
  href: string;
};

export default async function Home() {
  const profile = await requireUser();
  const supabase = await createClient();

  /*
   * Latest published campus safety incident.
   * Do not request image_url because safety images are private.
   */
  const { data: latestIncident } = await supabase
    .from("security_incidents")
    .select(
      "id, title, description, location, incident_time"
    )
    .eq("status", "PUBLISHED")
    .order("incident_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  /*
   * Load only activity owned by the signed-in user.
   */
  const [
    { data: myItems },
    { data: myClaims },
    { data: mySafetyReports },
    { data: myTickets },
  ] = await Promise.all([
    supabase
      .from("items")
      .select(
        "id, report_type, name, status, created_at"
      )
      .eq("reporter_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("claims")
      .select("id, status, created_at")
      .eq("claimant_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("security_incidents")
      .select("id, title, status, created_at")
      .eq("reporter_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),

    supabase
      .from("service_tickets")
      .select(
        "id, subject, status, created_at"
      )
      .eq("requester_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const activities: Activity[] = [
    ...(myItems ?? []).map((item) => ({
      id: `item-${item.id}`,
      type:
        item.report_type === "LOST"
          ? ("LOST" as const)
          : ("FOUND" as const),
      label:
        item.report_type === "LOST"
          ? "Lost Report"
          : "Found Report",
      title: item.name,
      status: item.status,
      createdAt: item.created_at,
      href:
        item.report_type === "LOST"
          ? "/matching"
          : "/search",
    })),

    ...(myClaims ?? []).map((claim) => ({
      id: `claim-${claim.id}`,
      type: "CLAIM" as const,
      label: "Claim",
      title: `Claim #${claim.id
        .slice(0, 8)
        .toUpperCase()}`,
      status: claim.status,
      createdAt: claim.created_at,
      href: "/claims",
    })),

    ...(mySafetyReports ?? []).map((incident) => ({
      id: `safety-${incident.id}`,
      type: "SAFETY" as const,
      label: "Safety Report",
      title: incident.title,
      status: incident.status,
      createdAt: incident.created_at,
      href: "/safety",
    })),

    ...(myTickets ?? []).map((ticket) => ({
      id: `ticket-${ticket.id}`,
      type: "TICKET" as const,
      label: "Service Ticket",
      title: ticket.subject,
      status: ticket.status,
      createdAt: ticket.created_at,
      href: "/tickets",
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-6xl">
          {/* Welcome */}
          <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="page-eyebrow">
                Lost & Found & Safety Incident Reporting System
              </p>

              <h1 className="page-title">
                Welcome, {profile.full_name}
              </h1>

              <p className="page-description">
                Find lost items, track your reports and stay
                informed about campus safety.
              </p>
            </div>

            <span className="w-fit rounded-full bg-[var(--primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
              {profile.role}
            </span>
          </section>

          {/* Safety Highlight */}
          <section className="mb-9">
            <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--danger)]/20 bg-[var(--danger-soft)]">
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <SafetyIcon />

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--danger)]">
                        Safety Incident
                      </p>

                      <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                        Campus safety update
                      </p>
                    </div>
                  </div>

                  {latestIncident && (
                    <span className="hidden rounded-full border border-[var(--danger)]/20 bg-white/60 px-3 py-1 text-[11px] font-semibold text-[var(--danger)] sm:inline-flex">
                      PUBLISHED
                    </span>
                  )}
                </div>

                <div className="my-5 border-t border-[var(--danger)]/15" />

                {latestIncident ? (
                  <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-[var(--foreground)] sm:text-2xl">
                        {latestIncident.title}
                      </h2>

                      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--foreground-muted)] sm:text-base">
                        {latestIncident.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2 text-sm text-[var(--foreground-muted)]">
                          <LocationIcon />

                          <span>{latestIncident.location}</span>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-lg bg-white/60 px-3 py-2 text-sm text-[var(--foreground-muted)]">
                          <ClockIcon />

                          <span>
                            {new Date(
                              latestIncident.incident_time
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/safety"
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--danger)] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 lg:w-auto"
                    >
                      View details
                      <span className="ml-2" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--foreground)]">
                        No active safety incidents
                      </h2>

                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        There are currently no published safety incidents.
                      </p>
                    </div>

                    <Link
                      href="/safety"
                      className="ui-button-secondary w-full sm:w-auto"
                    >
                      View Safety
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Lost & Found quick actions */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Lost & Found
              </h2>

              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Search, report and recover items on campus.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <MenuCard
                href="/search"
                label="SEARCH"
                title="Search Items"
                description="Search approved lost and found reports."
              />

              <MenuCard
                href="/lost/report"
                label="LOST"
                title="Report Lost Item"
                description="Report an item that you lost."
                tone="warning"
              />

              <MenuCard
                href="/found/report"
                label="FOUND"
                title="Report Found Item"
                description="Report an item that you found."
                tone="success"
              />
            </div>
          </section>
          {/* Report Safety Incident */}
          <section className="mt-6">
            <Link
              href="/safety/report"
              className="group flex flex-col gap-5 rounded-[var(--radius-lg)] border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-5 transition hover:border-[var(--danger)]/40 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div className="flex items-start gap-4">
                <SafetyIcon />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">
                    Campus Safety
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                    Report a Safety Incident
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
                    Report an accident, hazard or safety concern on campus
                    for Staff review.
                  </p>
                </div>
              </div>

              <span className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--danger)] px-5 py-2.5 text-sm font-medium text-white transition group-hover:opacity-90">
                Report Incident →
              </span>
            </Link>
          </section>

          {/* My Activity */}
          <section className="mt-9">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  My Activity
                </h2>

                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Track the latest status of your reports,
                  claims and service requests.
                </p>
              </div>

              {activities.length > 0 && (
                <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-medium text-[var(--primary)]">
                  Latest {activities.length}
                </span>
              )}
            </div>

            {activities.length === 0 ? (
              <div className="ui-card p-6">
                <h3 className="font-semibold text-[var(--foreground)]">
                  No activity yet
                </h3>

                <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                  Your reports, claims and service tickets will
                  appear here after you submit them.
                </p>
              </div>
            ) : (
              <div className="ui-card overflow-hidden">
                {activities.map((activity, index) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    showBorder={index !== 0}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Recovery & Support */}
          <section className="mt-9">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Recovery & Support
              </h2>

              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Continue the recovery process or contact Staff
                for support.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MenuCard
                href="/matching"
                label="MATCH"
                title="Find Potential Matches"
                description="Compare your lost reports with published found items."
              />

              <MenuCard
                href="/claims"
                label="CLAIMS"
                title="My Claims"
                description="View and track your submitted claims."
              />

              <MenuCard
                href="/tickets"
                label="SUPPORT"
                title="Service Tickets"
                description="View and manage your service requests."
              />
            </div>
          </section>


          {/* Role shortcuts */}
          {profile.role === "STAFF" && (
            <section className="mt-8">
              <MenuCard
                href="/staff/claims"
                label="STAFF"
                title="Staff Operations"
                description="Review claims and manage item handovers."
              />
            </section>
          )}
          <footer className="mt-12 border-t border-[var(--border)] py-7">
            <div className="flex flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[var(--foreground)]">
                  Lost & Found & Safety Incident Reporting System
                </p>

                <p className="mt-1 text-[var(--foreground-muted)]">
                  Campus item recovery and safety reporting service.
                </p>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <Link
                  href="/search"
                  className="text-[var(--foreground-muted)] transition hover:text-[var(--primary)]"
                >
                  Lost & Found
                </Link>

                <Link
                  href="/safety"
                  className="text-[var(--foreground-muted)] transition hover:text-[var(--primary)]"
                >
                  Safety
                </Link>

                <Link
                  href="/tickets"
                  className="text-[var(--foreground-muted)] transition hover:text-[var(--primary)]"
                >
                  Support
                </Link>
              </div>
            </div>

            <p className="mt-5 text-xs text-[var(--foreground-muted)]">
              Walailak University
            </p>
          </footer>

          {profile.role === "ADMIN" && (
            <section className="mt-8">
              <MenuCard
                href="/admin"
                label="ADMIN"
                title="Admin Dashboard"
                description="Manage users, notifications and system activity."
              />
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function ActivityRow({
  activity,
  showBorder,
}: {
  activity: Activity;
  showBorder: boolean;
}) {
  return (
    <Link
      href={activity.href}
      className={`grid gap-3 p-4 transition hover:bg-[var(--surface-soft)] sm:grid-cols-[9rem_1fr_auto_auto] sm:items-center sm:px-5 ${showBorder
        ? "border-t border-[var(--border)]"
        : ""
        }`}
    >
      <ActivityTypeBadge activity={activity} />

      <div className="min-w-0">
        <p className="truncate font-medium text-[var(--foreground)]">
          {activity.title}
        </p>

        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          {new Date(activity.createdAt).toLocaleString()}
        </p>
      </div>

      <StatusBadge status={activity.status} />

      <span
        aria-hidden="true"
        className="hidden text-lg text-[var(--foreground-muted)] sm:block"
      >
        →
      </span>
    </Link>
  );
}

function ActivityTypeBadge({
  activity,
}: {
  activity: Activity;
}) {
  const classes = {
    LOST:
      "bg-[var(--warning-soft)] text-[var(--warning)]",
    FOUND:
      "bg-[var(--success-soft)] text-[var(--success)]",
    CLAIM:
      "bg-[var(--primary-soft)] text-[var(--primary)]",
    SAFETY:
      "bg-[var(--danger-soft)] text-[var(--danger)]",
    TICKET:
      "bg-[var(--info-soft)] text-[var(--info)]",
  }[activity.type];

  return (
    <span
      className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes}`}
    >
      {activity.label}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let classes =
    "bg-[var(--primary-soft)] text-[var(--primary)]";

  if (
    [
      "PUBLISHED",
      "APPROVED",
      "COMPLETED",
      "RESOLVED",
      "RETURNED",
    ].includes(status)
  ) {
    classes =
      "bg-[var(--success-soft)] text-[var(--success)]";
  } else if (
    ["PENDING_REVIEW", "OPEN"].includes(status)
  ) {
    classes =
      "bg-[var(--warning-soft)] text-[var(--warning)]";
  } else if (status === "IN_PROGRESS") {
    classes =
      "bg-[var(--info-soft)] text-[var(--info)]";
  } else if (status === "REJECTED") {
    classes =
      "bg-[var(--danger-soft)] text-[var(--danger)]";
  }

  return (
    <span
      className={`w-fit whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function MenuCard({
  href,
  label,
  title,
  description,
  tone = "default",
}: {
  href: string;
  label: string;
  title: string;
  description: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass = {
    default:
      "bg-[var(--primary-soft)] text-[var(--primary)]",
    success:
      "bg-[var(--success-soft)] text-[var(--success)]",
    warning:
      "bg-[var(--warning-soft)] text-[var(--warning)]",
  }[tone];

  return (
    <Link
      href={href}
      className="ui-card group flex min-h-44 flex-col justify-between p-5 transition duration-150 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-md"
    >
      <div>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${toneClass}`}
        >
          {label}
        </span>

        <h3 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
          {description}
        </p>
      </div>

      <span className="mt-5 text-sm font-medium text-[var(--primary)]">
        Open →
      </span>
    </Link>
  );
}
function SafetyIcon() {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--danger)] text-white shadow-sm">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    </span>
  );
}
function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-[var(--danger)]"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-[var(--danger)]"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}