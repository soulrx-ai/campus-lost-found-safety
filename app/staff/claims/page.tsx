import StaffClaimCard from "@/components/claims/StaffClaimCard";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

type ClaimStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export default async function StaffClaimsPage() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const { data: claims, error } = await supabase
    .from("claims")
    .select(
      "id, item_id, claimant_id, claim_reason, evidence, status, staff_note, created_at"
    )
    .in("status", [
      "PENDING_REVIEW",
      "APPROVED",
      "REJECTED",
      "COMPLETED",
    ])
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Staff Operations
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              Claim Review & Handover
            </h1>

            <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
              Review ownership claims and confirm item handovers.
            </p>
          </div>
        </section>

        <section className="mt-6">
          {error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
              <p className="font-semibold">Unable to load claims</p>
              <p className="mt-1">{error.message}</p>
            </div>
          ) : !claims || claims.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-semibold text-stone-900">
                No claims
              </h2>

              <p className="mt-2 text-sm leading-6 text-stone-600">
                There are currently no claims to review.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {claims.map((claim) => (
                <StaffClaimCard
                  key={claim.id}
                  claim={{
                    ...claim,
                    status: claim.status as ClaimStatus,
                  }}
                  staffId={staff.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}