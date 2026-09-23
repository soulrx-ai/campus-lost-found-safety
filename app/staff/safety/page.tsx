import SafetyReviewCard from "@/components/staff/SafetyReviewCard";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function StaffSafetyPage() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const { data: incidents, error } = await supabase
    .from("security_incidents")
    .select(
      "id, reporter_id, title, description, location, incident_time, image_url, status, created_at"
    )
    .eq("status", "PENDING_REVIEW")
    .order("created_at", { ascending: true });

  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-5xl">
          <header className="mb-7">
            <p className="text-sm font-semibold text-[var(--danger)]">
              Staff Operations · Campus Safety
            </p>

            <h1 className="page-title">
              Safety Incident Review
            </h1>

            <p className="page-description">
              Review reported campus safety incidents before they are
              published for users.
            </p>
          </header>

          {error ? (
            <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)]">
              <p className="font-semibold">
                Unable to load incidents
              </p>
              <p className="mt-1">{error.message}</p>
            </div>
          ) : !incidents || incidents.length === 0 ? (
            <div className="ui-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                No pending incidents
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                There are currently no safety incidents waiting for Staff
                review.
              </p>
            </div>
          ) : (
            <>
              <div className="ui-card mb-5 flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-[var(--foreground)]">
                    Review queue
                  </p>

                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    Oldest reports are shown first.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-[var(--danger-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--danger)]">
                  {incidents.length} pending
                </span>
              </div>

              <div className="space-y-5">
                {incidents.map((incident) => (
                  <SafetyReviewCard
                    key={incident.id}
                    incident={incident}
                    staffId={staff.id}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}