import SafetyReviewCard from "@/components/staff/SafetyReviewCard";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function StaffSafetyPage() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const { data: incidents, error } = await supabase
    .from("security_incidents")
    .select(
      "id, reporter_id, title, description, location, incident_time, status, created_at"
    )
    .eq("status", "PENDING_REVIEW")
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-red-600">
            Staff Operations
          </p>

          <h1 className="mt-1 text-3xl font-bold text-stone-900">
            Safety Incident Review
          </h1>

          <p className="mt-2 text-stone-600">
            Review reported campus safety incidents before publication.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            Unable to load incidents: {error.message}
          </div>
        ) : !incidents || incidents.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="font-semibold text-stone-900">
              No pending incidents
            </h2>

            <p className="mt-2 text-sm text-stone-600">
              There are currently no safety incidents waiting for
              review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <SafetyReviewCard
                key={incident.id}
                incident={incident}
                staffId={staff.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}