import { DisplayValue, Text, UiText } from "@/components/i18n/Text";
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

type MenuTone =
  | "search"
  | "lost"
  | "found"
  | "matching"
  | "claims"
  | "support";

type MenuIcon =
  | "search"
  | "lost"
  | "found"
  | "matching"
  | "claims"
  | "support";

export default async function Home() {
  const profile = await requireUser();
  const supabase = await createClient();

  /*
   * Latest published campus safety incident.
   * Do not request image_url because safety images are private.
   */
  const { data: latestIncident, error: incidentError } = await supabase
    .from("security_incidents")
    .select("id, title, description, location, incident_time")
    .eq("status", "PUBLISHED")
    .order("incident_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  /*
   * Load activity owned by the signed-in user.
   * RLS still decides which rows the current user can read.
   */
  const [
    { data: myItems, error: itemsError },
    { data: myClaims, error: claimsError },
    { data: mySafetyReports, error: safetyError },
    { data: myTickets, error: ticketsError },
  ] = await Promise.all([
    supabase
      .from("items")
      .select("id, report_type, name, status, created_at")
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
      .select("id, subject, status, created_at")
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
      title: `Claim #${claim.id.slice(0, 8).toUpperCase()}`,
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
          {(incidentError || itemsError || claimsError || safetyError || ticketsError) && (
            <div role="alert" className="ui-card mb-6 p-4 text-[var(--danger)]">
              <Text id="Something went wrong. Please try again." />
            </div>
          )}
          {/* Welcome */}
          <section className="relative mb-6 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--success)]/20 bg-[var(--surface)] px-6 py-5 shadow-[0_12px_36px_rgba(41,39,34,0.06)] sm:px-8 sm:py-6">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[var(--success)]/15"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 right-24 h-44 w-44 rounded-full bg-[var(--warning)]/15"
            />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--success)]">
                  <Text id="Campus Services" />
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--heading)] [overflow-wrap:anywhere] sm:text-4xl">
                  <Text id="Welcome," /> {profile.full_name}
                </h1>

                <p className="mt-2 max-w-2xl [overflow-wrap:anywhere] text-sm leading-6 text-[var(--foreground-muted)] sm:text-base">
                  <Text id="Search for lost items, follow your reports and stay informed about campus safety." />
                </p>
              </div>

              <span data-accent={profile.role.toLowerCase()} className="role-badge w-fit shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold">
                <DisplayValue value={profile.role} />
              </span>
            </div>
          </section>

          {/* Safety + My Activity */}
          <section className="grid items-start gap-5 lg:items-stretch lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="safety-banner">
              <div className="safety-banner-content">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <SafetyIcon />

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-white">
                        <Text id="Safety Update" />
                      </p>
                      <p className="mt-0.5 text-xs text-white/85">
                        <Text id="Latest published campus incident" />
                      </p>
                    </div>
                  </div>

                  {latestIncident && (
                    <span className="inline-flex shrink-0 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white">
                      <DisplayValue value="PUBLISHED" />
                    </span>
                  )}
                </div>

                <div className="my-5 border-t border-white/20" />

                {latestIncident ? (
                  <div className="flex min-w-0 flex-col lg:flex-1">
                    <h2 className="max-w-2xl [overflow-wrap:anywhere] text-xl font-bold text-white sm:text-2xl">
                      {latestIncident.title}
                    </h2>

                    <p className="mt-2 max-w-2xl [overflow-wrap:anywhere] text-sm leading-6 text-white/85">
                      {latestIncident.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl bg-white/10 [overflow-wrap:anywhere] [&>svg]:shrink-0 px-3 py-2 text-sm text-white/85">
                        <LocationIcon />
                        <span>{latestIncident.location}</span>
                      </div>

                      <div className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl bg-white/10 [overflow-wrap:anywhere] [&>svg]:shrink-0 px-3 py-2 text-sm text-white/85">
                        <ClockIcon />
                        <span>
                          {new Date(
                            latestIncident.incident_time
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 lg:mt-auto lg:pt-5">
                      <Link
                        href="/safety"
                        className="safety-banner-cta"
                      >
                        <Text id="View safety details" />
                        <span className="ml-2" aria-hidden="true">
                          →
                        </span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-w-0 flex-col gap-5 lg:flex-1">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        <Text id="No active safety incidents" />
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-white/85">
                        <Text id="There are currently no published safety incidents." />
                      </p>
                    </div>

                    <Link
                      href="/safety"
                      className="safety-banner-cta w-fit lg:mt-auto"
                    >
                      <Text id="View Safety" />
                    </Link>
                  </div>
                )}
              </div>
              <div className="safety-banner-image" aria-hidden="true" />
            </div>

            {/* My Activity */}
            <section className="ui-card min-w-0 p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <SectionHeading
                  eyebrow="My Activity"
                  title="Recent updates"
                  description="Track your latest reports, claims and service requests."
                />

                {activities.length > 0 && (
                  <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                    <Text id="Latest" /> {activities.length}
                  </span>
                )}
              </div>

              <div className="mt-5">
                {activities.length === 0 ? (
                  <div className="border-l-4 border-l-[var(--success)]/40 px-5 py-4 sm:px-6 sm:py-5">
                    <div className="flex max-w-2xl items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--success)]/15 text-[var(--success)]">
                        <ActivityIcon />
                      </span>

                      <div>
                        <h3 className="font-semibold text-[var(--heading)]">
                          <Text id="No activity yet" />
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
                          <Text id="Your reports, claims and service tickets will appear here after you submit them." />
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
                    {activities.map((activity, index) => (
                      <ActivityRow
                        key={activity.id}
                        activity={activity}
                        showBorder={index !== 0}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </section>

          {/* Lost & Found */}
          <section className="mt-10">
            <SectionHeading
              eyebrow="Lost & Found"
              title="Recover belongings faster"
              description="Search published reports or create a new report for a lost or found item."
            />

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <MenuCard
                href="/search"
                icon="search"
                label="SEARCH"
                title="Search Items"
                description="Search approved lost and found reports."
                tone="search"
              />

              <MenuCard
                href="/lost/report"
                icon="lost"
                label="LOST"
                title="Report Lost Item"
                description="Create a report for an item you lost."
                tone="lost"
              />

              <MenuCard
                href="/found/report"
                icon="found"
                label="FOUND"
                title="Report Found Item"
                description="Help return an item to its owner."
                tone="found"
              />
            </div>
          </section>

          {/* Report Safety */}
          <section className="mt-6">
            <Link
              href="/safety/report"
              className="group relative flex overflow-hidden rounded-[var(--radius-xl)] border border-[var(--danger)]/20 bg-[var(--danger-solid)] p-5 text-white shadow-[0_12px_32px_rgba(165,67,61,0.14)] transition hover:-translate-y-0.5 sm:p-6"
            >
              <div
                aria-hidden="true"
                className="absolute -right-12 -top-16 h-48 w-48 rounded-full border-[28px] border-white/10"
              />

              <div className="relative flex w-full flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <SafetyOutlineIcon />
                  </span>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                      <Text id="Campus Safety" />
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      <Text id="Report a Safety Incident" />
                    </h2>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-white/80">
                      <Text id="Report an accident, hazard or safety concern for Staff review." />
                    </p>
                  </div>
                </div>

                <span className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--danger)]">
                  <Text id="Report Incident →" />
                </span>
              </div>
            </Link>
          </section>

          {/* Recovery & Support */}
          <section className="mt-10">
            <SectionHeading
              eyebrow="Recovery & Support"
              title="Continue where you left off"
              description="Check potential matches, track claims or contact Staff for help."
            />

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <MenuCard
                href="/matching"
                icon="matching"
                label="MATCH"
                title="Find Potential Matches"
                description="Compare your lost reports with published found items."
                tone="matching"
              />

              <MenuCard
                href="/claims"
                icon="claims"
                label="CLAIMS"
                title="My Claims"
                description="View the status of your submitted claims."
                tone="claims"
              />

              <MenuCard
                href="/tickets"
                icon="support"
                label="SUPPORT"
                title="Need Help?"
                description="View or manage your service requests."
                tone="support"
              />
            </div>
          </section>

          {/* Role shortcuts */}
          {profile.role === "STAFF" && (
            <section className="mt-8" data-accent="staff">
              <Link
                href="/staff/claims"
                className="ui-card flex flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--heading)]">
                    <Text id="Staff" />
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-[var(--heading)]">
                    <Text id="Staff Operations" />
                  </h2>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    <Text id="Review claims and manage item handovers." />
                  </p>
                </div>

                <span className="font-semibold text-[var(--primary)]">
                  <Text id="Open workspace →" />
                </span>
              </Link>
            </section>
          )}

          {profile.role === "ADMIN" && (
            <section className="mt-8" data-accent="admin">
              <Link
                href="/admin"
                className="ui-card flex flex-col gap-4 p-5 transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--heading)]">
                    <Text id="Admin" />
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-[var(--heading)]">
                    <Text id="Admin Dashboard" />
                  </h2>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    <Text id="Manage users, notifications and system activity." />
                  </p>
                </div>

                <span className="font-semibold text-[var(--primary)]">
                  <Text id="Open dashboard →" />
                </span>
              </Link>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--heading)]">
        <UiText text={eyebrow} />
      </p>
      <h2 className="mt-1 text-xl font-bold text-[var(--heading)] sm:text-2xl">
        <UiText text={title} />
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--foreground-muted)]">
        <UiText text={description} />
      </p>
    </div>
  );
}

function MenuCard({
  href,
  icon,
  label,
  title,
  description,
  tone,
}: {
  href: string;
  icon: MenuIcon;
  label: string;
  title: string;
  description: string;
  tone: MenuTone;
}) {
  const cardClasses = {
    search:
      "border-[var(--primary)]/25 bg-[var(--primary)]/10",
    lost:
      "border-[var(--warning)]/25 bg-[var(--warning)]/15",
    found:
      "border-[var(--success)]/25 bg-[var(--success)]/15",
    matching:
      "border-[var(--success)]/20 bg-[var(--success)]/10",
    claims:
      "border-[var(--primary)]/10 bg-[var(--surface)]",
    support:
      "border-[var(--info)]/25 bg-[var(--info)]/15",
  }[tone];

  const iconClasses = {
    search:
      "bg-[var(--primary)]/15 text-[var(--primary)]",
    lost:
      "bg-[var(--warning)]/15 text-[var(--warning)]",
    found:
      "bg-[var(--success)]/15 text-[var(--success)]",
    matching:
      "bg-[var(--success)]/15 text-[var(--success)]",
    claims:
      "bg-[var(--primary-soft)] text-[var(--primary)]",
    support:
      "bg-[var(--info)]/15 text-[var(--info)]",
  }[tone];

  return (
    <Link
      href={href}
      className={`group flex min-h-52 flex-col rounded-[var(--radius-xl)] border p-5 shadow-[0_8px_24px_rgba(41,39,34,0.04)] transition duration-150 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(41,39,34,0.08)] ${cardClasses}`}
    >
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${iconClasses}`}
        >
          <MenuIcon name={icon} />
        </span>

        <span className="rounded-full bg-[var(--surface)]/70 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-[var(--foreground-muted)]">
          <UiText text={label} />
        </span>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold text-[var(--heading)]">
          <UiText text={title} />
        </h3>

        <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
          <UiText text={description} />
        </p>
      </div>

      <span className="mt-auto pt-5 text-sm font-semibold text-[var(--primary)]">
        <Text id="Open" />
        <span
          aria-hidden="true"
          className="ml-2 inline-block transition group-hover:translate-x-1"
        >
          →
        </span>
      </span>
    </Link>
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
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-4 transition hover:bg-[var(--surface-soft)] sm:px-5 ${showBorder ? "border-t border-[var(--border)]" : ""
        }`}
    >
      <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-2">
        <ActivityTypeBadge activity={activity} />
        <StatusBadge status={activity.status} />
      </div>

      <div className="min-w-0">
        <p className="truncate font-medium text-[var(--foreground)]">
          {activity.type === "CLAIM" ? <><Text id="Claim #" />{activity.title.slice(7)}</> : activity.title}
        </p>

        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          {new Date(activity.createdAt).toLocaleString()}
        </p>
      </div>


      <span
        aria-hidden="true"
        className="text-right text-lg text-[var(--foreground-muted)]"
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
      <UiText text={activity.label} />
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
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
  } else if (["HIDDEN", "CLOSED"].includes(status)) {
    classes =
      "bg-[var(--surface-soft)] text-[var(--foreground-muted)] border border-[var(--border)]";
  } else if (status === "REJECTED") {
    classes =
      "bg-[var(--danger-soft)] text-[var(--danger)]";
  }

  return (
    <span
      className={`w-fit max-w-full [overflow-wrap:anywhere] rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes}`}
    >
      <DisplayValue value={status} />
    </span>
  );
}

function MenuIcon({ name }: { name: MenuIcon | "safety" }) {
  if (name === "search") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }

  if (name === "lost") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 0 1 4.8 1c0 2-2.3 2.2-2.3 4" />
        <path d="M12 18h.01" />
      </svg>
    );
  }

  if (name === "found") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M5 7.5 12 4l7 3.5v9L12 20l-7-3.5Z" />
        <path d="m5 7.5 7 3.5 7-3.5" />
        <path d="M12 11v9" />
      </svg>
    );
  }

  if (name === "matching") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
      </svg>
    );
  }

  if (name === "claims") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M9 5h6" />
        <path d="M9 9h6" />
        <path d="M9 13h4" />
        <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      </svg>
    );
  }

  if (name === "support") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M4 12a8 8 0 0 1 16 0" />
        <path d="M4 12v5a2 2 0 0 0 2 2h2v-7H4Z" />
        <path d="M20 12v5a2 2 0 0 1-2 2h-2v-7h4Z" />
      </svg>
    );
  }

  return <SafetyOutlineIcon />;
}

function ActivityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M3 12h4l2-6 4 12 2-6h6" />
    </svg>
  );
}

function SafetyIcon() {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--danger-solid)] text-white shadow-sm">
      <SafetyOutlineIcon />
    </span>
  );
}

function SafetyOutlineIcon() {
  return (
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
      className="h-4 w-4 shrink-0 text-inherit dark:text-[var(--danger)]"
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
      className="h-4 w-4 shrink-0 text-inherit dark:text-[var(--danger)]"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
