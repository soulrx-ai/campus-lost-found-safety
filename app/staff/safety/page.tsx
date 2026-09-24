import { Text } from "@/components/i18n/Text";
import StaffSafetyReviewList from "@/components/staff/StaffSafetyReviewList";
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
    .order("created_at", { ascending: false });

  return (
    <main className="page-shell" data-accent="safety">
      <div className="app-container">
        <div className="mx-auto max-w-5xl">
          <header className="page-header mb-7">
            <p className="text-sm font-semibold text-[var(--danger)]">
              <Text id="Staff Operations · Campus Safety" />
            </p>

            <h1 className="page-title">
              <Text id="Safety Incident Review" />
            </h1>

            <p className="page-description">
              <Text id="Review reported campus safety incidents before they are published for users." />
            </p>
          </header>

          {error ? (
            <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)]">
              <p className="font-semibold">
                <Text id="Unable to load incidents" />
              </p>
              <p className="mt-1">{error.message}</p>
            </div>
          ) : !incidents || incidents.length === 0 ? (
            <div className="ui-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-[var(--heading)]">
                <Text id="No pending incidents" />
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                <Text id="There are currently no safety incidents waiting for Staff review." />
              </p>
            </div>
          ) : (
            <StaffSafetyReviewList
              incidents={incidents}
              staffId={staff.id}
            />
          )}
        </div>
      </div>
    </main>
  );
}