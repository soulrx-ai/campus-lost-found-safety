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
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-stone-500">
            Staff Operations
          </p>

          <h1 className="mt-1 text-3xl font-bold text-stone-900">
            Claim Review & Handover
          </h1>

          <p className="mt-2 text-stone-600">
            Review ownership claims and confirm item handovers.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            Unable to load claims: {error.message}
          </div>
        ) : !claims || claims.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="font-semibold text-stone-900">
              No claims
            </h2>

            <p className="mt-2 text-sm text-stone-600">
              There are currently no claims to review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
      </div>
    </main>
  );
}